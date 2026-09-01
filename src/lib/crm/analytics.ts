/**
 * Local-only CRM analytics.
 *
 * Privacy-first: everything is computed on-device from CRM state + optional
 * broadcast read-stats. No network, no telemetry.
 */

import type { CrmContact, CrmContactStatus, Deal, DealStage, CrmTask } from './types';

export interface ChurnRisk {
  userId: string;
  displayName: string;
  reason: 'stale-no-active-deal' | 'no-engagement';
}

export interface BroadcastReadStats {
  sent: number;
  read: number;
}

export interface CrmAnalytics {
  totalContacts: number;
  byStatus: Record<CrmContactStatus, number>;
  pipelineValue: number; // open deals (not lost)
  wonValue: number;
  byStage: Record<DealStage, number>;
  byStageValue: Record<DealStage, number>;
  dealsOpen: number;
  tasksOpen: number;
  tasksDone: number;
  tasksOverdue: number;
  churnRisk: ChurnRisk[];
  broadcastCTR: number | null; // 0..1, null if no read stats
}

const STALE_DAYS = 30;
const STALE_MS = STALE_DAYS * 24 * 60 * 60 * 1000;

export function computeCrmAnalytics(
  contacts: CrmContact[],
  deals: Deal[],
  tasks: CrmTask[],
  readStats?: BroadcastReadStats,
): CrmAnalytics {
  const now = Date.now();
  const byStatus = {
    lead: 0, client: 0, partner: 0, vendor: 0, internal: 0, vip: 0,
  } as Record<CrmContactStatus, number>;
  for (const c of contacts) {
    if (c.status in byStatus) byStatus[c.status] += 1;
  }

  const byStage = {
    new: 0, qualified: 0, proposal: 0, negotiation: 0, won: 0, lost: 0,
  } as Record<DealStage, number>;
  const byStageValue = {
    new: 0, qualified: 0, proposal: 0, negotiation: 0, won: 0, lost: 0,
  } as Record<DealStage, number>;
  let pipelineValue = 0;
  let wonValue = 0;
  let dealsOpen = 0;
  for (const d of deals) {
    if (d.stage in byStage) {
      byStage[d.stage] += 1;
      byStageValue[d.stage] += d.amount;
    }
    if (d.stage === 'won') {
      wonValue += d.amount;
    } else if (d.stage !== 'lost') {
      pipelineValue += d.amount;
      dealsOpen += 1;
    }
  }

  let tasksOpen = 0;
  let tasksDone = 0;
  let tasksOverdue = 0;
  for (const t of tasks) {
    if (t.done) {
      tasksDone += 1;
    } else {
      tasksOpen += 1;
      if (t.dueAt != null && t.dueAt < now) tasksOverdue += 1;
    }
  }

  const activeDealContactIds = new Set(
    deals.filter((d) => d.stage !== 'lost' && d.stage !== 'won').map((d) => d.contactId),
  );
  const churnRisk: ChurnRisk[] = contacts
    .filter((c) =>
      (c.status === 'client' || c.status === 'vip' || c.status === 'partner') &&
      !activeDealContactIds.has(c.userId) &&
      (c.lastActive == null || now - c.lastActive > STALE_MS),
    )
    .map((c) => ({
      userId: c.userId,
      displayName: c.displayName,
      reason: (c.lastActive == null ? 'no-engagement' : 'stale-no-active-deal') as ChurnRisk['reason'],
    }));

  const broadcastCTR =
    readStats && readStats.sent > 0 ? readStats.read / readStats.sent : null;

  return {
    totalContacts: contacts.length,
    byStatus,
    pipelineValue,
    wonValue,
    byStage,
    byStageValue,
    dealsOpen,
    tasksOpen,
    tasksDone,
    tasksOverdue,
    churnRisk,
    broadcastCTR,
  };
}

/** Derive broadcast read stats from a chat history of outbound messages. */
export function readStatsFromHistory(
  history: Array<{ sender?: string; status?: 'sent' | 'delivered' | 'read' }>,
): BroadcastReadStats {
  let sent = 0;
  let read = 0;
  for (const m of history) {
    if (m.sender === 'me') {
      sent += 1;
      if (m.status === 'read') read += 1;
    }
  }
  return { sent, read };
}
