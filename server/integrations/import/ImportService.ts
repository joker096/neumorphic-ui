// Integration Hub — Import engine (blueprint §22 / §24 / §28 / §16).
// Phase 3: in-process pipeline (no BullMQ yet — queue wiring is a follow-up).
import { nanoid } from 'nanoid'
import { integrationManager } from '../core/IntegrationManager.js'
import { IntegrationError } from '../core/Connector.js'
import type { EntityType } from '../core/Connector.js'
import { EntityStore } from '../core/EntityStore.js'
import { ExternalIdStore } from '../core/ExternalIdStore.js'
import { MappingEngine, FieldMapping } from '../mapping/MappingEngine.js'
import { DeduplicationService } from '../identity/DeduplicationService.js'
import { ConflictEngine } from '../conflict/ConflictEngine.js'

export interface ImportSummary {
  total: number
  created: number
  updated: number
  duplicates: number
  reviewed: number
  errors: number
}

export class ImportService {
  private entities = new EntityStore()
  private externalIds = new ExternalIdStore()
  private dedup = new DeduplicationService(this.externalIds, this.entities)
  private conflicts = new ConflictEngine()

  runImport(
    integrationId: string,
    entityType: EntityType,
    sourceRecords: Record<string, unknown>[],
    mappings: FieldMapping[],
  ): ImportSummary {
    const rec = integrationManager.get(integrationId)
    if (!rec) throw new IntegrationError('NOT_FOUND', 'Integration not found')

    const summary: ImportSummary = {
      total: sourceRecords.length,
      created: 0,
      updated: 0,
      duplicates: 0,
      reviewed: 0,
      errors: 0,
    }

    for (const src of sourceRecords) {
      const mapped = MappingEngine.apply(src, mappings)
      if (mapped.errors.length) {
        summary.errors++
        continue
      }
      const c = mapped.canonical as { name?: string; email?: string; phone?: string; company?: string }
      const externalId = src['id'] as string | undefined
      const decision = this.dedup.decide(integrationId, entityType, externalId, c)

      if (decision.decision === 'AUTO' && decision.internalId) {
        const existing = this.entities.get(integrationId, entityType, decision.internalId)
        if (existing) {
          this.entities.upsert({
            ...existing,
            canonical: { ...existing.canonical, ...mapped.canonical, customFields: mapped.customFields },
          })
          summary.updated++
        } else {
          this.entities.upsert(makeEntity(decision.internalId, integrationId, entityType, mapped))
          summary.created++
        }
        if (externalId) this.externalIds.upsert(integrationId, entityType, externalId, decision.internalId)
        summary.duplicates++
      } else if (decision.decision === 'NEW') {
        const id = nanoid()
        this.entities.upsert(makeEntity(id, integrationId, entityType, mapped))
        if (externalId) this.externalIds.upsert(integrationId, entityType, externalId, id)
        summary.created++
      } else {
        // REVIEW — open a conflict record for manual resolution (§31/§32).
        this.conflicts.record({
          integrationId, entityType, internalId: decision.internalId ?? '', externalId: externalId ?? null,
          field: 'canonical', localValue: mapped.canonical, externalValue: mapped.canonical,
        })
        summary.reviewed++
      }
    }
    return summary
  }
}

function makeEntity(
  id: string,
  integrationId: string,
  entityType: EntityType,
  mapped: ReturnType<typeof MappingEngine.apply>,
) {
  return {
    id,
    integrationId,
    entityType,
    canonical: { ...mapped.canonical, customFields: mapped.customFields },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
