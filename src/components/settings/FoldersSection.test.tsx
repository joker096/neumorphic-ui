import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('lucide-react', () => ({
  Users: 'div', Briefcase: 'div', Inbox: 'div', Mail: 'div', Archive: 'div',
  ChevronLeft: 'div', ChevronRight: 'div',
}));
vi.mock('motion/react', () => ({ motion: { div: 'div' } }));
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key) }),
}));

import { FoldersSection } from './FoldersSection';

const t = (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key);

const renderSection = (props: { isDark?: boolean; onBack?: () => void } = {}) =>
  render(<FoldersSection isDark={props.isDark} onBack={props.onBack ?? vi.fn()} />);

describe('FoldersSection', () => {
  it('renders header with back button and title', () => {
    renderSection();
    expect(screen.getByRole('button', { name: t('common.back') })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: t('settings.folders', 'Folders') })).toBeInTheDocument();
    expect(screen.getByText(t('settings.chatFilters', 'Chat filters'))).toBeInTheDocument();
  });

  it('lists real system folders from CHAT_FOLDER_KEYS with descriptions', () => {
    renderSection();
    ['chat.folders.all', 'chat.folders.personal', 'chat.folders.unread', 'chat.folders.work', 'chat.folders.groups', 'chat.folders.archived'].forEach(key =>
      expect(screen.getByText(key)).toBeInTheDocument(),
    );
    expect(screen.getByText(t('settings.folderDesc.all', 'All chats'))).toBeInTheDocument();
    expect(screen.getByText(t('settings.folderDesc.unread', 'Chats with unread messages'))).toBeInTheDocument();
  });

  it('has no dead edit/delete/badge controls', () => {
    renderSection();
    expect(screen.queryByLabelText(t('common.edit'))).toBeNull();
    expect(screen.queryByLabelText(t('common.delete'))).toBeNull();
    expect(screen.queryByLabelText(/^Badge: /)).toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByLabelText(t('settings.addFolder', 'Create folder'))).toBeNull();
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    renderSection({ onBack });
    fireEvent.click(screen.getByRole('button', { name: t('common.back') }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});