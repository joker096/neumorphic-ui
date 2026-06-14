import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Dialpad } from './Dialpad';

vi.mock('../store', () => ({
  useAppStore: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('../lib/i18n', () => ({
  useI18n: vi.fn(() => ({ t: (key: string) => key })),
}));

const { useAppStore } = await import('../store');
const mockUseAppStore = vi.mocked(useAppStore);

const editContacts = [
  { name: 'Alice Freeman', id: 'alice_freeman_id', color: 'from-rose-400 to-red-500', lastSeen: 300000 },
  { name: 'Bob Smith', id: 'bob_smith_id', color: 'from-blue-400 to-indigo-500', lastSeen: 7200000 },
];

describe('Dialpad contact editing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppStore.mockReturnValue({
      activeCall: null,
      setActiveCall: vi.fn(),
    });
  });

  it('opens edit form when Edit clicked in contact profile', () => {
    const setContacts = vi.fn();
    render(
      <Dialpad
        theme="dark"
        contacts={editContacts}
        setContacts={setContacts}
        showContactPicker={false}
        setShowContactPicker={vi.fn()}
        onCall={vi.fn()}
        onMessage={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Alice Freeman'));
    fireEvent.click(screen.getByText('contacts.edit'));
    expect(screen.getByDisplayValue('Alice Freeman')).toBeTruthy();
  });

  it('saves edited contact name', () => {
    const setContacts = vi.fn();
    render(
      <Dialpad
        theme="dark"
        contacts={editContacts}
        setContacts={setContacts}
        showContactPicker={false}
        setShowContactPicker={vi.fn()}
        onCall={vi.fn()}
        onMessage={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Alice Freeman'));
    fireEvent.click(screen.getByText('contacts.edit'));
    fireEvent.change(screen.getByDisplayValue('Alice Freeman'), { target: { value: 'Alice Updated' } });
    fireEvent.click(screen.getByText('contacts.saveChanges'));
    expect(setContacts).toHaveBeenCalledWith([
      { name: 'Alice Updated', id: 'alice_freeman_id', color: 'from-rose-400 to-red-500', lastSeen: 300000, localFields: [] },
      { name: 'Bob Smith', id: 'bob_smith_id', color: 'from-blue-400 to-indigo-500', lastSeen: 7200000 },
    ]);
  });

  it('cancels edit without saving', () => {
    const setContacts = vi.fn();
    render(
      <Dialpad
        theme="dark"
        contacts={editContacts}
        setContacts={setContacts}
        showContactPicker={false}
        setShowContactPicker={vi.fn()}
        onCall={vi.fn()}
        onMessage={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Alice Freeman'));
    fireEvent.click(screen.getByText('contacts.edit'));
    const closeButtons = screen.getAllByTitle('contacts.close');
    fireEvent.click(closeButtons[closeButtons.length - 1]);
    expect(screen.queryByText('contacts.editContact')).toBeFalsy();
    expect(setContacts).not.toHaveBeenCalled();
  });

  it('shows edit contact modal with correct title', () => {
    const setContacts = vi.fn();
    render(
      <Dialpad
        theme="dark"
        contacts={editContacts}
        setContacts={setContacts}
        showContactPicker={false}
        setShowContactPicker={vi.fn()}
        onCall={vi.fn()}
        onMessage={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Alice Freeman'));
    fireEvent.click(screen.getByText('contacts.edit'));
    expect(screen.getByText('contacts.editContact')).toBeTruthy();
  });
});
