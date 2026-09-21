import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
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

  it('hides DM file inputs behind hidden classes (no raw "No file chosen" control on mobile)', () => {
    const handleImageAttach = vi.fn();
    render(<ChatInputArea {...channelProps(OWNER_ID)} isChannel={false} handleImageAttach={handleImageAttach} />);
    for (const id of ['dm-media-input', 'dm-doc-input', 'dm-audio-input']) {
      const input = document.getElementById(id) as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.className).toContain('hidden');
      expect(input.className).not.toContain('opacity-0');
    }
  });

  it('opens the attach menu on plus click and closes it on Escape', () => {
    render(<ChatInputArea {...channelProps(OWNER_ID)} isChannel={false} handleImageAttach={vi.fn()} />);
    const plus = screen.getByRole('button', { name: 'chat.attachFile' });
    fireEvent.click(plus);
    expect(screen.getByText('chat.photo / chat.video')).toBeInTheDocument();
    expect(screen.getByText('media.document')).toBeInTheDocument();
    expect(screen.getByText('media.audio')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText('chat.photo / chat.video')).not.toBeInTheDocument();
  });

  it('photo/video item opens media input with image+video accept and passes files through', () => {
    const handleImageAttach = vi.fn();
    render(<ChatInputArea {...channelProps(OWNER_ID)} isChannel={false} handleImageAttach={handleImageAttach} />);
    fireEvent.click(screen.getByRole('button', { name: 'chat.attachFile' }));
    fireEvent.click(screen.getByText('chat.photo / chat.video'));
    const input = document.getElementById('dm-media-input') as HTMLInputElement;
    expect(input.accept).toBe('image/*,video/*');
    expect(screen.queryByText('chat.photo / chat.video')).not.toBeInTheDocument();
    fireEvent.change(input, { target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] } });
    expect(handleImageAttach).toHaveBeenCalledTimes(1);
  });

  it('document item opens doc input restricted to application/text mimes', () => {
    const handleImageAttach = vi.fn();
    render(<ChatInputArea {...channelProps(OWNER_ID)} isChannel={false} handleImageAttach={handleImageAttach} />);
    fireEvent.click(screen.getByRole('button', { name: 'chat.attachFile' }));
    fireEvent.click(screen.getByText('media.document'));
    const input = document.getElementById('dm-doc-input') as HTMLInputElement;
    expect(input.accept).toBe('application/*,text/*');
    fireEvent.change(input, { target: { files: [new File(['x'], 'a.pdf', { type: 'application/pdf' })] } });
    expect(handleImageAttach).toHaveBeenCalledTimes(1);
  });

  it('music item opens audio input restricted to audio mimes', () => {
    const handleImageAttach = vi.fn();
    render(<ChatInputArea {...channelProps(OWNER_ID)} isChannel={false} handleImageAttach={handleImageAttach} />);
    fireEvent.click(screen.getByRole('button', { name: 'chat.attachFile' }));
    fireEvent.click(screen.getByText('media.audio'));
    const input = document.getElementById('dm-audio-input') as HTMLInputElement;
    expect(input.accept).toBe('audio/*');
    fireEvent.change(input, { target: { files: [new File(['x'], 'a.mp3', { type: 'audio/mpeg' })] } });
    expect(handleImageAttach).toHaveBeenCalledTimes(1);
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
    expect(sendMessage).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ url: 'blob:mock', type: 'image' })]),
    );
    createObjectURL.mockRestore();
  });

  it('attaches multiple files and removes one thumbnail', () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    const sendMessage = vi.fn();
    render(<Wrapper ownerId={OWNER_ID} sendMessage={sendMessage} />);
    const input = document.getElementById('channel-post-media-input') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new File(['a'], 'a.png', { type: 'image/png' }), new File(['b'], 'b.png', { type: 'image/png' })] },
    });
    expect(document.querySelectorAll('img')).toHaveLength(2);
    fireEvent.click(screen.getAllByLabelText('chat.removeMedia')[1]!);
    expect(document.querySelectorAll('img')).toHaveLength(1);
    fireEvent.keyDown(screen.getByLabelText('channelComposer.placeholder'), { key: 'Enter' });
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect((sendMessage.mock.calls[0]![0] as Array<unknown>)).toHaveLength(1);
    createObjectURL.mockRestore();
  });

  it('sends an album post with multiple images', () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    const sendMessage = vi.fn();
    render(<Wrapper ownerId={OWNER_ID} sendMessage={sendMessage} />);
    const input = document.getElementById('channel-post-media-input') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new File(['a'], 'a.png', { type: 'image/png' }), new File(['b'], 'b.png', { type: 'image/png' })] },
    });
    fireEvent.keyDown(screen.getByLabelText('channelComposer.placeholder'), { key: 'Enter' });
    expect(sendMessage).toHaveBeenCalledTimes(1);
    const arg = sendMessage.mock.calls[0]![0] as Array<{ url: string; type: string }>;
    expect(arg).toHaveLength(2);
    expect(arg[0]!.type).toBe('image');
    expect(arg[1]!.url).toBe('blob:mock');
    createObjectURL.mockRestore();
  });

  describe('ChatInputArea geo/article (DM)', () => {
    afterEach(() => {
      Reflect.deleteProperty(navigator, 'geolocation');
    });

    it('location item requests geolocation and sends coords when granted', () => {
      const getCurrentPosition = vi.fn();
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: { getCurrentPosition },
      });
      const sendGeoMessage = vi.fn();
      render(<ChatInputArea {...channelProps(OWNER_ID)} isChannel={false} sendGeoMessage={sendGeoMessage} />);
      fireEvent.click(screen.getByRole('button', { name: 'chat.attachFile' }));
      fireEvent.click(screen.getByText('chat.location'));
      expect(getCurrentPosition).toHaveBeenCalledTimes(1);
      getCurrentPosition.mock.calls[0]![0]({ coords: { latitude: 55.7558, longitude: 37.6173 } });
      expect(sendGeoMessage).toHaveBeenCalledWith(55.7558, 37.6173);
      expect(screen.queryByText('chat.photo / chat.video')).not.toBeInTheDocument();
    });

    it('shows an error row when geolocation is denied', () => {
      const getCurrentPosition = vi.fn();
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: { getCurrentPosition },
      });
      const sendGeoMessage = vi.fn();
      render(<ChatInputArea {...channelProps(OWNER_ID)} isChannel={false} sendGeoMessage={sendGeoMessage} />);
      fireEvent.click(screen.getByRole('button', { name: 'chat.attachFile' }));
      fireEvent.click(screen.getByText('chat.location'));
      act(() => getCurrentPosition.mock.calls[0]![1]({ code: 1, message: 'denied' }));
      expect(screen.getByText('chat.locationDenied')).toBeInTheDocument();
      expect(sendGeoMessage).not.toHaveBeenCalled();
    });

    it('shows an error when geolocation API is unavailable', () => {
      const sendGeoMessage = vi.fn();
      render(<ChatInputArea {...channelProps(OWNER_ID)} isChannel={false} sendGeoMessage={sendGeoMessage} />);
      fireEvent.click(screen.getByRole('button', { name: 'chat.attachFile' }));
      fireEvent.click(screen.getByText('chat.location'));
      expect(screen.getByText('chat.locationDenied')).toBeInTheDocument();
      expect(sendGeoMessage).not.toHaveBeenCalled();
    });

    it('article item opens a URL input and sends the article on Enter', () => {
      const sendArticleMessage = vi.fn();
      render(<ChatInputArea {...channelProps(OWNER_ID)} isChannel={false} sendArticleMessage={sendArticleMessage} />);
      fireEvent.click(screen.getByRole('button', { name: 'chat.attachFile' }));
      fireEvent.click(screen.getByText('chat.article'));
      const input = screen.getByPlaceholderText('chat.articleUrl') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'https://example.com/post' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(sendArticleMessage).toHaveBeenCalledWith('https://example.com/post');
      expect(input).not.toBeInTheDocument();
    });

    it('rejects a non-URL article with an error row', () => {
      const sendArticleMessage = vi.fn();
      render(<ChatInputArea {...channelProps(OWNER_ID)} isChannel={false} sendArticleMessage={sendArticleMessage} />);
      fireEvent.click(screen.getByRole('button', { name: 'chat.attachFile' }));
      fireEvent.click(screen.getByText('chat.article'));
      const input = screen.getByPlaceholderText('chat.articleUrl') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'not-a-url' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(sendArticleMessage).not.toHaveBeenCalled();
      expect(screen.getByText('chat.articleInvalid')).toBeInTheDocument();
    });
  });
});
