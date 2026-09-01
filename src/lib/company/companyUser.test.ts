// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const idbStore = new Map<string, any>();
vi.mock('idb-keyval', () => ({
  get: vi.fn(async (k: string) => idbStore.get(k)),
  set: vi.fn(async (k: string, v: any) => { idbStore.set(k, v); }),
  del: vi.fn(async (k: string) => { idbStore.delete(k); }),
}));

import {
  generateUserId,
  generateCompanyId,
  generateInviteCode,
  createCompanyUser,
  getCurrentUser,
  saveCurrentUser,
  clearCurrentUser,
  saveMembers,
  getMembers,
  addMember,
  removeMember,
} from './companyUser';
import type { CompanyUser, CompanyMember } from './types';

beforeEach(() => {
  idbStore.clear();
});

describe('company user id generation', () => {
  it('generateUserId returns usr_-prefixed unique ids', () => {
    const a = generateUserId();
    const b = generateUserId();
    expect(a).toMatch(/^usr_/);
    expect(a).not.toBe(b);
  });

  it('generateCompanyId returns org_-prefixed unique ids', () => {
    const a = generateCompanyId();
    const b = generateCompanyId();
    expect(a).toMatch(/^org_/);
    expect(a).not.toBe(b);
  });

  it('generateInviteCode returns a non-empty code', () => {
    expect(generateInviteCode().length).toBeGreaterThan(0);
  });
});

describe('createCompanyUser / getCurrentUser', () => {
  it('creates a user and persists current user + keypair', async () => {
    const user = await createCompanyUser('Ada', 'org_x', 'admin');
    expect(user.displayName).toBe('Ada');
    expect(user.companyId).toBe('org_x');
    expect(user.role).toBe('admin');
    expect(user.userId).toMatch(/^usr_/);
    expect(user.publicKey).toBeInstanceOf(Uint8Array);
    expect(user.signatureKey).toBeInstanceOf(Uint8Array);
    expect(idbStore.get('current_company_user')).toBeDefined();
    expect(idbStore.get(`mess_company_user_keys_${user.userId}`)).toBeDefined();
  });

  it('round-trips keys through serialization', async () => {
    const user = await createCompanyUser('Ada', 'org_x');
    const restored = await getCurrentUser();
    expect(restored).not.toBeNull();
    expect(restored!.displayName).toBe('Ada');
    expect(restored!.publicKey).toBeInstanceOf(Uint8Array);
    expect(Buffer.from(restored!.publicKey)).toEqual(Buffer.from(user.publicKey));
    expect(Buffer.from(restored!.signatureKey)).toEqual(Buffer.from(user.signatureKey));
  });

  it('returns null when no current user exists', async () => {
    expect(await getCurrentUser()).toBeNull();
  });
});

describe('current user lifecycle', () => {
  it('saveCurrentUser then clearCurrentUser', async () => {
    const user: CompanyUser = {
      userId: 'usr_1', companyId: 'org_x', displayName: 'Ada',
      publicKey: new Uint8Array(0), signatureKey: new Uint8Array(0),
      devices: [], joinedAt: 1, role: 'member',
    };
    await saveCurrentUser(user);
    expect(await getCurrentUser()).not.toBeNull();
    await clearCurrentUser();
    expect(await getCurrentUser()).toBeNull();
  });
});

describe('members', () => {
  const member = (id: string, name: string): CompanyMember => ({
    userId: id, displayName: name, role: 'member', publicKey: 'pk',
    joinedAt: 1, lastActive: 1, online: false,
  });

  it('adds and lists members via storage key', async () => {
    await addMember(member('u1', 'Ada'));
    await addMember(member('u2', 'Bob'));
    const members = await getMembers();
    expect(members).toHaveLength(2);
    expect(members.map(m => m.userId)).toEqual(['u1', 'u2']);
  });

  it('addMember replaces by userId instead of duplicating', async () => {
    await addMember(member('u1', 'Ada'));
    await addMember({ ...member('u1', 'Ada2'), role: 'admin' });
    const members = await getMembers();
    expect(members).toHaveLength(1);
    expect(members[0].role).toBe('admin');
    expect(members[0].displayName).toBe('Ada2');
  });

  it('removeMember deletes by userId', async () => {
    await addMember(member('u1', 'Ada'));
    await addMember(member('u2', 'Bob'));
    await removeMember('u1');
    const members = await getMembers();
    expect(members.map(m => m.userId)).toEqual(['u2']);
  });

  it('getMembers returns [] when nothing stored', async () => {
    expect(await getMembers()).toEqual([]);
  });
});
