// In-memory queue (Phase 1). Production target = BullMQ over Redis (blueprint §25).
import type { QueueJob, QueueProvider } from './QueueProvider.js'
import { processImportJob } from './JobWorker.js'

export class MemoryQueue implements QueueProvider {
  private pending: QueueJob[] = []
  async enqueue(job: QueueJob): Promise<void> {
    this.pending.push(job)
    // Fire-and-forget worker, mirroring BullMQ async semantics.
    void processImportJob(job).catch((e) => console.error('[integrations] job failed', job.jobId, e))
  }
  pendingCount(): number {
    return this.pending.length
  }
}
