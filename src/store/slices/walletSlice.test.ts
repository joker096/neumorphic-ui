import { describe, it, expect } from 'vitest';
import { createWalletSlice, selectWalletBalance } from './walletSlice';

const createTestSlice = () => {
  let state: any = {};
  const set = (fn: any) => {
    const next = typeof fn === 'function' ? fn(state) : fn;
    state = { ...state, ...next };
  };
  const get = () => state;
  const slice = createWalletSlice(set, get);
  state = { ...state, ...slice };
  return { slice, get };
};

describe('walletSlice', () => {
  it('starts empty with wallet enabled', () => {
    const { get } = createTestSlice();
    expect(get().transactions).toEqual([]);
    expect(get().walletEnabled).toBe(true);
    expect(get().biometricEnabled).toBe(true);
    expect(get().walletCurrency).toBe('USD');
  });

  it('records a pending top-up transaction without changing balance', () => {
    const { get, slice } = createTestSlice();
    slice.walletTransactionStart('topup', 25, 'Top up', 'tokA');
    expect(get().transactions).toHaveLength(1);
    expect(get().transactions[0]).toMatchObject({ type: 'topup', amount: 25, status: 'pending', token: 'tokA', title: 'Top up' });
    expect(selectWalletBalance(get().transactions)).toBe(0);
  });

  it('records a send as negative amount', () => {
    const { get, slice } = createTestSlice();
    slice.walletTransactionStart('send', 8, 'Send', 'tokB');
    expect(get().transactions[0].amount).toBe(-8);
  });

  it('credits balance on successful resolve', () => {
    const { get, slice } = createTestSlice();
    slice.walletTransactionStart('topup', 50, 'Top up', 'tokA');
    slice.walletTransactionResolve('tokA', true);
    expect(get().transactions[0].status).toBe('success');
    expect(selectWalletBalance(get().transactions)).toBe(50);
  });

  it('debits balance on successful send resolve', () => {
    const { get, slice } = createTestSlice();
    slice.walletTransactionStart('send', 20, 'Send', 'tokB');
    slice.walletTransactionResolve('tokB', true);
    expect(get().transactions[0].status).toBe('success');
    expect(selectWalletBalance(get().transactions)).toBe(-20);
  });

  it('marks failed on unsuccessful resolve without balance change', () => {
    const { get, slice } = createTestSlice();
    slice.walletTransactionStart('topup', 10, 'Top up', 'tokA');
    slice.walletTransactionResolve('tokA', false);
    expect(get().transactions[0].status).toBe('failed');
    expect(selectWalletBalance(get().transactions)).toBe(0);
  });

  it('ignores resolve for unknown or already resolved token', () => {
    const { get, slice } = createTestSlice();
    slice.walletTransactionResolve('missing', true);
    slice.walletTransactionStart('topup', 10, 'Top up', 'tokA');
    slice.walletTransactionResolve('tokA', true);
    slice.walletTransactionResolve('tokA', false);
    expect(get().transactions[0].status).toBe('success');
    expect(selectWalletBalance(get().transactions)).toBe(10);
  });

  it('toggles wallet and biometric flags', () => {
    const { get, slice } = createTestSlice();
    slice.setWalletEnabled(false);
    slice.setBiometricEnabled(false);
    expect(get().walletEnabled).toBe(false);
    expect(get().biometricEnabled).toBe(false);
  });
});
