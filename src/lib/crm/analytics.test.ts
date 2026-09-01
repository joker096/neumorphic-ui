import { describe, it, expect } from 'vitest';
import { computeCrmAnalytics, readStatsFromHistory } from './analytics';
import type { CrmContact, Deal, CrmTask } from './types';

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

const contact = (over: Partial<CrmContact> = {}): CrmContact => ({
  userId: 'usr_1',
  displayName: 'Alice',
  role: 'member',
  tags: [],
  status: 'lead',
  joinedAt: now,
  lastActive: now,
  ...over,
});

const deal = (over: Partial<Deal> = {}): Deal => ({
  id: 'deal_1',
  title: 'Deal',
  contactId: 'usr_1',
  stage: 'new',
  amount: 100,
  currency: 'USD',
  ownerId: '',
  createdAt: now,
  ...over,
});

const task = (over: Partial<CrmTask> = {}): CrmTask => ({
  id: 'task_1',
  title: 'Task',
  done: false,
  priority: 'medium',
  createdAt: now,
  ...over,
});

describe('computeCrmAnalytics', () => {
  it('counts by status and pipeline value (excludes lost)', () => {
    const a = computeCrmAnalytics(
      [contact({ status: 'client' }), contact({ userId: 'usr_2', status: 'lead' })],
      [deal({ amount: 200, stage: 'won' }), deal({ contactId: 'usr_2', amount: 50, stage: 'lost' }), deal({ contactId: 'usr_3', amount: 80, stage: 'proposal' })],
      [],
    );
    expect(a.totalContacts).toBe(2);
    expect(a.byStatus.client).toBe(1);
    expect(a.byStatus.lead).toBe(1);
    expect(a.wonValue).toBe(200);
    expect(a.pipelineValue).toBe(80); // lost excluded
    expect(a.byStage.lost).toBe(1);
  });

  it('flags churn risk for stale high-value contacts with no active deal', () => {
    const a = computeCrmAnalytics(
      [contact({ status: 'client', lastActive: now - 40 * day })],
      [],
      [],
    );
    expect(a.churnRisk).toHaveLength(1);
    expect(a.churnRisk[0].userId).toBe('usr_1');
    expect(a.churnRisk[0].reason).toBe('stale-no-active-deal');
  });

  it('does not flag active contacts or those with open deals', () => {
    const a = computeCrmAnalytics(
      [contact({ status: 'client', lastActive: now - 40 * day })],
      [deal({ stage: 'negotiation' })],
      [],
    );
    expect(a.churnRisk).toHaveLength(0);
  });

  it('counts open/overdue tasks', () => {
    const a = computeCrmAnalytics(
      [contact()],
      [],
      [task(), task({ id: 't2', done: true }), task({ id: 't3', dueAt: now - day })],
    );
    expect(a.tasksOpen).toBe(2);
    expect(a.tasksDone).toBe(1);
    expect(a.tasksOverdue).toBe(1);
  });

  it('computes broadcast CTR from read stats', () => {
    expect(computeCrmAnalytics([contact()], [], [], { sent: 4, read: 1 }).broadcastCTR).toBe(0.25);
    expect(computeCrmAnalytics([contact()], [], []).broadcastCTR).toBeNull();
  });
});

describe('readStatsFromHistory', () => {
  it('counts only outbound messages', () => {
    const stats = readStatsFromHistory([
      { sender: 'me', status: 'read' },
      { sender: 'me', status: 'delivered' },
      { sender: 'them', status: 'read' },
    ]);
    expect(stats).toEqual({ sent: 2, read: 1 });
  });
});
