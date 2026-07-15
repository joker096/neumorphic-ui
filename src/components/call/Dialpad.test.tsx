import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Dialpad } from './Dialpad';

// Mock store
vi.mock('../../store', () => ({
  useAppStore: vi.fn(() => ({
    activeCall: null,
    setActiveCall: vi.fn(),
    setContacts: vi.fn(),
    callFolders: [],
    addCallFolder: vi.fn(),
    removeCallFolder: vi.fn(),
  })),
}));

// Mock i18n
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

describe('Dialpad', () => {
  const mockContacts = [
    { id: '1', name: 'Alice', color: 'from-blue-400 to-indigo-500', lastSeen: 0 },
    { id: '2', name: 'Bob', color: 'from-green-400 to-emerald-500', lastSeen: 0 },
  ];

  it('renders the dialpad', () => {
    render(<Dialpad theme="dark" contacts={mockContacts} showContactPicker={false} setShowContactPicker={() => {}} setEditingContact={() => {}} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with light theme', () => {
    render(<Dialpad theme="light" contacts={mockContacts} showContactPicker={false} setShowContactPicker={() => {}} setEditingContact={() => {}} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with dark theme', () => {
    render(<Dialpad theme="dark" contacts={mockContacts} showContactPicker={false} setShowContactPicker={() => {}} setEditingContact={() => {}} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with onCall callback', () => {
    const onCall = vi.fn();
    render(<Dialpad theme="dark" contacts={mockContacts} showContactPicker={false} setShowContactPicker={() => {}} setEditingContact={() => {}} onCall={onCall} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with onVideoCall callback', () => {
    const onVideoCall = vi.fn();
    render(<Dialpad theme="dark" contacts={mockContacts} showContactPicker={false} setShowContactPicker={() => {}} setEditingContact={() => {}} onVideoCall={onVideoCall} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with onMessage callback', () => {
    const onMessage = vi.fn();
    render(<Dialpad theme="dark" contacts={mockContacts} showContactPicker={false} setShowContactPicker={() => {}} setEditingContact={() => {}} onMessage={onMessage} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
