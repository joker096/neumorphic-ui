import { describe, it, expect } from 'vitest';
import { createCallSlice } from './callSlice';

const makeSlice = () => {
  let state: any = {};
  const set = (partial: any) => {
    const next = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...next };
  };
  const get = () => state;
  const slice = createCallSlice(set, get);
  state = { ...slice };
  return { slice, get };
};

describe('callSlice', () => {
  it('starts with a null activeCall and empty history', () => {
    const { slice } = makeSlice();
    expect(slice.activeCall).toBeNull();
    expect(slice.callHistory).toEqual([]);
  });

  it('setActiveCall sets the call and resets minimized', () => {
    const { slice, get } = makeSlice();
    const call = { id: 'c1' } as any;
    slice.setActiveCall(call);
    expect(get().activeCall).toBe(call);
    expect(get().callMinimized).toBe(false);
  });

  it('addCallToHistory prepends an entry', () => {
    const { slice, get } = makeSlice();
    slice.addCallToHistory({ name: 'Alice', type: 'missed' });
    slice.addCallToHistory({ name: 'Bob', type: 'outgoing' });
    const h = get().callHistory;
    expect(h).toHaveLength(2);
    expect(h[0].name).toBe('Bob');
    expect(h[0].id).toBeTruthy();
  });

  it('addCallToHistory stores a machine timestamp, not a host-locale string', () => {
    const { slice, get } = makeSlice();
    const before = Date.now();
    slice.addCallToHistory({ name: 'Alice', type: 'missed' });
    const entry = get().callHistory[0];
    expect(typeof entry.at).toBe('number');
    expect(entry.at).toBeGreaterThanOrEqual(before);
    expect(entry.time).toBeUndefined();
  });

  it('clearCallHistory empties history', () => {
    const { slice, get } = makeSlice();
    slice.addCallToHistory({ name: 'A', type: 'incoming' });
    slice.clearCallHistory();
    expect(get().callHistory).toEqual([]);
  });

  it('toggleFavorite flips isFavorite', () => {
    const { slice, get } = makeSlice();
    slice.addRecording({ id: 'r1', isFavorite: false });
    slice.toggleFavorite('r1');
    expect(get().recordings[0].isFavorite).toBe(true);
    slice.toggleFavorite('r1');
    expect(get().recordings[0].isFavorite).toBe(false);
  });

  it('deleteRecording removes by id', () => {
    const { slice, get } = makeSlice();
    slice.addRecording({ id: 'r1' });
    slice.addRecording({ id: 'r2' });
    slice.deleteRecording('r1');
    expect(get().recordings).toHaveLength(1);
    expect(get().recordings[0].id).toBe('r2');
  });
});
