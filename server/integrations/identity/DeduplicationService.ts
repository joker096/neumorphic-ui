// Integration Hub — Deduplication (blueprint §28 / §29 / §30).
import type { EntityType } from '../core/Connector.js'
import { ExternalIdStore } from '../core/ExternalIdStore.js'
import { EntityStore, StoredEntity } from '../core/EntityStore.js'

export type DedupDecision = 'NEW' | 'AUTO' | 'REVIEW'

export interface DedupResult {
  decision: DedupDecision
  internalId?: string
  candidates?: StoredEntity[]
  score?: number
}

const SCORE = { phone: 50, email: 40, company: 10, name: 10 }

export interface DedupInput {
  name?: string
  email?: string
  phone?: string
  company?: string
}

export class DeduplicationService {
  constructor(
    private externalIds: ExternalIdStore,
    private entities: EntityStore,
  ) {}

  // Priority (§28): external_id → phone → email. Never name-only (§88).
  decide(
    integrationId: string,
    entityType: EntityType,
    externalId: string | undefined,
    canonical: DedupInput,
  ): DedupResult {
    if (externalId) {
      const linked = this.externalIds.get(integrationId, entityType, externalId)
      if (linked) return { decision: 'AUTO', internalId: linked }
    }

    const candidates: StoredEntity[] = []
    if (canonical.phone) candidates.push(...this.entities.findByPhone(integrationId, entityType, canonical.phone))
    if (canonical.email) candidates.push(...this.entities.findByEmail(integrationId, entityType, canonical.email))
    const unique = dedupeCandidates(candidates)
    if (unique.length === 0) return { decision: 'NEW' }

    const best = unique[0]
    const score = computeScore(canonical, best.canonical as Record<string, unknown>)
    if (score >= 90) return { decision: 'AUTO', internalId: best.id, score }
    if (score >= 70) return { decision: 'REVIEW', candidates: unique, score }
    return { decision: 'NEW', score }
  }
}

function dedupeCandidates(list: StoredEntity[]): StoredEntity[] {
  const seen = new Map<string, StoredEntity>()
  for (const e of list) if (!seen.has(e.id)) seen.set(e.id, e)
  return [...seen.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

function computeScore(c: DedupInput, existing: Record<string, unknown>): number {
  let s = 0
  if (c.phone && c.phone === existing.phone) s += SCORE.phone
  if (c.email && c.email === existing.email) s += SCORE.email
  if (c.company && c.company === existing.company) s += SCORE.company
  if (c.name && c.name === existing.name) s += SCORE.name
  return s
}
