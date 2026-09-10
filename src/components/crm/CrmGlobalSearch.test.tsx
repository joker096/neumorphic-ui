// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CrmGlobalSearch } from './CrmGlobalSearch';
import type { CrmContact, Deal, CrmTask } from '../../lib/crm/types';

const { state, useAppStore, setCrmFilter } = vi.hoisted(() => {
  const state: any = { crmFilters: { search: '' } };
  const setCrmFilter = vi.fn((key: string, value: string) => {
    state.crmFilters = { ...state.crmFilters, [key]: value };
  });
  state.setCrmFilter = setCrmFilter;
  const useAppStore = vi.fn((selector?: (s: any) => any) => (selector ? selector(state) : state));
  return { state, useAppStore, setCrmFilter };
});

vi.mock('../../store', () => ({ useAppStore }));
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
  state.crmFilters = { ...state.crmFilters, search: value };
  const input = screen.getByPlaceholderText('Search people, deals, tasks…');
  fireEvent.change(input, { target: { value } });
  return input as HTMLInputElement;
};

beforeEach(() => {
  state.crmFilters = { search: '' };
  setCrmFilter.mockClear();
});

describe('CrmGlobalSearch', () => {
  it('writes the query into crmFilters.search', () => {
    render(<CrmGlobalSearch contacts={[alice]} deals={[deal]} tasks={[task]} onPick={() => {}} />);
    type('alpha');
    expect(setCrmFilter).toHaveBeenCalledWith('search', 'alpha');
  });

  it('groups matching people, deals and tasks with subtitles', () => {
    render(<CrmGlobalSearch contacts={[alice]} deals={[deal]} tasks={[task]} onPick={() => {}} />);
    type('alpha');
    expect(screen.getByText('People')).toBeTruthy();
    expect(screen.getByText('CTO')).toBeTruthy();
    expect(screen.getByText('Deals')).toBeTruthy();
    expect(screen.getByText('Alpha deal')).toBeTruthy();
    expect(screen.getByText('Tasks')).toBeTruthy();
    expect(screen.getByText('Alpha task')).toBeTruthy();
  });

  it('picks a person and retains the query', () => {
    const onPick = vi.fn();
    render(<CrmGlobalSearch contacts={[alice]} deals={[deal]} tasks={[task]} onPick={onPick} />);
    const input = type('alice');
    fireEvent.click(screen.getByText('CTO').closest('button')!);
    expect(onPick).toHaveBeenCalledWith('people', 'u1');
    expect(input.value).toBe('alice');
  });

  it('picks deals and tasks by id', () => {
    const onPick = vi.fn();
    render(<CrmGlobalSearch contacts={[alice]} deals={[deal]} tasks={[task]} onPick={onPick} />);
    type('alpha deal');
    fireEvent.click(screen.getByText('Alpha deal').closest('button')!);
    expect(onPick).toHaveBeenCalledWith('deals', 'd1');

    type('alpha task');
    fireEvent.click(screen.getByText('Alpha task').closest('button')!);
    expect(onPick).toHaveBeenCalledWith('tasks', 't1');
  });

  it('clears the global search', () => {
    render(<CrmGlobalSearch contacts={[alice]} deals={[deal]} tasks={[task]} onPick={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
    const input = type('alice');
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    fireEvent.mouseDown(document.body);
    expect(setCrmFilter).toHaveBeenCalledWith('search', '');
    expect(input.value).toBe('');
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
  });

  it('shows a no-results message when nothing matches', () => {
    render(<CrmGlobalSearch contacts={[alice]} deals={[deal]} tasks={[task]} onPick={() => {}} />);
    type('zzz-no-match');
    expect(screen.getByText('No results')).toBeTruthy();
  });

  it('caps each people group at five hits', () => {
    const many: CrmContact[] = Array.from({ length: 6 }, (_, i) => ({
      ...alice,
      userId: `u${i}`,
      displayName: `Alice ${i}`,
    }));
    render(<CrmGlobalSearch contacts={many} deals={[]} tasks={[]} onPick={() => {}} />);
    type('alice');
    const buttons = screen.getAllByRole('button').filter((b) => (b.textContent ?? '').trim());
    expect(buttons).toHaveLength(5);
  });
});
