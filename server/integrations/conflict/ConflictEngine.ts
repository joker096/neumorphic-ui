// Integration Hub — Conflict engine (blueprint §31 / §32 / §33).
import { nanoid } from 'nanoid'
import { ConflictStore, StoredConflict } from '../core/ConflictStore.js'

export type ConflictStrategy = 'SOURCE_WINS' | 'TARGET_WINS' | 'LAST_WRITE_WINS' | 'MANUAL' | 'MERGE'

export interface ConflictInput {
  integrationId: string
  entityType: string
  internalId: string
  externalId: string | null
  field: string
  localValue: unknown
  externalValue: unknown
  localUpdatedAt?: string
  externalUpdatedAt?: string
}

export class ConflictEngine {
  private store = new ConflictStore()
  record(input: ConflictInput): StoredConflict {
    const c: StoredConflict = {
      id: nanoid(), integrationId: input.integrationId, entityType: input.entityType, internalId: input.internalId,
      externalId: input.externalId, field: input.field, localValue: input.localValue, externalValue: input.externalValue,
      localUpdatedAt: input.localUpdatedAt ?? null, externalUpdatedAt: input.externalUpdatedAt ?? null,
      strategy: 'MANUAL', status: 'OPEN', resolvedBy: null, resolvedAt: null,
    }
    this.store.upsert(c)
    return c
  }
  listOpen(integrationId: string): StoredConflict[] {
    return this.store.listOpen(integrationId)
  }
  resolve(id: string, strategy: ConflictStrategy, resolvedBy: string): StoredConflict | undefined {
    this.store.resolve(id, strategy, resolvedBy)
    return this.store.get(id)
  }
}
