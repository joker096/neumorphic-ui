import { describe, it, expect } from 'vitest';
import { bitrixContactToCrm, bitrixStatusToCrm } from './bitrix';
import { amoContactToCrm, amoStatusToCrm } from './amo';

describe('Bitrix connector', () => {
  it('maps status id to CRM status', () => {
    expect(bitrixStatusToCrm('CLIENT')).toBe('client');
    expect(bitrixStatusToCrm('VIP')).toBe('vip');
    expect(bitrixStatusToCrm(undefined)).toBe('lead');
  });

  it('maps a contact row', () => {
    const c = bitrixContactToCrm({
      ID: 5, NAME: 'Ivan', LAST_NAME: 'Petrov', EMAIL: 'a@b.c', PHONE: '123', STATUS_ID: 'VIP',
    });
    expect(c.displayName).toBe('Ivan Petrov');
    expect(c.status).toBe('vip');
    expect(c.userId).toBe('bx_5');
    expect(c.email).toBe('a@b.c');
  });
});

describe('amoCRM connector', () => {
  it('maps status id to CRM status', () => {
    expect(amoStatusToCrm(6)).toBe('vip');
    expect(amoStatusToCrm(2)).toBe('client');
    expect(amoStatusToCrm(undefined)).toBe('lead');
  });

  it('maps a contact row with custom fields', () => {
    const c = amoContactToCrm({
      id: 7, name: 'Anna', status_id: 2,
      custom_fields_values: [
        { field_name: 'EMAIL', values: [{ value: 'x@y.z' }] },
        { field_name: 'PHONE', values: [{ value: '555' }] },
      ],
    });
    expect(c.displayName).toBe('Anna');
    expect(c.email).toBe('x@y.z');
    expect(c.phone).toBe('555');
    expect(c.status).toBe('client');
  });
});
