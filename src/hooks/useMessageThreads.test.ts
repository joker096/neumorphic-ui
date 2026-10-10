import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMessageThreads } from './useMessageThreads';

const msg = (id: string | number, replyToId?: string | number, ts?: number) => ({
  id,
  ts: ts ?? (Number(id) || 1),
  text: `m${id}`,
  ...(replyToId != null ? { replyTo: { id: replyToId, sender: 'me' } } : {}),
});

describe('useMessageThreads', () => {
  it('reports zero replies for a history without quotes', () => {
    const { result } = renderHook(() => useMessageThreads([msg(1), msg(2)]));
    expect(result.current.countOf(1)).toBe(0);
    expect(result.current.isRoot(1)).toBe(false);
    expect(result.current.repliesOf(1)).toEqual([]);
  });

  it('groups a direct reply under its root', () => {
    const { result } = renderHook(() => useMessageThreads([msg(1), msg(2, 1)]));
    expect(result.current.isRoot(1)).toBe(true);
    expect(result.current.countOf(1)).toBe(1);
    expect(result.current.repliesOf(1).map((m) => m.id)).toEqual([2]);
    expect(result.current.rootOf(2).id).toBe(1);
  });

  it('collects transitive replies in send-time order', () => {
    const history = [msg(1, undefined, 100), msg(3, 2, 300), msg(2, 1, 200)];
    const { result } = renderHook(() => useMessageThreads(history));
    expect(result.current.countOf(1)).toBe(2);
    expect(result.current.repliesOf(1).map((m) => m.id)).toEqual([2, 3]);
  });

  it('treats a dangling quote as its own root instead of dropping it', () => {
    const { result } = renderHook(() => useMessageThreads([msg(2, 99)]));
    expect(result.current.countOf(2)).toBe(0);
    expect(result.current.rootOf(2).id).toBe(2);
  });

  it('matches a wire string quote to a numeric local id through String()', () => {
    const { result } = renderHook(() => useMessageThreads([msg(5), msg('wire-1', '5')]));
    expect(result.current.isRoot(5)).toBe(true);
    expect(result.current.countOf(5)).toBe(1);
  });

  it('does not hang on a reply cycle', () => {
    const { result } = renderHook(() => useMessageThreads([msg(1, 2), msg(2, 1)]));
    expect(result.current.rootOf(1)).toBeDefined();
    expect(result.current.rootOf(2)).toBeDefined();
  });

  it('ignores date separators', () => {
    const { result } = renderHook(() => useMessageThreads([msg(1), { id: 9, _isDateSeparator: true, replyTo: { id: 1, sender: 'me' } }]));
    expect(result.current.countOf(1)).toBe(0);
  });
});
