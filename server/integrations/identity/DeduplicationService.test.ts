import { describe, it, expect } from 'vitest'
import { DeduplicationService } from './DeduplicationService.js'
import type { ExternalIdStore } from '../core/ExternalIdStore.js'
import type { EntityStore, StoredEntity } from '../core/EntityStore.js'

function makeEntity(id: string, canonical: Record<string, unknown>, updatedAt = '2024-01-01'): StoredEntity {
  return { id, canonical, updatedAt } as unknown as StoredEntity
}

describe('DeduplicationService', () => {
  it('returns AUTO when an external id is already linked', () => {
    const ext = { get: () => 'int-1' } as unknown as ExternalIdStore
    const ent = { findByPhone: () => [], findByEmail: () => [] } as unknown as EntityStore
    const svc = new DeduplicationService(ext, ent)
    const r = svc.decide('org', 'contact', 'ext-9', {})
    expect(r.decision).toBe('AUTO')
    expect(r.internalId).toBe('int-1')
  })

  it('returns NEW when no candidate matches', () => {
    const ext = { get: () => undefined } as unknown as ExternalIdStore
    const ent = { findByPhone: () => [], findByEmail: () => [] } as unknown as EntityStore
    const svc = new DeduplicationService(ext, ent)
    const r = svc.decide('org', 'contact', undefined, { email: 'a@b.c' })
    expect(r.decision).toBe('NEW')
  })

  it('returns AUTO when phone+email score >= 90', () => {
    const ext = { get: () => undefined } as unknown as ExternalIdStore
    const ent = {
      findByPhone: () => [makeEntity('e1', { phone: '+7999', email: 'a@b.c' })],
      findByEmail: () => [makeEntity('e1', { phone: '+7999', email: 'a@b.c' })],
    } as unknown as EntityStore
    const svc = new DeduplicationService(ext, ent)
    const r = svc.decide('org', 'contact', undefined, { phone: '+7999', email: 'a@b.c' })
    expect(r.decision).toBe('AUTO')
    expect(r.score).toBe(90)
  })

  it('returns REVIEW when 70 <= score < 90', () => {
    const ext = { get: () => undefined } as unknown as ExternalIdStore
    const ent = {
      findByPhone: () => [makeEntity('e1', { phone: '+7999', company: 'ACME', name: 'Bob' })],
      findByEmail: () => [],
    } as unknown as EntityStore
    const svc = new DeduplicationService(ext, ent)
    const r = svc.decide('org', 'contact', undefined, { phone: '+7999', company: 'ACME', name: 'Bob' })
    expect(r.decision).toBe('REVIEW')
    expect(r.score).toBe(70)
  })
})
