import { describe, it, expect, beforeEach, vi } from 'vitest'

const processImportJob = vi.fn()
vi.mock('./JobWorker.js', () => ({ processImportJob: (job: unknown) => processImportJob(job) }))

import { MemoryQueue, QUEUE_MAX_PENDING } from './MemoryQueue.js'
import { IntegrationError } from '../core/Connector.js'

function job(jobId: string) {
  return { jobId, integrationId: 'int_1', entityType: 'contact' as const, records: [] }
}

describe('MemoryQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    processImportJob.mockResolvedValue(undefined)
  })

  it('runs the job and returns to an empty depth', async () => {
    const q = new MemoryQueue()
    q.enqueue(job('a'))
    expect(processImportJob).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => expect(q.pendingCount()).toBe(0))
  })

  it('counts a job as in flight while the worker runs', async () => {
    let release: () => void = () => {}
    processImportJob.mockImplementation(() => new Promise<void>((r) => { release = r }))
    const q = new MemoryQueue()
    q.enqueue(job('a'))
    expect(q.pendingCount()).toBe(1)
    release()
    await vi.waitFor(() => expect(q.pendingCount()).toBe(0))
  })

  it('frees the slot when the worker rejects', async () => {
    processImportJob.mockRejectedValue(new Error('boom'))
    const q = new MemoryQueue()
    q.enqueue(job('a'))
    await vi.waitFor(() => expect(q.pendingCount()).toBe(0))
  })

  it('collapses a duplicate job id instead of running it twice', async () => {
    const q = new MemoryQueue()
    q.enqueue(job('same'))
    q.enqueue(job('same'))
    expect(processImportJob).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => expect(q.pendingCount()).toBe(0))
  })

  it('runs the same id again after it completed', async () => {
    const q = new MemoryQueue()
    q.enqueue(job('same'))
    await vi.waitFor(() => expect(q.pendingCount()).toBe(0))
    q.enqueue(job('same'))
    expect(processImportJob).toHaveBeenCalledTimes(2)
  })

  it('rejects with RATE_LIMIT instead of buffering past the cap', () => {
    processImportJob.mockImplementation(() => new Promise<void>(() => {})) // never settles
    const q = new MemoryQueue()
    for (let i = 0; i < QUEUE_MAX_PENDING; i++) q.enqueue(job(`j${i}`))
    expect(q.pendingCount()).toBe(QUEUE_MAX_PENDING)
    expect(() => q.enqueue(job('overflow'))).toThrowError(IntegrationError)
    try {
      q.enqueue(job('overflow2'))
    } catch (e) {
      expect((e as IntegrationError).code).toBe('RATE_LIMIT')
      expect((e as IntegrationError).retryable).toBe(true)
    }
    // The rejected ids were not remembered, so they can be retried once space frees.
    expect(() => q.enqueue(job('overflow'))).toThrowError(IntegrationError)
  })

  it('does not count a rejected job against the depth', () => {
    processImportJob.mockImplementation(() => new Promise<void>(() => {}))
    const q = new MemoryQueue()
    for (let i = 0; i < QUEUE_MAX_PENDING + 5; i++) {
      try { q.enqueue(job(`j${i}`)) } catch { /* expected past the cap */ }
    }
    expect(q.pendingCount()).toBe(QUEUE_MAX_PENDING)
  })
})
