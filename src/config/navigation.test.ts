import { describe, it, expect } from 'vitest';
import { NAV_ITEMS, NAV_IDS, isCompanyAdmin } from './navigation';

describe('NAV_ITEMS', () => {
  it('exposes the 5 top-level menu items in order', () => {
    expect(NAV_ITEMS.map((i) => i.id)).toEqual(['chats', 'contacts', 'calls', 'company', 'workplace']);
  });

  it('every item has a non-empty label key and an icon', () => {
    for (const item of NAV_ITEMS) {
      expect(item.id).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.icon).toBeTruthy();
    }
  });

  it('only workplace is admin-gated', () => {
    expect(NAV_ITEMS.filter((i) => i.adminOnly).map((i) => i.id)).toEqual(['workplace']);
  });

  it('NAV_IDS mirrors NAV_ITEMS ids', () => {
    expect(NAV_IDS).toEqual(NAV_ITEMS.map((i) => i.id));
  });
});

describe('isCompanyAdmin', () => {
  it('is true when the user holds the admin role', () => {
    expect(isCompanyAdmin([{ userId: 'u1', role: 'member' }, { userId: 'u2', role: 'admin' }], 'u2')).toBe(true);
  });

  it('is false for a plain member', () => {
    expect(isCompanyAdmin([{ userId: 'u1', role: 'member' }, { userId: 'u2', role: 'admin' }], 'u1')).toBe(false);
  });

  it('is false when the user is not in the roster', () => {
    expect(isCompanyAdmin([{ userId: 'u1', role: 'admin' }], 'ghost')).toBe(false);
  });

  it('is false for an empty roster', () => {
    expect(isCompanyAdmin([], 'u1')).toBe(false);
  });

  it('matches case-sensitively on the admin role', () => {
    expect(isCompanyAdmin([{ userId: 'u1', role: 'Admin' }], 'u1')).toBe(false);
  });
});