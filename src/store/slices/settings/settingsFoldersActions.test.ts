import { describe, it, expect } from 'vitest';
import { createFoldersActions } from './settingsFoldersActions';
import type { ChatFolder } from '../../../lib/chat/customFolders';

const makeHarness = (initial: ChatFolder[] = []) => {
  const state: { customFolders: ChatFolder[] } = { customFolders: initial };
  const get = () => state;
  const set = (partial: Partial<typeof state>) => {
    Object.assign(state, partial);
  };
  const actions = createFoldersActions(set, get);
  return { state, ...actions };
};

describe('createFoldersActions', () => {
  it('adds a folder with a trimmed name and empty membership', () => {
    const h = makeHarness();
    h.addCustomFolder('  Work  ');
    expect(h.state.customFolders).toHaveLength(1);
    expect(h.state.customFolders[0].name).toBe('Work');
    expect(h.state.customFolders[0].chatIds).toEqual([]);
    expect(h.state.customFolders[0].id).toBeTruthy();
  });

  it('ignores blank names', () => {
    const h = makeHarness();
    h.addCustomFolder('   ');
    expect(h.state.customFolders).toHaveLength(0);
  });

  it('renames a folder by id', () => {
    const h = makeHarness([{ id: 'f1', name: 'Old', chatIds: [] }]);
    h.renameCustomFolder('f1', '  New  ');
    expect(h.state.customFolders[0].name).toBe('New');
    h.renameCustomFolder('f1', '');
    expect(h.state.customFolders[0].name).toBe('New'); // invalid rename refused
  });

  it('deletes a folder by id', () => {
    const h = makeHarness([
      { id: 'f1', name: 'A', chatIds: [] },
      { id: 'f2', name: 'B', chatIds: [1] },
    ]);
    h.deleteCustomFolder('f1');
    expect(h.state.customFolders.map((f) => f.id)).toEqual(['f2']);
  });

  it('sets membership for a folder', () => {
    const h = makeHarness([{ id: 'f1', name: 'A', chatIds: [] }]);
    h.setCustomFolderChats('f1', [1, '2']);
    expect(h.state.customFolders[0].chatIds).toEqual([1, '2']);
  });
});
