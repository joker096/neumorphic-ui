// Integration Hub — Mapping Engine (blueprint §16 / §17). Pure TS, no deps.
import type { CanonicalEntity } from '../core/Connector.js';

export type TransformName =
  | 'normalizePhone'
  | 'normalizeEmail'
  | 'trim'
  | 'parseDate'
  | 'parseNumber'
  | 'mapEnum'
  | 'defaultIfEmpty'
  | 'splitList';

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transform?: TransformName;
  enumMap?: Record<string, string>; // for mapEnum
  default?: unknown;
  required?: boolean;
}

export interface MappingResult {
  canonical: Partial<CanonicalEntity>;
  customFields: Record<string, unknown>;
  errors: { field: string; code: string; message: string }[];
  warnings: { field: string; message: string }[];
}

const transforms: Record<TransformName, (v: unknown, m: FieldMapping) => unknown> = {
  normalizePhone: (v) => (typeof v === 'string' ? v.replace(/[^\d+]/g, '') : v),
  normalizeEmail: (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v),
  trim: (v) => (typeof v === 'string' ? v.trim() : v),
  parseDate: (v) => {
    if (typeof v !== 'string') return v;
    const t = Date.parse(v);
    return Number.isNaN(t) ? v : new Date(t).toISOString();
  },
  parseNumber: (v) => (typeof v === 'string' ? Number(v.replace(',', '.')) : v),
  mapEnum: (v, m) => (m.enumMap && typeof v === 'string' ? (m.enumMap[v] ?? v) : v),
  defaultIfEmpty: (v, m) => (v === undefined || v === null || v === '' ? m.default : v),
  splitList: (v) => (typeof v === 'string' ? v.split(/[;,]/).map((s) => s.trim()).filter(Boolean) : v),
};

function isEmpty(v: unknown): boolean {
  return v === undefined || v === null || v === '';
}

export class MappingEngine {
  static apply(
    source: Record<string, unknown>,
    mappings: FieldMapping[],
  ): MappingResult {
    const canonical: Partial<CanonicalEntity> = {};
    const customFields: Record<string, unknown> = {};
    const errors: MappingResult['errors'] = [];
    const warnings: MappingResult['warnings'] = [];

    for (const m of mappings) {
      let value = source[m.sourceField];
      if (m.transform) value = transforms[m.transform](value, m);
      if (isEmpty(value) && m.default !== undefined) value = m.default;

      if (m.required && isEmpty(value)) {
        errors.push({ field: m.targetField, code: 'VALIDATION', message: `required field ${m.sourceField} missing` });
        continue;
      }
      if (['name', 'email', 'phone'].includes(m.targetField)) {
        (canonical as Record<string, unknown>)[m.targetField] = value;
      } else if (m.targetField.startsWith('custom.')) {
        customFields[m.targetField.slice(7)] = value;
      } else {
        customFields[m.targetField] = value;
        warnings.push({ field: m.targetField, message: 'stored in customFields (no core column)' });
      }
    }
    return { canonical, customFields, errors, warnings };
  }
}
