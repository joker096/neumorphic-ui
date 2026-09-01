import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('lucide-react', () => ({
  FolderTree: 'div', Plus: 'div', Pencil: 'div', Trash2: 'div', GripVertical: 'div',
  Check: 'div', X: 'div', Users: 'div', Briefcase: 'div', Megaphone: 'div', Bot: 'div',
  Inbox: 'div', Archive: 'div', BadgeCheck: 'div', ChevronLeft: 'div', ChevronRight: 'div',
}));
vi.mock('motion/react', () => ({ motion: { div: 'div' } }));
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key) }),
}));
vi.mock('../ui/Toast', () => ({ toast: vi.fn() }));

import { FoldersSection } from './FoldersSection';
import { toast } from '../ui/Toast';

const t = (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key);

const renderSection = (props: { isDark?: boolean; onBack?: () => void } = {}) =>
  render(<FoldersSection isDark={props.isDark} onBack={props.onBack ?? vi.fn()} />);

describe('FoldersSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header with back button and title', () => {
    renderSection();
    expect(screen.getByRole('button', { name: t('common.back') })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: t('settings.folders', 'Folders') })).toBeInTheDocument();
    expect(screen.getByText(t('settings.chatFilters', 'Chat filters'))).toBeInTheDocument();
  });

  it('renders four default folders with edit/delete/badge controls', () => {
    renderSection();
    ['All', 'Personal', 'Work', 'Archive'].forEach(name => expect(screen.getByText(name)).toBeInTheDocument());
    expect(screen.getAllByLabelText(t('common.edit'))).toHaveLength(4);
    expect(screen.getAllByLabelText(t('common.delete'))).toHaveLength(4);
    expect(screen.getAllByLabelText(/^Badge: /)).toHaveLength(4);
  });

  it('badge button shows current label and cycles on click', () => {
    renderSection();
    const workBadge = screen.getByLabelText('Badge: Mentions only');
    fireEvent.click(workBadge);
    expect(screen.getAllByLabelText('Badge: Hidden')).toHaveLength(2); // Work cycled + Archive
  });

  it('deletes deletable folder and toasts success', () => {
    renderSection();
    fireEvent.click(screen.getAllByLabelText(t('common.delete'))[1]); // Personal
    expect(screen.queryByText('Personal')).not.toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(toast).toHaveBeenCalledWith(t('settings.folderDeleted', 'Folder deleted'), 'success');
  });

  it('locks built-in All and Archive folders with warning toast', () => {
    renderSection();
    const deletes = screen.getAllByLabelText(t('common.delete'));
    fireEvent.click(deletes[0]); // All
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(toast).toHaveBeenCalledWith(t('settings.folderLocked', 'This folder cannot be deleted'), 'warning');
    fireEvent.click(screen.getAllByLabelText(t('common.delete'))[3]); // Archive
    expect(screen.getByText('Archive')).toBeInTheDocument();
    expect(toast).toHaveBeenCalledTimes(2);
  });

  it('enters edit mode with prefilled name', () => {
    renderSection();
    fireEvent.click(screen.getAllByLabelText(t('common.edit'))[1]); // Personal
    expect(screen.getByRole('textbox')).toHaveValue('Personal');
    expect(screen.getByLabelText(t('common.save'))).toBeInTheDocument();
  });

  it('saves edited name and include selection', () => {
    renderSection();
    fireEvent.click(screen.getAllByLabelText(t('common.edit'))[1]);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'My Chats' } });
    fireEvent.click(screen.getByText('Muted'));
    fireEvent.click(screen.getByLabelText(t('common.save')));
    expect(screen.getByText('My Chats')).toBeInTheDocument();
    expect(screen.queryByText('Personal')).not.toBeInTheDocument();
    expect(toast).toHaveBeenCalledWith(t('settings.folderSaved', 'Folder updated'), 'success');
  });

  it('falls back to "Folder" when name is empty on save', () => {
    renderSection();
    fireEvent.click(screen.getAllByLabelText(t('common.edit'))[1]);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });
    fireEvent.click(screen.getByLabelText(t('common.save')));
    expect(screen.getByText('Folder')).toBeInTheDocument();
  });

  it('cancels edit without changes', () => {
    renderSection();
    fireEvent.click(screen.getAllByLabelText(t('common.edit'))[1]);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Renamed' } });
    fireEvent.click(screen.getByLabelText(t('common.cancel')));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  it('adds new folder and starts editing it', () => {
    renderSection();
    fireEvent.click(screen.getByLabelText(t('settings.addFolder', 'Create folder')));
    expect(screen.getByRole('textbox')).toHaveValue('New folder');
    fireEvent.click(screen.getByLabelText(t('common.save')));
    expect(screen.getByText('New folder')).toBeInTheDocument();
    expect(screen.getAllByLabelText(t('common.edit'))).toHaveLength(5);
  });

  it('toggles include chips during edit', () => {
    renderSection();
    fireEvent.click(screen.getAllByLabelText(t('common.edit'))[1]); // Personal starts with private
    const groupChip = screen.getByText('Groups');
    fireEvent.click(groupChip);
    fireEvent.click(screen.getByLabelText(t('common.cancel')));
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    renderSection({ onBack });
    fireEvent.click(screen.getByRole('button', { name: t('common.back') }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});