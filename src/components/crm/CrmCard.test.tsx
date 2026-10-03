// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CrmCard } from './CrmCard';
import type { CrmContact, Deal, CrmTask } from '../../lib/crm/types';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    lang: 'en',
    setLang: vi.fn(),
  }),
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
  I18nContext: { Provider: ({ children }: { children: React.ReactNode }) => children },
}));

const now = Date.now();

const contact: CrmContact = {
  userId: 'usr_1',
  displayName: 'Alice',
  role: 'member',
  tags: ['vip', 'warm'],
  status: 'client',
  joinedAt: now,
  lastActive: now,
};

const deals: Deal[] = [
  { id: 'd1', title: 'A', contactId: 'usr_1', stage: 'proposal', amount: 500, currency: 'USD', ownerId: '', createdAt: now },
  { id: 'd2', title: 'B', contactId: 'usr_1', stage: 'won', amount: 100, currency: 'USD', ownerId: '', createdAt: now },
];

const tasks: CrmTask[] = [
  { id: 't1', title: 'Follow up', done: false, priority: 'high', createdAt: now, contactId: 'usr_1' },
];

describe('CrmCard', () => {
  it('renders status, tags, and deal/task metrics', () => {
    render(<CrmCard contact={contact} deals={deals} tasks={tasks} />);
    // status label
    expect(screen.getByText('crm.statusClient')).toBeTruthy();
    // tags
    expect(screen.getByText('#vip')).toBeTruthy();
    expect(screen.getByText('#warm')).toBeTruthy();
    // pipeline should exclude won deal (only open proposal 500)
    expect(screen.getByText('$500')).toBeTruthy();
    // open tasks shown (label + task title)
    expect(screen.getByText('crm.tabTasks')).toBeTruthy();
    expect(screen.getByText('Follow up')).toBeTruthy();
  });

  it('renders without deals/tasks', () => {
    render(<CrmCard contact={{ ...contact, tags: [] }} />);
    expect(screen.getByText('crm.statusClient')).toBeTruthy();
  });

  it('never labels a mixed-currency pipeline with one currency (no FX table exists)', () => {
    render(
      <CrmCard
        contact={contact}
        deals={[
          { ...deals[0], amount: 500, currency: 'USD' },
          { ...deals[0], id: 'd3', amount: 700, currency: 'RUB', stage: 'negotiation' },
        ]}
        tasks={[]}
      />,
    );
    // Sum is rendered locale-grouped but unlabelled; the old code printed "$1200".
    expect(screen.getByText('1,200')).toBeTruthy();
    expect(screen.queryByText(/\$/)).toBeNull();
  });

  it('shows quick call/video/message actions only when handlers are provided', () => {
    const onCall = vi.fn();
    const onVideoCall = vi.fn();
    const onMessage = vi.fn();
    const { rerender } = render(<CrmCard contact={contact} />);
    expect(screen.queryByLabelText('crm.call')).toBeNull();
    expect(screen.queryByLabelText('crm.videoCall')).toBeNull();
    expect(screen.queryByLabelText('crm.message')).toBeNull();

    rerender(<CrmCard contact={contact} onCall={onCall} onVideoCall={onVideoCall} onMessage={onMessage} />);
    fireEvent.click(screen.getByLabelText('crm.call'));
    fireEvent.click(screen.getByLabelText('crm.videoCall'));
    fireEvent.click(screen.getByLabelText('crm.message'));
    expect(onCall).toHaveBeenCalledTimes(1);
    expect(onVideoCall).toHaveBeenCalledTimes(1);
    expect(onMessage).toHaveBeenCalledTimes(1);
  });
});
