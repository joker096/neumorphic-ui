import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppView } from './useAppView';

describe('useAppView', () => {
  it('initializes with chats view', () => {
    const { result } = renderHook(() => useAppView());
    expect(result.current.view).toBe('chats');
  });

  it('initializes with null subView', () => {
    const { result } = renderHook(() => useAppView());
    expect(result.current.subView).toBeNull();
  });

  it('initializes with all folder', () => {
    const { result } = renderHook(() => useAppView());
    expect(result.current.activeFolder).toBe('all');
  });

  it('initializes with null activeChat', () => {
    const { result } = renderHook(() => useAppView());
    expect(result.current.activeChat).toBeNull();
  });

  it('changes view via setView', () => {
    const { result } = renderHook(() => useAppView());

    act(() => {
      result.current.setView('settings');
    });

    expect(result.current.view).toBe('settings');
  });

  it('changes subView via setSubView', () => {
    const { result } = renderHook(() => useAppView());

    act(() => {
      result.current.setSubView('profile');
    });

    expect(result.current.subView).toBe('profile');
  });

  it('resets subView to null when navigating', () => {
    const { result } = renderHook(() => useAppView());

    act(() => {
      result.current.setSubView('profile');
    });

    act(() => {
      result.current.handleNavigate('calls');
    });

    expect(result.current.subView).toBeNull();
    expect(result.current.view).toBe('calls');
  });

  it('resets activeChat to null when navigating', () => {
    const { result } = renderHook(() => useAppView());

    act(() => {
      result.current.setActiveChat({ id: 1, name: 'Test' });
    });

    act(() => {
      result.current.handleNavigate('hub');
    });

    expect(result.current.activeChat).toBeNull();
  });

  it('changes activeFolder', () => {
    const { result } = renderHook(() => useAppView());

    act(() => {
      result.current.setActiveFolder('unread');
    });

    expect(result.current.activeFolder).toBe('unread');
  });

  it('changes activeChat', () => {
    const { result } = renderHook(() => useAppView());

    act(() => {
      result.current.setActiveChat({ id: 1, name: 'Test' });
    });

    expect(result.current.activeChat).toEqual({ id: 1, name: 'Test' });
  });
});