import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilteredChats } from './useFilteredChats';

describe('useFilteredChats', () => {
  it('returns all chats when no search query and no filters', () => {
    const chats = [
      { id: 1, name: 'Alice', message: 'Hello', history: [], unread: 2 },
      { id: 2, name: 'Bob', message: 'Hi', history: [], unread: 0 },
    ];
    const channels = [];
    const { result } = renderHook(() =>
      useFilteredChats(chats, '', 'all', [], { hasMedia: false, hasAudio: false, hasReplies: false, fromBots: false, priority: false }, channels),
    );

    expect(result.current.filteredChats).toHaveLength(2);
  });

  it('filters chats by search query matching name', () => {
    const chats = [
      { id: 1, name: 'Alice', message: 'Hello', history: [], unread: 2 },
      { id: 2, name: 'Bob', message: 'Hi', history: [], unread: 0 },
    ];
    const channels = [];
    const { result } = renderHook(() =>
      useFilteredChats(chats, 'alice', 'all', [], { hasMedia: false, hasAudio: false, hasReplies: false, fromBots: false, priority: false }, channels),
    );

    expect(result.current.filteredChats).toHaveLength(1);
    expect(result.current.filteredChats[0].name).toBe('Alice');
  });

  it('filters chats by search query matching message', () => {
    const chats = [
      { id: 1, name: 'Alice', message: 'Hello world', history: [], unread: 2 },
      { id: 2, name: 'Bob', message: 'Hi there', history: [], unread: 0 },
    ];
    const channels = [];
    const { result } = renderHook(() =>
      useFilteredChats(chats, 'world', 'all', [], { hasMedia: false, hasAudio: false, hasReplies: false, fromBots: false, priority: false }, channels),
    );

    expect(result.current.filteredChats).toHaveLength(1);
    expect(result.current.filteredChats[0].name).toBe('Alice');
  });

  it('filters chats by search query matching history text', () => {
    const chats = [
      { id: 1, name: 'Alice', message: '', history: [{ text: 'Meeting at 3pm', sender: 'them' }], unread: 2 },
      { id: 2, name: 'Bob', message: 'Hi', history: [], unread: 0 },
    ];
    const channels = [];
    const { result } = renderHook(() =>
      useFilteredChats(chats, 'meeting', 'all', [], { hasMedia: false, hasAudio: false, hasReplies: false, fromBots: false, priority: false }, channels),
    );

    expect(result.current.filteredChats).toHaveLength(1);
  });

  it('filters archived chats when activeFolder is archived', () => {
    const chats = [
      { id: 1, name: 'Alice', message: 'Hello', history: [], unread: 2 },
      { id: 2, name: 'Bob', message: 'Hi', history: [], unread: 0 },
    ];
    const channels = [];
    const { result } = renderHook(() =>
      useFilteredChats(chats, '', 'archived', [1], { hasMedia: false, hasAudio: false, hasReplies: false, fromBots: false, priority: false }, channels),
    );

    expect(result.current.filteredChats).toHaveLength(1);
    expect(result.current.filteredChats[0].id).toBe(1);
  });

  it('excludes archived chats when activeFolder is not archived', () => {
    const chats = [
      { id: 1, name: 'Alice', message: 'Hello', history: [], unread: 2 },
      { id: 2, name: 'Bob', message: 'Hi', history: [], unread: 0 },
    ];
    const channels = [];
    const { result } = renderHook(() =>
      useFilteredChats(chats, '', 'all', [1], { hasMedia: false, hasAudio: false, hasReplies: false, fromBots: false, priority: false }, channels),
    );

    expect(result.current.filteredChats).toHaveLength(1);
    expect(result.current.filteredChats[0].name).toBe('Bob');
  });

  it('filters unread chats when activeFolder is unread', () => {
    const chats = [
      { id: 1, name: 'Alice', message: 'Hello', history: [], unread: 2 },
      { id: 2, name: 'Bob', message: 'Hi', history: [], unread: 0 },
    ];
    const channels = [];
    const { result } = renderHook(() =>
      useFilteredChats(chats, '', 'unread', [], { hasMedia: false, hasAudio: false, hasReplies: false, fromBots: false, priority: false }, channels),
    );

    expect(result.current.filteredChats).toHaveLength(1);
    expect(result.current.filteredChats[0].name).toBe('Alice');
  });

  it('filters by hasMedia advanced filter', () => {
    const chats = [
      { id: 1, name: 'Alice', message: '', history: [{ type: 'image', text: 'photo' }], unread: 0 },
      { id: 2, name: 'Bob', message: 'Hi', history: [], unread: 0 },
    ];
    const channels = [];
    const { result } = renderHook(() =>
      useFilteredChats(chats, '', 'all', [], { hasMedia: true, hasAudio: false, hasReplies: false, fromBots: false, priority: false }, channels),
    );

    expect(result.current.filteredChats).toHaveLength(1);
    expect(result.current.filteredChats[0].name).toBe('Alice');
  });

  it('filters by hasAudio advanced filter', () => {
    const chats = [
      { id: 1, name: 'Alice', message: '', history: [{ type: 'audio', text: 'voice note' }], unread: 0 },
      { id: 2, name: 'Bob', message: 'Hi', history: [], unread: 0 },
    ];
    const channels = [];
    const { result } = renderHook(() =>
      useFilteredChats(chats, '', 'all', [], { hasMedia: false, hasAudio: true, hasReplies: false, fromBots: false, priority: false }, channels),
    );

    expect(result.current.filteredChats).toHaveLength(1);
    expect(result.current.filteredChats[0].name).toBe('Alice');
  });

  it('filters by hasReplies advanced filter', () => {
    const chats = [
      { id: 1, name: 'Alice', message: 'Hello', history: [{ text: 'Reply', replyTo: { id: 1 } }], unread: 0 },
      { id: 2, name: 'Bob', message: 'Hi', history: [], unread: 0 },
    ];
    const channels = [];
    const { result } = renderHook(() =>
      useFilteredChats(chats, '', 'all', [], { hasMedia: false, hasAudio: false, hasReplies: true, fromBots: false, priority: false }, channels),
    );

    expect(result.current.filteredChats).toHaveLength(1);
    expect(result.current.filteredChats[0].name).toBe('Alice');
  });

  it('filters by fromBots advanced filter', () => {
    const chats = [
      { id: 1, name: 'Bot', message: 'Hi', type: 'bot', history: [], unread: 0 },
      { id: 2, name: 'Alice', message: 'Hello', type: 'direct', history: [], unread: 0 },
    ];
    const channels = [];
    const { result } = renderHook(() =>
      useFilteredChats(chats, '', 'all', [], { hasMedia: false, hasAudio: false, hasReplies: false, fromBots: true, priority: false }, channels),
    );

    expect(result.current.filteredChats).toHaveLength(1);
    expect(result.current.filteredChats[0].name).toBe('Bot');
  });

  it('filters by priority advanced filter', () => {
    const chats = [
      { id: 1, name: 'Alice', message: 'Hello', history: [], unread: 0, isPriority: true },
      { id: 2, name: 'Bob', message: 'Hi', history: [], unread: 0, isPriority: false },
    ];
    const channels = [];
    const { result } = renderHook(() =>
      useFilteredChats(chats, '', 'all', [], { hasMedia: false, hasAudio: false, hasReplies: false, fromBots: false, priority: true }, channels),
    );

    expect(result.current.filteredChats).toHaveLength(1);
    expect(result.current.filteredChats[0].name).toBe('Alice');
  });

  it('filters channels by search query', () => {
    const chats = [];
    const channels = [
      { id: 1, name: 'General', message: 'Welcome', history: [] },
      { id: 2, name: 'Random', message: 'Chat', history: [] },
    ];
    const { result } = renderHook(() =>
      useFilteredChats(chats, 'general', 'all', [], { hasMedia: false, hasAudio: false, hasReplies: false, fromBots: false, priority: false }, channels),
    );

    expect(result.current.filteredChannels).toHaveLength(1);
    expect(result.current.filteredChannels[0].name).toBe('General');
  });

  it('excludes archived channels when activeFolder is not archived', () => {
    const chats = [];
    const channels = [
      { id: 1, name: 'General', message: 'Welcome', history: [] },
      { id: 2, name: 'Random', message: 'Chat', history: [] },
    ];
    const { result } = renderHook(() =>
      useFilteredChats(chats, '', 'all', [1], { hasMedia: false, hasAudio: false, hasReplies: false, fromBots: false, priority: false }, channels),
    );

    expect(result.current.filteredChannels).toHaveLength(1);
    expect(result.current.filteredChannels[0].name).toBe('Random');
  });

  it('returns empty results when no chats match', () => {
    const chats = [
      { id: 1, name: 'Alice', message: 'Hello', history: [], unread: 0 },
    ];
    const channels = [];
    const { result } = renderHook(() =>
      useFilteredChats(chats, 'nonexistent', 'all', [], { hasMedia: false, hasAudio: false, hasReplies: false, fromBots: false, priority: false }, channels),
    );

    expect(result.current.filteredChats).toHaveLength(0);
  });

  it('computes mention counts correctly', () => {
    const chats = [
      { id: 1, name: 'Alice', message: '', history: [{ text: '@user hello', sender: 'them' }], unread: 0 },
      { id: 2, name: 'Bob', message: 'Hi', history: [], unread: 0 },
    ];
    const channels = [];
    const { result } = renderHook(() =>
      useFilteredChats(chats, '', 'all', [], { hasMedia: false, hasAudio: false, hasReplies: false, fromBots: false, priority: false }, channels),
    );

    expect(result.current.mentionCounts[1]).toBe(1);
    expect(result.current.mentionCounts[2]).toBeUndefined();
  });
});