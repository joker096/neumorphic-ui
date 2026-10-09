import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '../../../store';
import { DEFAULT_NOTIFICATION_SETTINGS } from '../../../store/slices/notificationSlice';
import { appendIncomingToDmChat, upsertIncomingToDmChat, markOutgoingStatus } from './inboundChatStore';

vi.mock('../../sounds', () => ({ playSound: vi.fn() }));
import { playSound } from '../../sounds';
const play = vi.mocked(playSound);

const dm = (over: any = {}) => ({ id: 'c1', name: 'Bob', type: 'direct', history: [], unread: 0, ...over });
const msg = (over: any = {}) => ({ id: 1000, ts: 1000, text: 'hi', sender: 'Bob', time: '10:00', ...over });

beforeEach(() => {
  useAppStore.setState({
    chats: [dm()],
    activeChatId: null,
    notificationItems: [],
    unreadCount: 0,
    notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS },
  });
  vi.restoreAllMocks();
});

describe('appendIncomingToDmChat', () => {
  it('bumps the badge and raises a notification for a closed chat', () => {
    appendIncomingToDmChat(dm(), msg());

    const st = useAppStore.getState();
    expect(st.chats[0].history).toHaveLength(1);
    expect(st.chats[0].unread).toBe(1);
    expect(st.notificationItems).toHaveLength(1);
    expect(st.notificationItems[0]).toMatchObject({ title: 'Bob', kind: 'message', chatId: 'c1' });
  });

  it('keeps the badge at 0 while the conversation is open', () => {
    useAppStore.setState({ activeChatId: 'c1' });
    appendIncomingToDmChat(dm(), msg());

    const st = useAppStore.getState();
    expect(st.chats[0].history).toHaveLength(1);
    expect(st.chats[0].unread).toBe(0);
    expect(st.notificationItems).toHaveLength(0);
  });

  it('badges but stays silent for a muted chat', () => {
    useAppStore.setState({ chats: [dm({ muted: true })] });
    appendIncomingToDmChat(dm({ muted: true }), msg());

    const st = useAppStore.getState();
    expect(st.chats[0].unread).toBe(1);
    expect(st.notificationItems).toHaveLength(0);
  });

  it('classifies a mention as its own kind', () => {
    appendIncomingToDmChat(dm(), msg({ text: 'hey @user look' }));
    expect(useAppStore.getState().notificationItems[0].kind).toBe('mention');
  });

  it('classifies group and channel chats', () => {
    useAppStore.setState({ chats: [dm({ id: 'g1', type: 'group' })] });
    appendIncomingToDmChat(dm({ id: 'g1', type: 'group' }), msg({ text: 'standup' }));
    expect(useAppStore.getState().notificationItems[0].kind).toBe('group');
  });

  it('suppresses the notification center entry when the category is off', () => {
    useAppStore.setState({ notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS, allMessages: false } });
    appendIncomingToDmChat(dm(), msg());

    const st = useAppStore.getState();
    expect(st.chats[0].unread).toBe(1);
    expect(st.notificationItems).toHaveLength(0);
  });

  it('plays the sound only when sounds are on and the message is not silent', () => {
    appendIncomingToDmChat(dm(), msg());
    expect(play).toHaveBeenCalledWith('incoming-chat');

    play.mockClear();
    appendIncomingToDmChat(dm(), msg({ id: 1001, ts: 1001, silent: true }));
    expect(play).not.toHaveBeenCalled();

    play.mockClear();
    useAppStore.setState({ notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS, sounds: false } });
    appendIncomingToDmChat(dm(), msg({ id: 1002, ts: 1002 }));
    expect(play).not.toHaveBeenCalled();
  });

  it('inserts a late arrival in send-time order instead of appending', () => {
    useAppStore.setState({ chats: [dm({ history: [{ id: 2000, ts: 2000, text: 'later' }] })] });
    appendIncomingToDmChat(dm({ history: [{ id: 2000, ts: 2000, text: 'later' }] }), msg({ id: 1000, ts: 1000 }));

    expect(useAppStore.getState().chats[0].history.map((m: any) => m.ts)).toEqual([1000, 2000]);
  });
});

describe('upsertIncomingToDmChat', () => {
  it('counts only the first frame of a live-location stream', () => {
    const first = upsertIncomingToDmChat(dm(), msg({ id: 'live_c1_1', ts: 1000 }));
    expect(first.created).toBe(true);

    const second = upsertIncomingToDmChat(dm(), msg({ id: 'live_c1_1', ts: 1500, text: 'moved' }));
    expect(second.created).toBe(false);

    const st = useAppStore.getState();
    expect(st.chats[0].history).toHaveLength(1);
    expect(st.chats[0].history[0].text).toBe('moved');
    // The original send time is preserved so a moving bubble never jumps up.
    expect(st.chats[0].history[0].ts).toBe(1000);
    expect(st.chats[0].unread).toBe(1);
    expect(st.notificationItems).toHaveLength(1);
  });

  it('does not badge or notify for a patch while the chat is open', () => {
    useAppStore.setState({ activeChatId: 'c1' });
    upsertIncomingToDmChat(dm(), msg({ id: 'live_c1_1', ts: 1000 }));
    upsertIncomingToDmChat(dm(), msg({ id: 'live_c1_1', ts: 1500 }));

    expect(useAppStore.getState().chats[0].unread).toBe(0);
    expect(useAppStore.getState().notificationItems).toHaveLength(0);
  });
});

describe('markOutgoingStatus', () => {
  it('updates only the addressed own message', () => {
    useAppStore.setState({
      chats: [dm({ history: [{ id: 'm1', ts: 1, sender: 'me', status: 'sent' }, { id: 'm2', ts: 2, sender: 'Bob' }] })],
    });
    markOutgoingStatus({ messageId: 'm1', chatId: 'c1' }, 'read');

    const history = useAppStore.getState().chats[0].history;
    expect(history[0].status).toBe('read');
    expect(history[1].status).toBeUndefined();
  });
});
