import { describe, it, expect } from 'vitest'
import { CHAT_FOLDER_KEYS, CRM_SEGMENT_KEYS } from './chatConstants'

describe('CHAT_FOLDER_KEYS', () => {
  it('lists the six canonical chat folders in filter-bar order', () => {
    expect(CHAT_FOLDER_KEYS).toEqual([
      'all',
      'personal',
      'unread',
      'work',
      'groups',
      'archived',
    ])
  })

  it('has no duplicate folder ids', () => {
    expect(new Set(CHAT_FOLDER_KEYS).size).toBe(CHAT_FOLDER_KEYS.length)
  })
})

describe('CRM_SEGMENT_KEYS', () => {
  it('lists the sales-segment folders', () => {
    expect(CRM_SEGMENT_KEYS).toEqual(['leads', 'clients'])
  })

  it('does not collide with the system folders', () => {
    const system = new Set<string>(CHAT_FOLDER_KEYS)
    expect(CRM_SEGMENT_KEYS.some((k) => system.has(k))).toBe(false)
  })
})