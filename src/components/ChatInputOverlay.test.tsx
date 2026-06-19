import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ChatInputOverlay } from './ChatInputOverlay';

vi.mock('../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    lang: 'en',
    setLang: vi.fn(),
  }),
}));

const defaultProps = {
  theme: 'dark' as const,
  activeChat: { id: 'chat-1', isChannel: false, isMuted: false },
  messageText: '',
  setMessageText: vi.fn(),
  scheduleDateTime: '',
  showSchedulePopup: false,
  setShowSchedulePopup: vi.fn(),
  setScheduleDateTime: vi.fn(),
  isRecordingVoice: false,
  setIsRecordingVoice: vi.fn(),
  voiceNoteError: '',
  showStickerPicker: true,
  setShowStickerPicker: vi.fn(),
  morseMode: false,
  silentMode: false,
  replyTarget: null,
  setReplyTarget: vi.fn(),
  draftTextByChat: {},
  setDraftTextByChat: vi.fn(),
  setChats: vi.fn(),
  setChannels: vi.fn(),
  setActiveChat: vi.fn(),
  setVoiceNoteError: vi.fn(),
  setSilentMode: vi.fn(),
  setMorseMode: vi.fn(),
  handleSendMessage: vi.fn(),
  sendVoiceMessage: vi.fn(),
  sendStickerMessage: vi.fn(),
  onScheduleChange: vi.fn(),
  onToggleMute: vi.fn(),
  onAttachImage: vi.fn(),
  onToggleSchedulePopup: vi.fn(),
  onToggleSilent: vi.fn(),
  onToggleMorse: vi.fn(),
  onHoldRecord: vi.fn(),
  onReRecord: vi.fn(),
  onPermissionDenied: vi.fn(),
  onSendVoice: vi.fn(),
  onToggleStickerPicker: vi.fn(),
  onSendSticker: vi.fn(),
  isDark: true,
} as any;

describe('ChatInputOverlay sticker picker', () => {
  it('renders caveman and raccoon sticker pack tabs', () => {
    render(<ChatInputOverlay {...defaultProps} />);

    expect(screen.getByText('stickers.caveman')).toBeInTheDocument();
    expect(screen.getByText('stickers.raccoon')).toBeInTheDocument();
  });

  it('sends prefixed raccoon sticker ids when selected', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    render(<ChatInputOverlay {...defaultProps} sendStickerMessage={onSelect} setShowStickerPicker={onClose} />);

    fireEvent.click(screen.getByAltText('raccoon:racoon-workout2'));

    expect(onSelect).toHaveBeenCalledWith('raccoon:racoon-workout2');
    expect(onClose).toHaveBeenCalledWith(false);
  });
});
