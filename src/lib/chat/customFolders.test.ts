import { describe, it, expect } from 'vitest';
import {
  createCustomFolderId,
  folderHasChat,
  sanitizeCustomFolderName,
  toggleChatInFolder,
  MAX_CUSTOM_FOLDER_NAME,
  type ChatFolder,
} from './customFolders';

const folder = (over: Partial<ChatFolder> = {}): ChatFolder => ({
  id: 'f1',
  name: 'Work',
  chatIds: [1, '2'],
  ...over,
});

describe('customFolders', () => {
  it('sanitizes and caps folder names', () => {
    expect(sanitizeCustomFolderName('  Work  ')).toBe('Work');
    expect(sanitizeCustomFolderName('   ')).toBe('');
    expect(sanitizeCustomFolderName('x'.repeat(80)).length).toBe(MAX_CUSTOM_FOLDER_NAME);
  });

  it('generates unique, non-empty ids', () => {
    expect(createCustomFolderId()).toBeTruthy();
    expect(createCustomFolderId()).not.toBe(createCustomFolderId());
  });

  it('compares chat ids after stringification', () => {
    const f = folder();
    expect(folderHasChat(f, 1)).toBe(true);
    expect(folderHasChat(f, '1')).toBe(true);
    expect(folderHasChat(f, '2')).toBe(true);
    expect(folderHasChat(f, 3)).toBe(false);
  });

  it('toggles membership on and off without mutating the input', () => {
    const f = folder();
    const on = toggleChatInFolder(f, 3);
    expect(on.chatIds).toContain(3);
    expect(folderHasChat(f, 3)).toBe(false); // input untouched
    const off = toggleChatInFolder(on, '3');
    expect(folderHasChat(off, 3)).toBe(false);
  });
});
