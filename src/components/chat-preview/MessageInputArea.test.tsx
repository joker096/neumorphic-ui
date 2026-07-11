import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MessageInputArea } from './MessageInputArea';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string) => key, lang: 'en', setLang: vi.fn() }),
}));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDark: true, theme: 'dark', toggleTheme: vi.fn() }),
}));

vi.mock('./LiveVoiceRecorder', () => ({
  LiveVoiceRecorder: () => <div>LiveVoiceRecorder</div>,
}));

vi.mock('./MorseDecoder', () => ({
  encodeMorse: (s: string) => s.split('').join(' '),
}));

vi.mock('../chat/StickerPicker', () => ({
  StickerPicker: () => <div>StickerPicker</div>,
}));

const baseProps: any = {
  isChannel: false,
  chat: { id: 1, isMuted: false },
  eMsgText: '',
  setMsgTextFn: vi.fn(),
  eMorseMode: false,
  setMorseModeFn2: vi.fn(),
  eSilentMode: false,
  setSilentModeFn2: vi.fn(),
  eShowStickerPicker: false,
  setShowStickerPickerFn2: vi.fn(),
  eIsRecordingVoice: false,
  setIsRecordingVoiceFn2: vi.fn(),
  eVoiceNoteError: '',
  setVoiceNoteErrFn2: vi.fn(),
  eScheduleDateTime: '',
  setScheduleDtFn2: vi.fn(),
  eShowSchedulePopup: false,
  setShowSchedulePopupFn2: vi.fn(),
  eReplyTarget: null,
  setReplyTargetFn2: vi.fn(),
  sendMessage: vi.fn(),
  sendStickerMessage: vi.fn(),
  sendVoiceMessage: vi.fn(),
};

describe('MessageInputArea', () => {
  it('renders text input', () => {
    render(<MessageInputArea {...baseProps} />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('fires sendMessage when Enter is pressed', () => {
    const sendMessage = vi.fn();
    render(<MessageInputArea {...baseProps} eMsgText="hello" sendMessage={sendMessage} />);
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(sendMessage).toHaveBeenCalled();
  });

  it('shows placeholder text', () => {
    render(<MessageInputArea {...baseProps} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'chat.messagePlaceholder');
  });

  it('shows send button with chevron icon when text is entered', () => {
    render(<MessageInputArea {...baseProps} eMsgText="hi" />);
    const sendButton = document.querySelector('[title="chat.sendMessage"]');
    expect(sendButton).toBeInTheDocument();
  });

  it('shows mic button when text is empty', () => {
    render(<MessageInputArea {...baseProps} eMsgText="" />);
    const micButton = document.querySelector('[title="chat.holdToRecordVoiceNote"]');
    expect(micButton).toBeInTheDocument();
  });

  it('shows reply preview when eReplyTarget is set', () => {
    render(
      <MessageInputArea
        {...baseProps}
        eReplyTarget={{ id: 1, sender: 'them', text: 'Original message' }}
      />,
    );
    expect(screen.getByText(/Original message/)).toBeInTheDocument();
  });

  it('shows schedule popup when eShowSchedulePopup is true', () => {
    render(<MessageInputArea {...baseProps} eShowSchedulePopup={true} />);
    expect(screen.getByText('chat.scheduleSend')).toBeInTheDocument();
  });

  it('shows voice recorder when eIsRecordingVoice is true', () => {
    render(<MessageInputArea {...baseProps} eIsRecordingVoice={true} />);
    expect(screen.getByText('LiveVoiceRecorder')).toBeInTheDocument();
  });

  it('renders channel mute button when isChannel is true', () => {
    render(<MessageInputArea {...baseProps} isChannel={true} />);
    expect(screen.getByText('chat.filters.muteChannel')).toBeInTheDocument();
  });

  it('calls setMsgTextFn on input change', () => {
    const setMsgTextFn = vi.fn();
    render(<MessageInputArea {...baseProps} setMsgTextFn={setMsgTextFn} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new text' } });
    expect(setMsgTextFn).toHaveBeenCalledWith('new text');
  });

  it('shows morse mode indicator when eMorseMode is true', () => {
    render(<MessageInputArea {...baseProps} eMorseMode={true} eMsgText="hello" />);
    expect(screen.getByText('h e l l o')).toBeInTheDocument();
  });
});
