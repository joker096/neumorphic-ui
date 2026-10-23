import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { FolderManagerModal } from './FolderManagerModal';

const mockStore: any = {
  customFolders: [],
  addCustomFolder: vi.fn(),
  renameCustomFolder: vi.fn(),
  deleteCustomFolder: vi.fn(),
  setCustomFolderChats: vi.fn(),
  chats: [],
  channels: [],
};

vi.mock('../../store', () => ({
  useAppStore: (sel: any) => (typeof sel === 'function' ? sel(mockStore) : mockStore),
}));

const t = (key: string) => key;
const base = { open: true, onClose: vi.fn(), activeFolder: 'all', setActiveFolder: vi.fn(), t };

beforeEach(() => {
  mockStore.customFolders = [];
  mockStore.chats = [];
  mockStore.channels = [];
  vi.clearAllMocks();
});

describe('FolderManagerModal', () => {
  it('creates a folder from the input and trims the name', () => {
    render(<FolderManagerModal {...base} />);
    const input = screen.getByLabelText('chat.folders.folderNamePlaceholder');
    fireEvent.change(input, { target: { value: 'Work' } });
    expect(input).toHaveValue('Work');
    const createBtn = screen.getByRole('button', { name: 'chat.folders.create' });
    expect(createBtn).not.toBeDisabled();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockStore.addCustomFolder).toHaveBeenCalledWith('Work');
  });

  it('disables create on a blank name', () => {
    render(<FolderManagerModal {...base} />);
    expect(screen.getByRole('button', { name: 'chat.folders.create' })).toBeDisabled();
  });

  it('renames a folder inline', () => {
    mockStore.customFolders = [{ id: 'f1', name: 'Old', chatIds: [] }];
    render(<FolderManagerModal {...base} />);
    fireEvent.click(screen.getByRole('button', { name: 'chat.folders.editFolder' }));
    const input = screen
      .getAllByLabelText('chat.folders.editFolder')
      .find((el) => el instanceof HTMLInputElement);
    expect(input).toBeTruthy();
    fireEvent.change(input!, { target: { value: 'New' } });
    fireEvent.blur(input!);
    expect(mockStore.renameCustomFolder).toHaveBeenCalledWith('f1', 'New');
  });

  it('deletes a folder and resets the active folder to all', () => {
    mockStore.customFolders = [{ id: 'f1', name: 'Work', chatIds: [] }];
    const setActiveFolder = vi.fn();
    render(<FolderManagerModal {...base} activeFolder="f1" setActiveFolder={setActiveFolder} />);
    fireEvent.click(screen.getByRole('button', { name: 'chat.folders.deleteFolder' }));
    expect(mockStore.deleteCustomFolder).toHaveBeenCalledWith('f1');
    expect(setActiveFolder).toHaveBeenCalledWith('all');
  });

  it('assigns chats through the picker', () => {
    mockStore.customFolders = [{ id: 'f1', name: 'Work', chatIds: [] }];
    mockStore.chats = [{ id: 1, name: 'Alice' }];
    render(<FolderManagerModal {...base} />);
    fireEvent.click(screen.getByRole('button', { name: 'Work — chat.folders.chats' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Alice' }));
    expect(mockStore.setCustomFolderChats).toHaveBeenCalledWith('f1', [1]);
  });

  it('renders the empty state when there are no folders', () => {
    render(<FolderManagerModal {...base} />);
    expect(screen.getByText('chat.folders.empty')).toBeInTheDocument();
  });
});
