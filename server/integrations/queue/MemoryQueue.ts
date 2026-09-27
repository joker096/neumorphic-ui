// In-memory queue (Phase 1). Production target = BullMQ over Redis (blueprint §25).
//
// The queue used to push every job into an array that was never drained and
// whose jobs were started fire-and-forget, so a webhook flood (the endpoint is
// unauthenticated) grew the process until it died. It is now bounded: depth is
// capped, work is accounted while in flight, and duplicate job ids collapse.
import type { QueueJob, QueueProvider } from './QueueProvider.js'
import { processImportJob } from './JobWorker.js'
import { IntegrationError } from '../core/Connector.js'

/** Max jobs queued *or* in flight. Overflow is rejected, never buffered. */
export const QUEUE_MAX_PENDING = 1000

export class MemoryQueue implements QueueProvider {
  private inFlight = 0
  private jobIds = new Set<string>()

  /**
   * Accepts synchronously so an overflowing queue surfaces as a rejection to
   * the caller (429) instead of an unhandled promise rejection.
   * Throws `IntegrationError('RATE_LIMIT')` when full.
   */
  enqueue(job: QueueJob): void {
    if (job.jobId) {
      // Idempotent: the same job id is only ever run once concurrently.
      if (this.jobIds.has(job.jobId)) return
      this.jobIds.add(job.jobId)
    }
    if (this.inFlight >= QUEUE_MAX_PENDING) {
      if (job.jobId) this.jobIds.delete(job.jobId)
      throw new IntegrationError('RATE_LIMIT', 'integration queue is full', true)
    }
    this.inFlight++
    // Fire-and-forget worker, mirroring BullMQ async semantics.
    void processImportJob(job)
      .catch((e) => console.error('[integrations] job failed', job.jobId, e))
      .finally(() => {
        this.inFlight--
        if (job.jobId) this.jobIds.delete(job.jobId)
      })
  }

  /** Jobs queued or currently in flight. */
  pendingCount(): number {
    return this.inFlight
  }
}
