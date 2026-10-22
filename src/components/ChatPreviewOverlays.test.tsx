import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ChatPreviewOverlays } from './ChatPreviewOverlays';

const store = vi.hoisted(() => ({
  contacts: [] as any[],
  chats: [] as any[],
  setContacts: vi.fn(),
  setChats: vi.fn(),
}));

const captured = vi.hoisted(() => ({ props: null as any }));

vi.mock('../store', () => ({
  useAppStore: (selector: any) => selector(store),
}));

vi.mock('../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string) => key, lang: 'en', setLang: vi.fn() }),
  I18nProvider: ({ children }: any) => children,
  I18nContext: { Provider: ({ children }: any) => children },
}));

// The chat furniture around the profile modal is not under test here.
vi.mock('./ChannelCommentsView', () => ({ ChannelCommentsView: () => null }));
vi.mock('./chat-preview/SavedMessagesPanel', () => ({ SavedMessagesPanel: () => null }));
vi.mock('./chat-preview/MessageThreadPanel', () => ({ MessageThreadPanel: () => null }));

vi.mock('./ContactProfileModal', () => ({
  ContactProfileModal: (props: any) => {
    captured.props = props;
    return (
      <button data-testid="fake-star" onClick={() => props.onToggleFavorite?.(props.contact.id, true)}>
        star
      </button>
    );
  },
}));

const CONTACT = { id: 'c-alice', name: 'Alice', isFavorite: false };

function baseProps(selectedContact: any) {
  return {
    chat: { id: 7, name: 'Alice', type: 'direct' },
    isDark: true,
    theme: 'dark' as const,
    photoOpen: false,
    videoOpen: false,
    activePhotoUrl: null,
    setPhotoOpen: vi.fn(),
    setVideoOpen: vi.fn(),
    showComments: false,
    activePostId: null,
    setShowComments: vi.fn(),
    showSavedPanel: false,
    setShowSavedPanel: vi.fn(),
    chatSavedMessages: [],
    t: (key: string) => key,
    selectedContact,
    setSelectedContact: vi.fn(),
    setEditingContact: vi.fn(),
    profileOpen: false,
    setProfileOpen: vi.fn(),
    threadOpen: false,
    threadReplies: [],
    onCloseThread: vi.fn(),
    onSendThreadReply: vi.fn(),
  } as any;
}

describe('ChatPreviewOverlays - favorite of the contact behind the chat profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    captured.props = null;
    store.contacts = [{ ...CONTACT }];
  });

  it('offers the favorite star when a contact with the same name exists', async () => {
    render(<ChatPreviewOverlays {...baseProps({ id: 'hash_7', name: 'Alice' })} />);

    await waitFor(() => expect(screen.getByTestId('fake-star')).toBeInTheDocument());
    expect(captured.props.canToggleFavorite).toBe(true);
  });

  it('hides the favorite star when no contact sits behind the chat profile', async () => {
    store.contacts = [{ id: 'c-bob', name: 'Bob' }];

    render(<ChatPreviewOverlays {...baseProps({ id: 'hash_7', name: 'Alice' })} />);

    await waitFor(() => expect(screen.getByTestId('fake-star')).toBeInTheDocument());
    expect(captured.props.canToggleFavorite).toBe(false);
  });

  it('persists the favorite on the contact record, not on the chat', async () => {
    render(<ChatPreviewOverlays {...baseProps({ id: 'hash_7', name: 'Alice' })} />);

    await waitFor(() => expect(screen.getByTestId('fake-star')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('fake-star'));

    expect(store.setContacts).toHaveBeenCalledTimes(1);
    const updater = store.setContacts.mock.calls[0][0];
    const next = updater([{ ...CONTACT }]);
    expect(next[0].isFavorite).toBe(true);
    // The chat itself is not touched - nothing renders a chat-level star.
    expect(store.setChats).not.toHaveBeenCalled();
  });
});
