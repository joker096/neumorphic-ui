import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeAll } from 'vitest';
import { GlobalSearch } from './GlobalSearch';

const t = (key: string, fallback?: string) => fallback ?? key;

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

const groupChat = {
  id: 2,
  name: 'Design Team',
  message: "Bob: Let's review the new components later.",
  color: 'from-amber-400 to-orange-500',
  type: 'group',
  memberIds: ['contact_001', 'contact_002'],
  members: [
    { id: 'contact_001', name: 'Alice Freeman', color: 'from-pink-400 to-rose-400', role: 'owner' },
    { id: 'contact_002', name: 'Bob Smith', color: 'from-blue-400 to-indigo-400', role: 'member' },
  ],
  group: { inviteToken: 'ma_2', slowModeSeconds: 0, ownerId: 'contact_001' },
  history: [
    { id: 201, sender: 'them', text: 'Alice: I pushed the updated files.', time: 'Yesterday' },
    { id: 203, sender: 'them', text: "Bob: Let's review the new components later.", time: 'Yesterday' },
  ],
};

const userChat = {
  id: 1,
  name: 'Alice Freeman',
  message: 'Wow, the colors are amazing!',
  color: 'from-pink-400 to-rose-400',
  history: [
    { id: 7, sender: 'them', type: 'file', fileName: 'dashboard-mockup.pdf', time: '10:41', date: daysAgo(0) },
    { id: 8, sender: 'them', type: 'file', fileName: 'old-scan.pdf', time: 'Jul 28', date: daysAgo(30) },
  ],
};

const channel = {
  id: 'ch_1',
  name: 'Tech Insights',
  message: 'New update on the neural engines.',
  color: 'from-violet-400 to-purple-500',
  history: [
    { id: 502, sender: 'them', text: 'Read more: https://example.com/neumorphic-forms-tips', time: 'Feb 25', date: daysAgo(30) },
  ],
};

const meChat = {
  id: 77,
  name: 'Sasha',
  message: 'ok',
  color: 'from-emerald-400 to-teal-500',
  history: [
    { id: 771, sender: 'me', text: 'I will ship the build report', time: '10:00' },
    { id: 772, sender: 'them', text: 'Please send the build report', time: '10:05' },
  ],
};

const mediaChat = {
  id: 78,
  name: 'Media Bot',
  message: 'new drop',
  color: 'from-sky-400 to-blue-500',
  history: [
    { id: 781, sender: 'them', text: 'watch the 1:23 clip', time: '11:00' },
    { id: 782, sender: 'them', type: 'video', thumb: 'https://images.example.com/t.jpg', duration: '1:23', time: '11:05' },
  ],
};

const contact = { id: 'contact_001', name: 'Alice Freeman', color: 'from-pink-400 to-rose-400' };

const baseProps = {
  isDark: false,
  chats: [userChat, groupChat],
  channels: [channel],
  contacts: [contact],
  onClose: vi.fn(),
  onOpenChat: vi.fn(),
  onOpenContact: vi.fn(),
  t,
};

