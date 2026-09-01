import { describe, it, expect } from 'vitest';
import { MappingEngine, type FieldMapping } from './MappingEngine.js';

describe('MappingEngine', () => {
  it('normalizes email + trims name into canonical core fields', () => {
    const mappings: FieldMapping[] = [
      { sourceField: 'Name', targetField: 'name', transform: 'trim' },
      { sourceField: 'Email', targetField: 'email', transform: 'normalizeEmail' },
    ];
    const out = MappingEngine.apply({ Name: '  Bob ', Email: 'BOB@X.COM' }, mappings);
    expect(out.canonical.name).toBe('Bob');
    expect(out.canonical.email).toBe('bob@x.com');
    expect(out.errors).toHaveLength(0);
  });

  it('pushes non-core fields to customFields', () => {
    const mappings: FieldMapping[] = [{ sourceField: 'City', targetField: 'city', transform: 'trim' }];
    const out = MappingEngine.apply({ City: 'Moscow' }, mappings);
    expect(out.customFields.city).toBe('Moscow');
  });

  it('reports a VALIDATION error for missing required field', () => {
    const mappings: FieldMapping[] = [{ sourceField: 'Email', targetField: 'email', required: true }];
    const out = MappingEngine.apply({}, mappings);
    expect(out.errors).toHaveLength(1);
    expect(out.errors[0].code).toBe('VALIDATION');
  });

  it('applies mapEnum via enumMap', () => {
    const mappings: FieldMapping[] = [
      { sourceField: 'Status', targetField: 'status', transform: 'mapEnum', enumMap: { N: 'NEW', W: 'WON' } },
    ];
    const out = MappingEngine.apply({ Status: 'W' }, mappings);
    expect(out.customFields.status).toBe('WON');
  });
});
