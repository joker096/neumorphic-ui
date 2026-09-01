// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { AccountManager } from './accountManager';

describe('AccountManager', () => {
  it('creates account and persists it', () => {
    const m = new AccountManager();
    const { id } = m.createAccount('u1', 'Alice', 'pk1');
    expect(id).toBeTruthy();
    expect(m.getAccount(id)).toMatchObject({ userId: 'u1', name: 'Alice', publicKey: 'pk1' });
    expect(typeof m.getAccount(id)!.lastActive).toBe('number');
  });

  it('adds account without id', () => {
    const m = new AccountManager();
    const { id } = m.addAccount({ userId: 'u2', name: 'Bob', publicKey: 'pk2' });
    expect(m.getAccount(id)!.name).toBe('Bob');
  });

  it('switchAccount marks lastActive and returns true', async () => {
    const m = new AccountManager();
    const { id } = m.createAccount('u1', 'A', 'pk');
    expect(m.switchAccount(id)).toBe(true);
    const before = m.getAccount(id)!.lastActive!;
    await new Promise((r) => setTimeout(r, 5));
    expect(m.switchAccount(id)).toBe(true);
    expect(m.getAccount(id)!.lastActive!).toBeGreaterThanOrEqual(before);
  });

  it('switchAccount returns false for unknown id', () => {
    expect(new AccountManager().switchAccount('nope')).toBe(false);
  });

  it('getAccounts lists all accounts', () => {
    const m = new AccountManager();
    m.createAccount('u1', 'A', 'pk');
    m.createAccount('u2', 'B', 'pk');
    expect(m.getAccounts().length).toBe(2);
  });

  it('deleteAccount returns true and removes', () => {
    const m = new AccountManager();
    const { id } = m.createAccount('u1', 'A', 'pk');
    expect(m.deleteAccount(id)).toBe(true);
    expect(m.getAccount(id)).toBeNull();
  });

  it('deleteAccount returns false for missing id', () => {
    expect(new AccountManager().deleteAccount('x')).toBe(false);
  });

  it('updateAccount merges updates', () => {
    const m = new AccountManager();
    const { id } = m.createAccount('u1', 'A', 'pk');
    expect(m.updateAccount(id, { name: 'Renamed', avatar: 'a.png' })).toBe(true);
    expect(m.getAccount(id)).toMatchObject({ name: 'Renamed', avatar: 'a.png', publicKey: 'pk' });
  });

  it('updateAccount returns false for missing id', () => {
    expect(new AccountManager().updateAccount('x', { name: 'n' })).toBe(false);
  });
});
