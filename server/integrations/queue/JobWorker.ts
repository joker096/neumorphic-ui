// Worker pipeline (blueprint §26): map → validate → identity → dedupe → write external id → audit.
import type { QueueJob } from './QueueProvider.js'
import { ImportService } from '../import/ImportService.js'

export async function processImportJob(job: QueueJob): Promise<void> {
  if (job.records.length === 0) return
  const svc = new ImportService()
  svc.runImport(job.integrationId, job.entityType, job.records, [])
}
