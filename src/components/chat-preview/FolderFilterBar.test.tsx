import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { FolderFilterBar } from './FolderFilterBar';

const t = (key: string) => key;
const noFilters = { hasMedia: false, hasAudio: false, hasReplies: false, fromBots: false, priority: false };

const renderBar = (folderUnread?: Record<string, number>) =>
  render(
    <FolderFilterBar
      activeFolder="all"
      setActiveFolder={vi.fn()}
      advancedFilters={noFilters}
      setShowAdvancedFilterModal={vi.fn()}
      t={t}
      folderUnread={folderUnread}
    />,
  );

describe('FolderFilterBar — unread counters', () => {
  it('renders the counter next to the folder label and in the accessible name', () => {
    renderBar({ all: 7, unread: 7 });

    const allTab = screen.getByRole('button', { name: 'chat.folders.all (7)' });
    expect(allTab).toHaveTextContent('chat.folders.all');
    expect(allTab).toHaveTextContent('7');
  });

  it('omits the counter when a folder has nothing unread', () => {
    renderBar({ all: 0, personal: 3 });

    expect(screen.getByRole('button', { name: 'chat.folders.all' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'chat.folders.archived' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'chat.folders.personal (3)' })).toBeInTheDocument();
  });

  it('works without the prop at all (badges stay off)', () => {
    renderBar();
    expect(screen.queryByText('3')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'chat.folders.all' })).toBeInTheDocument();
  });

  it('caps large totals at 99+', () => {
    renderBar({ all: 150 });
    expect(screen.getByRole('button', { name: 'chat.folders.all (150)' })).toHaveTextContent('99+');
  });

  it('still switches folders on click', () => {
    const setActiveFolder = vi.fn();
    render(
      <FolderFilterBar
        activeFolder="all"
        setActiveFolder={setActiveFolder}
        advancedFilters={noFilters}
        setShowAdvancedFilterModal={vi.fn()}
        t={t}
        folderUnread={{ groups: 2 }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'chat.folders.groups (2)' }));
    expect(setActiveFolder).toHaveBeenCalledWith('groups');
  });
});

describe('FolderFilterBar — custom folders', () => {
  const baseProps = {
    activeFolder: 'all',
    setActiveFolder: vi.fn(),
    advancedFilters: noFilters,
    setShowAdvancedFilterModal: vi.fn(),
    t,
  };

  it('renders custom folders with their stored names (not i18n keys) and counters', () => {
    render(
      <FolderFilterBar
        {...baseProps}
        customFolders={[{ id: 'cf-1', name: 'Work', chatIds: [1] }]}
        folderUnread={{ 'cf-1': 3 }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Work (3)' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'chat.folders.cf-1' })).not.toBeInTheDocument();
  });

  it('shows the edit control only when onEditFolders is provided, and fires it', () => {
    const onEdit = vi.fn();
    const { unmount } = render(<FolderFilterBar {...baseProps} onEditFolders={onEdit} />);
    fireEvent.click(screen.getByRole('button', { name: 'chat.folders.editFolder' }));
    expect(onEdit).toHaveBeenCalledTimes(1);

    unmount();
    render(<FolderFilterBar {...baseProps} />);
    expect(screen.queryByRole('button', { name: 'chat.folders.editFolder' })).not.toBeInTheDocument();
  });

  it('selects a custom folder on click', () => {
    const setActiveFolder = vi.fn();
    render(
      <FolderFilterBar
        {...baseProps}
        setActiveFolder={setActiveFolder}
        customFolders={[{ id: 'cf-1', name: 'Work', chatIds: [1] }]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Work' }));
    expect(setActiveFolder).toHaveBeenCalledWith('cf-1');
  });
});