describe('GlobalSearch', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('lists a group under Groups when the group name matches', () => {
    render(<GlobalSearch {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Search chats, messages, contacts…'), { target: { value: 'design' } });

    expect(screen.getByText('Groups', { exact: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Design Team/ })).toBeInTheDocument();
  });

  it('lists a group under Groups when a member name matches', () => {
    render(<GlobalSearch {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Search chats, messages, contacts…'), { target: { value: 'Bob Smith' } });

    expect(screen.getByText('Groups', { exact: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Design Team/ })).toBeInTheDocument();
  });

  it('does not list groups under the Chats section', () => {
    render(<GlobalSearch {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Search chats, messages, contacts…'), { target: { value: 'design' } });

    expect(screen.queryByText('Chats', { exact: true })).not.toBeInTheDocument();
  });

  it('still lists regular chats under Chats', () => {
    render(<GlobalSearch {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Search chats, messages, contacts…'), { target: { value: 'colors' } });

    expect(screen.getByText('Chats', { exact: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Alice Freeman/ })).toBeInTheDocument();
    expect(screen.queryByText('Groups', { exact: true })).not.toBeInTheDocument();
  });

  it('opens the group chat when a group row is clicked', () => {
    const onOpenChat = vi.fn();
    render(<GlobalSearch {...baseProps} onOpenChat={onOpenChat} />);
    fireEvent.change(screen.getByPlaceholderText('Search chats, messages, contacts…'), { target: { value: 'design' } });

    fireEvent.click(screen.getByRole('button', { name: /Design Team/ }));

    expect(onOpenChat).toHaveBeenCalledTimes(1);
    expect(onOpenChat.mock.calls[0][0].id).toBe(2);
  });

  it('keyboard navigation reaches the group row', () => {
    const onOpenChat = vi.fn();
    render(<GlobalSearch {...baseProps} onOpenChat={onOpenChat} />);
    const input = screen.getByPlaceholderText('Search chats, messages, contacts…');
    fireEvent.change(input, { target: { value: 'design' } });

    // No user chat matches, no channel, no contact — flatRows = [Design Team group]
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onOpenChat).toHaveBeenCalledTimes(1);
    expect(onOpenChat.mock.calls[0][0].id).toBe(2);
  });

  it('lists a file under Files when the file name matches', () => {
    render(<GlobalSearch {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Search chats, messages, contacts…'), { target: { value: 'mockup' } });

    // Section heading + type chip share the label
    expect(screen.getAllByText('Files', { exact: true })).toHaveLength(2);
    expect(screen.getByRole('button', { name: /dashboard-mockup\.pdf/ })).toBeInTheDocument();
    // File-name-only match: the chat itself is not duplicated under Chats
    expect(screen.queryByText('Chats', { exact: true })).not.toBeInTheDocument();
  });

  it('opens the chat at the file message when a file row is clicked', () => {
    const onOpenChat = vi.fn();
    render(<GlobalSearch {...baseProps} onOpenChat={onOpenChat} />);
    fireEvent.change(screen.getByPlaceholderText('Search chats, messages, contacts…'), { target: { value: 'mockup' } });

    fireEvent.click(screen.getByRole('button', { name: /dashboard-mockup\.pdf/ }));

    expect(onOpenChat).toHaveBeenCalledTimes(1);
    expect(onOpenChat.mock.calls[0][0].id).toBe(1);
    expect(onOpenChat.mock.calls[0][0].__jumpToMessageId).toBe(7);
  });

  it('lists a link under Links when a URL in a message matches', () => {
    render(<GlobalSearch {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Search chats, messages, contacts…'), { target: { value: 'example.com' } });

    // Section heading + type chip share the label
    expect(screen.getAllByText('Links', { exact: true })).toHaveLength(2);
    // The matched query is highlighted: the URL is split into <mark> fragments
    // in the Links row title and the Channels row snippet
    const marks = screen.getAllByText('example.com', { exact: true });
    expect(marks).toHaveLength(2);
    expect(marks[0].tagName).toBe('MARK');
  });

  it('opens the chat at the link message when a link row is clicked', () => {
    const onOpenChat = vi.fn();
    render(<GlobalSearch {...baseProps} onOpenChat={onOpenChat} />);
    fireEvent.change(screen.getByPlaceholderText('Search chats, messages, contacts…'), { target: { value: 'example.com' } });

    // DOM order: the Channels row snippet mark comes before the Links row title mark
    fireEvent.click(screen.getAllByText('example.com', { exact: true })[1]);

    expect(onOpenChat).toHaveBeenCalledTimes(1);
    expect(onOpenChat.mock.calls[0][0].id).toBe('ch_1');
    expect(onOpenChat.mock.calls[0][0].__jumpToMessageId).toBe(502);
  });

  it('date filter keeps only files within the selected range', () => {
    render(<GlobalSearch {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Search chats, messages, contacts…'), { target: { value: 'pdf' } });

    expect(screen.getByRole('button', { name: /dashboard-mockup\.pdf/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /old-scan\.pdf/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Last 7 days' }));

    expect(screen.queryByRole('button', { name: /old-scan\.pdf/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dashboard-mockup\.pdf/ })).toBeInTheDocument();
  });

  it('date filter hides link results outside the selected range', () => {
    render(<GlobalSearch {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Search chats, messages, contacts…'), { target: { value: 'example.com' } });

    expect(screen.getAllByText('example.com', { exact: true })).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Last 7 days' }));

    expect(screen.queryAllByText('example.com', { exact: true })).toHaveLength(0);
  });

  it('sender filter keeps chats only when the selected sender has the matching message', () => {
    render(<GlobalSearch {...baseProps} chats={[meChat, ...baseProps.chats]} />);
    const input = screen.getByPlaceholderText('Search chats, messages, contacts…');
    fireEvent.change(input, { target: { value: 'ship' } });

    expect(screen.getByRole('button', { name: /Sasha/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Me' }));
    expect(screen.getByRole('button', { name: /Sasha/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Others' }));
    expect(screen.queryByRole('button', { name: /Sasha/ })).not.toBeInTheDocument();
    expect(screen.getByText('Nothing found')).toBeInTheDocument();
  });

  it('sender filter hides name-only matches for non-matching senders', () => {
    render(<GlobalSearch {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Search chats, messages, contacts…'), { target: { value: 'design' } });

    expect(screen.getByRole('button', { name: /Design Team/ })).toBeInTheDocument();

    // Group history is from "them" only — "Me" excludes the name-only match
    fireEvent.click(screen.getByRole('button', { name: 'Me' }));

    expect(screen.queryByRole('button', { name: /Design Team/ })).not.toBeInTheDocument();
  });

  it('sender filter hides file rows from the other sender', () => {
    render(<GlobalSearch {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Search chats, messages, contacts…'), { target: { value: 'mockup' } });

    expect(screen.getByRole('button', { name: /dashboard-mockup\.pdf/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Me' }));
    expect(screen.queryByRole('button', { name: /dashboard-mockup\.pdf/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Others' }));
    expect(screen.getByRole('button', { name: /dashboard-mockup\.pdf/ })).toBeInTheDocument();
  });

  it('sender filter hides link rows from the other sender', () => {
    render(<GlobalSearch {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Search chats, messages, contacts…'), { target: { value: 'example.com' } });
    expect(screen.getAllByText('example.com', { exact: true })).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Me' }));

    expect(screen.queryAllByText('example.com', { exact: true })).toHaveLength(0);
  });

  it('shows no-results when nothing matches at all', () => {
    render(<GlobalSearch {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Search chats, messages, contacts…'), { target: { value: 'zzzqqqxyz' } });

    expect(screen.getByText('Nothing found')).toBeInTheDocument();
    expect(screen.queryByText('Groups', { exact: true })).not.toBeInTheDocument();
  });

  it('media filter keeps chats with a matching media message', () => {
    render(<GlobalSearch {...baseProps} chats={[mediaChat, ...baseProps.chats]} />);
    fireEvent.change(screen.getByPlaceholderText('Search chats, messages, contacts…'), { target: { value: '1:23' } });

    expect(screen.getByRole('button', { name: /Media Bot/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Files' }));
    expect(screen.queryByRole('button', { name: /Media Bot/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Media' }));
    expect(screen.getByRole('button', { name: /Media Bot/ })).toBeInTheDocument();
  });

  it('media filter hides file rows', () => {
    render(<GlobalSearch {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Search chats, messages, contacts…'), { target: { value: 'pdf' } });

    expect(screen.getByRole('button', { name: /dashboard-mockup\.pdf/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Media' }));

    expect(screen.queryByRole('button', { name: /dashboard-mockup\.pdf/ })).not.toBeInTheDocument();
    expect(screen.getByText('Nothing found')).toBeInTheDocument();
  });

  it('links filter keeps only link rows', () => {
    render(<GlobalSearch {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Search chats, messages, contacts…'), { target: { value: 'example.com' } });

    expect(screen.getByText('Channels', { exact: true })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Links' }));

    expect(screen.getAllByText('example.com', { exact: true })).toHaveLength(1);
    expect(screen.queryByText('Channels', { exact: true })).not.toBeInTheDocument();
  });

  it('highlights the matched query in result rows', () => {
    render(<GlobalSearch {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Search chats, messages, contacts…'), { target: { value: 'colors' } });

    const mark = screen.getByText('colors', { exact: true });
    expect(mark.tagName).toBe('MARK');
  });

  it('highlights case-insensitively', () => {
    render(<GlobalSearch {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Search chats, messages, contacts…'), { target: { value: 'COLORS' } });

    // Original casing is preserved inside the mark
    expect(screen.getByText('colors', { exact: true })).toBeInTheDocument();
  });

  it('highlights the matched query in file row titles', () => {
    render(<GlobalSearch {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Search chats, messages, contacts…'), { target: { value: 'mockup' } });

    const mark = screen.getByText('mockup', { exact: true });
    expect(mark.tagName).toBe('MARK');
  });

  it('does not crash on regex-special query characters', () => {
    render(<GlobalSearch {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Search chats, messages, contacts…'), { target: { value: 'a(b).c*' } });

    expect(screen.getByText('Nothing found')).toBeInTheDocument();
  });
});
