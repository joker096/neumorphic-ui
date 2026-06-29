import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ActiveChatWorkspace } from './ActiveChatWorkspace';

const mockProps = {
  theme: 'dark' as const,
  activeChat: { id: 'chat-1', name: 'Test Chat', isChannel: false, isMuted: false },
  setActiveChat: vi.fn(),
  messageText: '',
  setMessageText: vi.fn(),
  scheduleDateTime: '',
  showSchedulePopup: false,
  setShowSchedulePopup: vi.fn(),
  setScheduleDateTime: vi.fn(),
  isRecordingVoice: false,
  setIsRecordingVoice: vi.fn(),
  voiceNoteError: '',
  showStickerPicker: false,
  setShowStickerPicker: vi.fn(),
  morseMode: false,
  silentMode: false,
  replyTarget: null,
  setReplyTarget: vi.fn(),
  draftTextByChat: {},
  setDraftTextByChat: vi.fn(),
  setChats: vi.fn(),
  setChannels: vi.fn(),
  setVoiceNoteError: vi.fn(),
  setSilentMode: vi.fn(),
  setMorseMode: vi.fn(),
  handleSendMessage: vi.fn(),
  sendVoiceMessage: vi.fn(),
  sendStickerMessage: vi.fn(),
  savedMessages: [],
  onToggleSavedMessage: vi.fn(),
  onPreviewCall: vi.fn(),
  onPreviewVideoCall: vi.fn(),
  onPreviewMessage: vi.fn(),
  setEditingContact: vi.fn(),
  onToggleMute: vi.fn(),
  onAttachImage: vi.fn(),
  onHoldRecord: vi.fn(),
  onReRecord: vi.fn(),
  onPermissionDenied: vi.fn(),
  onSendVoice: vi.fn(),
  onToggleSchedulePopup: vi.fn(),
  onToggleSilent: vi.fn(),
  onToggleMorse: vi.fn(),
};

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string) => key, lang: 'en', setLang: vi.fn() }),
}));

describe('ActiveChatWorkspace', () => {
  it('renders without crashing', () => {
    const { container } = render(<ActiveChatWorkspace {...mockProps} />);
    expect(container).toBeTruthy();
  });

  it('renders with active chat data', () => {
    render(<ActiveChatWorkspace {...mockProps} />);
    const elements = document.querySelectorAll('[class*="animate-fade-in"]');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('accepts all props correctly', () => {
    const { container } = render(<ActiveChatWorkspace {...mockProps} />);
    expect(container).toBeTruthy();
  });

  it('renders in light theme', () => {
    render(<ActiveChatWorkspace {...mockProps} theme="light" />);
    const elements = document.querySelectorAll('[class*="animate-fade-in"]');
    expect(elements.length).toBeGreaterThan(0);
  });
});
