// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CrmContactRow } from './CrmContactRow';
import type { CrmContact } from '../../../lib/crm/types';

vi.mock('../../../store', () => ({
  useAppStore: (selector: any) => selector({ crmCustomRoles: [] }),
}));
vi.mock('../../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key) }),
}));

const t = (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key);

const contact = {
  userId: 'c1',
  displayName: 'Alice',
  role: 'manager',
  tags: [],
  status: 'lead',
} as unknown as CrmContact;

const base = {
  contact,
  index: 0,
  userId: 'u1',
  selectMode: false,
  isSelected: false,
  highlighted: false,
  t,
  resolveManager: () => null,
};

describe('CrmContactRow', () => {
  it('opens the conversation from the row action', () => {
    const onMessage = vi.fn();
    render(<CrmContactRow {...base} onOpen={() => {}} onMessage={onMessage} onToggleSelect={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'crm.openChat' }));
    expect(onMessage).toHaveBeenCalledWith(contact);
  });

  it('routes a plain row click to onOpen', () => {
    const onOpen = vi.fn();
    render(<CrmContactRow {...base} onOpen={onOpen} onMessage={() => {}} onToggleSelect={() => {}} />);
    fireEvent.click(screen.getByText('Alice'));
    expect(onOpen).toHaveBeenCalledWith(contact);
  });

  it('hides the open-chat action in selection mode', () => {
    render(<CrmContactRow {...base} selectMode onOpen={() => {}} onMessage={() => {}} onToggleSelect={() => {}} />);
    expect(screen.queryByRole('button', { name: 'crm.openChat' })).toBeNull();
  });
});
