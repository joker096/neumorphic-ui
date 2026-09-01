// Integration Hub — CSV import (blueprint §56). Dependency-free MVP parser.
import { ImportService } from './ImportService.js'
import type { EntityType } from '../core/Connector.js'
import type { FieldMapping } from '../mapping/MappingEngine.js'

export interface CsvImportResult {
  processed: number
  created: number
  updated: number
  duplicates: number
  reviewed: number
  errors: number
}

export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const delimiter = text.includes('\t') ? '\t' : (!text.includes(',') && text.includes(';') ? ';' : ',')
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = splitCsvLine(lines[0], delimiter).map((h) => h.trim())
  const rows = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line, delimiter)
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = (cells[i] ?? '').trim() })
    return obj
  })
  return { headers, rows }
}

function splitCsvLine(line: string, d: string): string[] {
  // Basic split (no quoted-delimiter handling — sufficient for MVP import).
  return line.split(d)
}

export function runCsvImport(
  integrationId: string,
  entityType: EntityType,
  text: string,
  mappings: FieldMapping[],
): CsvImportResult {
  const { rows } = parseCsv(text)
  const summary = new ImportService().runImport(
    integrationId, entityType, rows as Record<string, unknown>[], mappings,
  )
  return {
    processed: summary.total,
    created: summary.created,
    updated: summary.updated,
    duplicates: summary.duplicates,
    reviewed: summary.reviewed,
    errors: summary.errors,
  }
}
