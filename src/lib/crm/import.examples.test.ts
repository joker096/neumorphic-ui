import { describe, it, expect } from 'vitest';
import { importFromText } from './import';
import { bitrixContactsToCrm } from './connectors/bitrix';
import { amoContactsToCrm } from './connectors/amo';
import { telegramContactsToCrm } from './connectors/telegram';

describe('Example: import from Telegram (CSV)', () => {
  it('maps a Telegram-style contacts CSV', () => {
    const csv = `name,phone,username
Ivan Petrov,+79110000000,ivanp
Maria,,maria`;
    const { result } = importFromText(csv);
    expect(result.contacts).toHaveLength(2);
    expect(result.contacts[0].phone).toBe('+79110000000');
    expect(result.contacts[1].displayName).toBe('Maria');
  });
});

describe('Example: import from Telegram export JSON', () => {
  it('maps exported contacts to CRM', () => {
    const rows = [{ first_name: 'Ivan', last_name: 'Petrov', phone_number: '+79110000000', username: 'ivanp' }];
    const contacts = telegramContactsToCrm(rows);
    expect(contacts[0].userId).toBe('tg_ivanp');
    expect(contacts[0].displayName).toBe('Ivan Petrov');
    expect(contacts[0].tags).toContain('telegram');
  });
});

describe('Example: import from Bitrix24', () => {
  it('maps a Bitrix contact list export', () => {
    const rows = [
      { ID: 1, NAME: 'Ivan', LAST_NAME: 'Petrov', EMAIL: 'a@b.c', PHONE: '123', STATUS_ID: 'CLIENT' },
      { ID: 2, NAME: 'Anna', STATUS_ID: 'LEAD' },
    ];
    const contacts = bitrixContactsToCrm(rows);
    expect(contacts).toHaveLength(2);
    expect(contacts[0].status).toBe('client');
    expect(contacts[0].email).toBe('a@b.c');
    expect(contacts[1].status).toBe('lead');
    expect(contacts[0].userId).toBe('bx_1');
  });
});

describe('Example: import from amoCRM', () => {
  it('maps an amo contact list export', () => {
    const rows = [
      {
        id: 10,
        name: 'Anna',
        status_id: 2,
        custom_fields_values: [
          { field_name: 'EMAIL', values: [{ value: 'x@y.z' }] },
          { field_name: 'PHONE', values: [{ value: '555' }] },
        ],
      },
    ];
    const contacts = amoContactsToCrm(rows);
    expect(contacts[0].status).toBe('client');
    expect(contacts[0].email).toBe('x@y.z');
    expect(contacts[0].phone).toBe('555');
    expect(contacts[0].userId).toBe('amo_10');
  });
});

describe('Example: mixed pipeline via universal importer', () => {
  it('builds deal + contact from a single Bitrix-style CSV row', () => {
    const csv = `name,email,status,deal,amount,stage
Boris,b@c.d,client,Big order,1200 USD,negotiation`;
    const { result } = importFromText(csv);
    expect(result.contacts).toHaveLength(1);
    expect(result.contacts[0].status).toBe('client');
    expect(result.deals).toHaveLength(1);
    expect(result.deals[0].amount).toBe(1200);
    expect(result.deals[0].currency).toBe('USD');
    expect(result.deals[0].stage).toBe('negotiation');
  });
});
