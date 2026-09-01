import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ChatInputArea } from './ChatInputArea';
import { useAppStore } from '../../store';

const OWNER_ID = 'owner-test-id';

const baseProps = {
  isDark: false,
  isChannel: true,
  eMsgText: '',
  setMsgTextFn: (v: string) => {},
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
  setLocalReplyTarget: vi.fn(),
  sendMessage: vi.fn(),
  handleImageAttach: vi.fn(),
  onUpdateChat: vi.fn(),
  onAction: vi.fn(),
  setChannels: vi.fn(),
  theme: 'light' as const,
  t: (key: string) => key,
};

const channelProps = (ownerId?: string) => ({
  ...baseProps,
  chat: {
    id: 'chan-1',
    name: 'Tech Insights',
    ownerId,
    isMuted: false,
    history: [],
    postCount: 0,
  },
});

const Wrapper: React.FC<{ sendMessage?: any; ownerId?: string }> = ({ sendMessage, ownerId }) => {
  const [text, setText] = useState('');
  return (
    <ChatInputArea
      {...channelProps(ownerId)}
      eMsgText={text}
      setMsgTextFn={setText}
      sendMessage={sendMessage ?? vi.fn()}
    />
  );
};

describe('ChatInputArea (channel)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ userProfile: { id: OWNER_ID } as any });
  });

  it('shows mute button for subscribers (non-owner)', () => {
    render(<ChatInputArea {...channelProps('someone-else')} />);
    expect(screen.queryByLabelText('channelComposer.placeholder')).not.toBeInTheDocument();
    expect(screen.getByLabelText('chat.filters.muteChannel')).toBeInTheDocument();
  });

  it('shows a post composer for the channel owner', () => {
    render(<Wrapper ownerId={OWNER_ID} />);
    expect(screen.getByLabelText('channelComposer.placeholder')).toBeInTheDocument();
    expect(screen.getByLabelText('channelComposer.send')).toBeInTheDocument();
  });

  it('sends a post on Enter when owner types text', () => {
    const sendMessage = vi.fn();
    render(<Wrapper ownerId={OWNER_ID} sendMessage={sendMessage} />);
    const input = screen.getByLabelText('channelComposer.placeholder') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Hello world' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  it('does not send an empty post', () => {
    const sendMessage = vi.fn();
    render(<Wrapper ownerId={OWNER_ID} sendMessage={sendMessage} />);
    const input = screen.getByLabelText('channelComposer.placeholder') as HTMLInputElement;
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('attaches media and sends a post with attachment when owner selects a file', () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    const sendMessage = vi.fn();
    render(<Wrapper ownerId={OWNER_ID} sendMessage={sendMessage} />);
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    const input = document.getElementById('channel-post-media-input') as HTMLInputElement;
    expect(input).toBeTruthy();
    fireEvent.change(input, { target: { files: [file] } });
    expect(document.querySelector('img')).toBeTruthy();
    fireEvent.keyDown(screen.getByLabelText('channelComposer.placeholder'), { key: 'Enter' });
    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({ url: 'blob:mock', type: 'image' }));
    createObjectURL.mockRestore();
  });
});
