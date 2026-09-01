// Integration Hub — XLSX import (blueprint §57). Requires optional `xlsx` dependency.
import { ImportService } from './ImportService.js'
import type { EntityType } from '../core/Connector.js'
import type { FieldMapping } from '../mapping/MappingEngine.js'

export interface XlsxResult {
  total: number
  status: 'parsed' | 'skipped'
  note?: string
}

export async function runXlsxImport(
  buffer: Buffer,
  integrationId: string,
  entityType: EntityType,
  mappings: FieldMapping[],
): Promise<XlsxResult> {
  // @ts-ignore optional dependency — run `npm i xlsx` to enable
  let XLSX: any
  try {
    // @ts-ignore optional dependency
    XLSX = await import('xlsx')
  } catch {
    return { total: 0, status: 'skipped', note: 'xlsx package not installed; run `npm i xlsx` to enable XLSX import.' }
  }
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const sheet = wb.SheetNames[0]
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet]) as Record<string, unknown>[]
  const summary = new ImportService().runImport(integrationId, entityType, rows, mappings)
  return { total: summary.total, status: 'parsed' }
}
