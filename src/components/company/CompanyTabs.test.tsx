import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CompanyTabs } from './CompanyTabs';
import type { CompanyTab } from './useCompanyContacts';

const TAB_LABELS: Record<CompanyTab, string> = {
  members: 'Members',
  departments: 'Departments',
  contacts: 'Contacts',
  inbox: 'Team Inbox',
  sitechat: 'Site Chats',
};

const renderTabs = (activeTab: CompanyTab = 'members', t: any = (k: string, fb?: string) => (fb ?? k)) => {
  const onSelect = vi.fn();
  const utils = render(<CompanyTabs activeTab={activeTab} onSelect={onSelect} t={t} />);
  return { onSelect, ...utils };
};

describe('CompanyTabs', () => {
  it('renders all 5 tab buttons with fallback labels', () => {
    renderTabs();
    (Object.keys(TAB_LABELS) as CompanyTab[]).forEach((tab) => {
      expect(screen.getByRole('button', { name: TAB_LABELS[tab] })).toBeInTheDocument();
    });
  });

  it('labels every tab via t(labelKey, fallback)', () => {
    const t = vi.fn((k: string, fb?: string) => fb ?? k);
    render(<CompanyTabs activeTab="members" onSelect={vi.fn()} t={t} />);
    expect(t).toHaveBeenCalledWith('company.tabs.members', 'Members');
    expect(t).toHaveBeenCalledWith('company.tabs.departments', 'Departments');
    expect(t).toHaveBeenCalledWith('company.tabs.contacts', 'Contacts');
    expect(t).toHaveBeenCalledWith('company.tabs.inbox', 'Team Inbox');
    expect(t).toHaveBeenCalledWith('company.tabs.sitechat', 'Site Chats');
  });

  it('renders custom labels from t()', () => {
    const t = vi.fn((k: string) => `Labeled: ${k}`);
    render(<CompanyTabs activeTab="members" onSelect={vi.fn()} t={t} />);
    expect(screen.getByRole('button', { name: 'Labeled: company.tabs.members' })).toBeInTheDocument();
  });

  it('marks the activeTab button with the primary style', () => {
    renderTabs('contacts');
    expect(screen.getByRole('button', { name: 'Contacts' })).toHaveClass(/button-primary-bg/);
    expect(screen.getByRole('button', { name: 'Members' })).not.toHaveClass(/button-primary-bg/);
  });

  it('does not mark other buttons active when a different tab is active', () => {
    renderTabs('sitechat');
    (Object.keys(TAB_LABELS) as CompanyTab[]).forEach((tab) => {
      if (tab === 'sitechat') return;
      expect(screen.getByRole('button', { name: TAB_LABELS[tab] })).not.toHaveClass(/button-primary-bg/);
    });
  });

  it('selects each tab key on click', () => {
    const { onSelect, getByRole } = renderTabs('members');
    (Object.keys(TAB_LABELS) as CompanyTab[]).forEach((tab) => {
      fireEvent.click(getByRole('button', { name: TAB_LABELS[tab] }));
      expect(onSelect).toHaveBeenCalledWith(tab);
    });
  });

  it('selects "members" exactly once when Members tab is clicked', () => {
    const { onSelect } = renderTabs();
    fireEvent.click(screen.getByRole('button', { name: 'Members' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('members');
  });
});
