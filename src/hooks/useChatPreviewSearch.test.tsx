import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatPreviewSearch } from './useChatPreviewSearch';

const day = (d: number, h = 10) => new Date(2024, 4, d, h).getTime();
const msg = (id: number, d: number) => ({ id, sender: 'me', type: 'text', text: `m${id}`, time: '10:00', ts: day(d) });

const args = (history: any[]) => ({
  chat: { id: 'c1', history },
  savedMessages: [],
  scheduledMessages: [],
  lang: 'en',
  t: (k: string, f?: string) => f ?? k,
});

describe('date filter', () => {
  it('filters by real send times, not by array index', () => {
    const { result } = renderHook(() => useChatPreviewSearch(args([msg(1, 10), msg(2, 12)])));
    act(() => result.current.setFilterStartDate('2024-05-11'));
    expect(result.current.filteredHistory.map((m: any) => m.id)).toEqual([2]);
  });

  it('treats the end date as the whole day', () => {
    const { result } = renderHook(() => useChatPreviewSearch(args([msg(1, 10), msg(2, 12)])));
    act(() => result.current.setFilterEndDate('2024-05-10'));
    expect(result.current.filteredHistory.map((m: any) => m.id)).toEqual([1]);
  });

  it('drops messages with no send time while a date filter is active', () => {
    const undated = { id: 'u1', sender: 'me', type: 'text', text: 'x' };
    const { result } = renderHook(() => useChatPreviewSearch(args([undated, msg(1, 10)])));
    act(() => result.current.setFilterStartDate('2024-05-01'));
    expect(result.current.filteredHistory.map((m: any) => m.id)).toEqual([1]);
  });
});

describe('jumpToDate', () => {
  const withRef = (items: any[]) => {
    const { result } = renderHook(() => useChatPreviewSearch(args(items)));
    const scrollToIndex = vi.fn();
    result.current.msgListRef.current = { scrollToBottom: vi.fn(), scrollToIndex };
    return { result, scrollToIndex };
  };

  it('scrolls to the first bubble of the chosen day', () => {
    const { result, scrollToIndex } = withRef([msg(1, 9), msg(2, 12), msg(3, 14)]);
    let ok = false;
    act(() => { ok = result.current.jumpToDate('2024-05-12'); });
    expect(ok).toBe(true);
    expect(scrollToIndex).toHaveBeenCalledTimes(1);
    expect(result.current.flatItems[scrollToIndex.mock.calls[0][0]].id).toBe(2);
  });

  it('reports false for a date newer than the chat', () => {
    const { result, scrollToIndex } = withRef([msg(1, 9)]);
    let ok = true;
    act(() => { ok = result.current.jumpToDate('2030-01-01'); });
    expect(ok).toBe(false);
    expect(scrollToIndex).not.toHaveBeenCalled();
  });
});
