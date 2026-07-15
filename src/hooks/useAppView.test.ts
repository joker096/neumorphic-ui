import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppView } from './useAppView';

describe('useAppView', () => {
  it('should start with default chats view', () => {
    const { result } = renderHook(() => useAppView());
    expect(result.current.view).toBe('chats');
    expect(result.current.subView).toBeNull();
    expect(result.current.activeFolder).toBe('all');
    expect(result.current.activeChat).toBeNull();
  });

  it('should navigate to a different view', () => {
    const { result } = renderHook(() => useAppView());
    act(() => {
      result.current.handleNavigate('settings');
    });
    expect(result.current.view).toBe('settings');
    expect(result.current.subView).toBeNull();
    expect(result.current.activeChat).toBeNull();
  });

  it('should set subView', () => {
    const { result } = renderHook(() => useAppView());
    act(() => {
      result.current.setSubView('profile');
    });
    expect(result.current.subView).toBe('profile');
  });

  it('should clear subView on navigate', () => {
    const { result } = renderHook(() => useAppView());
    act(() => {
      result.current.setSubView('details');
      result.current.handleNavigate('chats');
    });
    expect(result.current.subView).toBeNull();
  });

  it('should set activeFolder', () => {
    const { result } = renderHook(() => useAppView());
    act(() => {
      result.current.setActiveFolder('unread');
    });
    expect(result.current.activeFolder).toBe('unread');
  });

  it('should set and clear activeChat', () => {
    const { result } = renderHook(() => useAppView());
    const chat = { id: 1, name: 'Test Chat' };
    act(() => {
      result.current.setActiveChat(chat);
    });
    expect(result.current.activeChat).toEqual(chat);
    act(() => {
      result.current.handleNavigate('settings');
    });
    expect(result.current.activeChat).toBeNull();
  });
});
