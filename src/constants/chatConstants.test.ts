import { describe, it, expect } from 'vitest'
import { CHAT_FOLDER_KEYS } from './chatConstants'

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