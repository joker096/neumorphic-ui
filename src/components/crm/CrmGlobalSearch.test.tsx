// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CrmGlobalSearch } from './CrmGlobalSearch';
import type { CrmContact, Deal, CrmTask } from '../../lib/crm/types';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key) }),
}));

const now = Date.parse('2026-01-01T00:00:00Z');

const alice: CrmContact = {
  userId: 'u1',
  displayName: 'Alice',
  role: 'member',
  tags: [],
  status: 'client',
  title: 'CTO',
  email: 'alpha@x.io',
};
const deal: Deal = {
  id: 'd1',
  title: 'Alpha deal',
  contactId: 'u1',
  stage: 'new',
  amount: 10,
  currency: 'USD',
  ownerId: 'u1',
  createdAt: now,
};
const task: CrmTask = { id: 't1', title: 'Alpha task', done: false, priority: 'high', createdAt: now };

const type = (value: string) => {
  const input = screen.getByPlaceholderText('Search people, deals, tasks…');
  fireEvent.change(input, { target: { value } });
  return input;
};

describe('CrmGlobalSearch', () => {
  it('groups matching people, deals and tasks with subtitles', () => {
    render(<CrmGlobalSearch contacts={[alice]} deals={[deal]} tasks={[task]} onPick={() => {}} />);
    const input = type('alpha');
    expect(input).toBeTruthy();
    expect(screen.getByText('People')).toBeTruthy();
    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.getByText('CTO')).toBeTruthy();
    expect(screen.getByText('Deals')).toBeTruthy();
    expect(screen.getByText('Alpha deal')).toBeTruthy();
    expect(screen.getByText('Tasks')).toBeTruthy();
    expect(screen.getByText('Alpha task')).toBeTruthy();
  });

  it('picks a hit, reports it and clears the query', () => {
    const onPick = vi.fn();
    render(<CrmGlobalSearch contacts={[alice]} deals={[deal]} tasks={[task]} onPick={onPick} />);
    const input = type('alice');
    expect(onPick).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Alice'));
    expect(onPick).toHaveBeenCalledWith('people', 'u1');
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('picks deals and tasks by id', () => {
    const onPick = vi.fn();
    render(<CrmGlobalSearch contacts={[alice]} deals={[deal]} tasks={[task]} onPick={onPick} />);
    type('alpha deal');
    fireEvent.click(screen.getByText('Alpha deal'));
    expect(onPick).toHaveBeenCalledWith('deals', 'd1');

    type('alpha task');
    fireEvent.click(screen.getByText('Alpha task'));
    expect(onPick).toHaveBeenCalledWith('tasks', 't1');
  });

  it('shows a no-results message when nothing matches', () => {
    render(<CrmGlobalSearch contacts={[alice]} deals={[deal]} tasks={[task]} onPick={() => {}} />);
    type('zzz-no-match');
    expect(screen.getByText('No results')).toBeTruthy();
  });

  it('caps each group at five hits', () => {
    const many: CrmContact[] = Array.from({ length: 6 }, (_, i) => ({
      ...alice,
      userId: `u${i}`,
      displayName: `Alice ${i}`,
    }));
    render(<CrmGlobalSearch contacts={many} deals={[]} tasks={[]} onPick={() => {}} />);
    type('alice');
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });
});
