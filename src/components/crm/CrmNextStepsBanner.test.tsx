// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CrmNextStepsBanner } from './CrmNextStepsBanner';

const { state } = vi.hoisted(() => ({ state: { crmTasks: [] as any[] } }));

vi.mock('../../store', () => ({ useAppStore: (selector: any) => selector(state) }));
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key) }),
}));

const at = (iso: string) => new Date(iso).getTime();

describe('CrmNextStepsBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-03T10:00:00'));
    state.crmTasks = [];
  });
  afterEach(() => vi.useRealTimers());

  it('renders overdue and due-today counts, ignoring done/future tasks', () => {
    state.crmTasks = [
      { id: 't1', title: 'Late A', done: false, priority: 'high', dueAt: at('2026-10-01T10:00:00'), createdAt: 0 },
      { id: 't2', title: 'Late B', done: false, priority: 'high', dueAt: at('2026-10-02T10:00:00'), createdAt: 0 },
      { id: 't3', title: 'Today', done: false, priority: 'medium', dueAt: at('2026-10-03T18:00:00'), createdAt: 0 },
      { id: 't4', title: 'Future', done: false, priority: 'low', dueAt: at('2026-10-10T10:00:00'), createdAt: 0 },
      { id: 't5', title: 'Done late', done: true, priority: 'low', dueAt: at('2026-10-01T10:00:00'), createdAt: 0 },
    ];
    render(<CrmNextStepsBanner onOpenTasks={() => {}} />);
    expect(screen.getByText('Overdue')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('Due today')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('renders nothing when there are no actionable tasks', () => {
    state.crmTasks = [
      { id: 't1', title: 'Future', done: false, priority: 'low', dueAt: at('2026-10-10T10:00:00'), createdAt: 0 },
      { id: 't2', title: 'Done', done: true, priority: 'low', dueAt: at('2026-10-01T10:00:00'), createdAt: 0 },
      { id: 't3', title: 'No date', done: false, priority: 'low', dueAt: null, createdAt: 0 },
    ];
    const { container } = render(<CrmNextStepsBanner onOpenTasks={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('opens the tasks tab when clicked', () => {
    state.crmTasks = [
      { id: 't1', title: 'Late', done: false, priority: 'high', dueAt: at('2026-10-01T10:00:00'), createdAt: 0 },
    ];
    const onOpenTasks = vi.fn();
    render(<CrmNextStepsBanner onOpenTasks={onOpenTasks} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onOpenTasks).toHaveBeenCalledTimes(1);
  });
});
