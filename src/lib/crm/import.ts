/**
 * Universal CRM importer (M1.1).
 *
 * Parses competitor / spreadsheet exports (CSV or JSON) and maps them to the
 * Mess&Anger CRM domain model (CrmContact / Deal / CrmTask). Designed for
 * privacy-first, local-only migration — no network, no cloud, no telemetry.
 *
 * Two source shapes are supported:
 *  - Flat rows (CSV, or JSON array of flat objects, or single JSON object):
 *    each row becomes one contact, optionally with one deal + one task.
 *  - Structured JSON: { contacts: [...], deals: [...], tasks: [...] }.
 *
 * This module is the orchestration layer (plan → apply → entry point); the
 * mechanical parts live in siblings: crmImportTypes (public types),
 * crmImportAliases (header vocabularies), crmImportValues (parsing/mapping),
 * crmImportExtract (record → drafts) and crmImportParse (CSV/JSON → records).
 */

import type { CrmContact, CrmTask, Deal } from './types';
import type {
  DraftContact,
  DraftDeal,
  DraftTask,
  ImportFormat,
  ImportIssue,
  ImportOptions,
  ImportPlan,
  ImportResult,
  RawRecord,
} from './crmImportTypes';
import { extractContact, extractDeal, extractTask } from './crmImportExtract';
import { detectFormat, isStructured, objToRaw, parseCsvToRecords, perObjectContactsOnly } from './crmImportParse';
import { handlesForContact, parseDate, uid } from './crmImportValues';

export type {
  DraftContact,
  DraftDeal,
  DraftTask,
  ImportFormat,
  ImportIssue,
  ImportIssueCode,
  ImportOptions,
  ImportPlan,
  ImportResult,
  RawRecord,
} from './crmImportTypes';
export { parseDate } from './crmImportValues';

// ---------------------------------------------------------------------------
// Plan building
// ---------------------------------------------------------------------------

function buildPlan(
  contactRecs: RawRecord[],
  dealRecs: RawRecord[],
  taskRecs: RawRecord[],
  opts: ImportOptions,
  structured: boolean,
): ImportPlan {
  const issues: ImportIssue[] = [];
  const contacts: DraftContact[] = [];
  const deals: DraftDeal[] = [];
  const tasks: DraftTask[] = [];

  if (!structured) {
    contactRecs.forEach((rec, idx) => {
      const row = idx + 1;
      const c = extractContact(rec, row, issues);
      if (c) {
        contacts.push(c);
        const d = extractDeal(rec, undefined, row, issues, opts);
        if (d) deals.push(d);
        const t = extractTask(rec, undefined, row, issues);
        if (t) tasks.push(t);
      } else {
        const d = extractDeal(rec, undefined, row, issues, opts);
        const t = extractTask(rec, undefined, row, issues);
        if (!d && !t) {
          issues.push({ row, code: 'row-skipped', severity: 'warning' });
        }
      }
    });
  } else {
    contactRecs.forEach((rec, idx) => {
      const c = extractContact(rec, idx + 1, issues);
      if (c) contacts.push(c);
    });
    dealRecs.forEach((rec, idx) => {
      const d = extractDeal(rec, undefined, idx + 1, issues, opts);
      if (d) deals.push(d);
    });
    taskRecs.forEach((rec, idx) => {
      const t = extractTask(rec, undefined, idx + 1, issues);
      if (t) tasks.push(t);
    });
  }

  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;
  return { contacts, deals, tasks, issues, stats: { contacts: contacts.length, deals: deals.length, tasks: tasks.length, errors, warnings } };
}

// ---------------------------------------------------------------------------
// Apply plan → final domain objects
// ---------------------------------------------------------------------------

export function applyPlan(plan: ImportPlan, opts: ImportOptions = {}): ImportResult {
  const existingHandleToId = new Map<string, string>();
  const existingByHandle = new Map<string, CrmContact>();
  (opts.existingContacts ?? []).forEach((c) => {
    handlesForContact({ phone: c.phone, email: c.email, name: c.displayName }).forEach((h) => {
      existingHandleToId.set(h, c.userId);
      existingByHandle.set(h, c);
    });
  });

  const skip = opts.skipDuplicates ?? true;
  const sourceTag = opts.source ? `imported:${opts.source}` : undefined;
  const handleToId = new Map<string, string>();
  const seen = new Set<string>();
  const contacts: CrmContact[] = [];
  const mergedContacts: CrmContact[] = [];
  let duplicatesSkipped = 0;
  let mergedCount = 0;

  for (const d of plan.contacts) {
    const handles = handlesForContact({ phone: d.phone, email: d.email, name: d.displayName });
    const primary = handles[0];
    if (!primary) continue;

    if (seen.has(primary)) {
      if (skip) { duplicatesSkipped += 1; continue; }
    }
    if (skip) {
      const existing = primary ? existingByHandle.get(primary) : undefined;
      if (existing) {
        const tags = Array.from(new Set([...(existing.tags ?? []), ...(d.tags ?? []), ...(sourceTag ? [sourceTag] : [])]));
        const merged: CrmContact = {
          ...existing,
          phone: existing.phone ?? d.phone,
          email: existing.email ?? d.email,
          title: existing.title ?? d.title,
          notes: existing.notes ?? d.notes,
          avatarColor: existing.avatarColor ?? undefined,
          status: existing.status !== 'lead' ? existing.status : d.status,
          tags,
          lastActive: Date.now(),
        };
        handles.forEach((h) => { if (!handleToId.has(h)) handleToId.set(h, existing.userId); });
        mergedContacts.push(merged);
        mergedCount += 1;
        duplicatesSkipped += 1;
        continue;
      }
    }

    const id = `usr_${uid()}`;
    seen.add(primary);
    handles.forEach((h) => handleToId.set(h, id));
    contacts.push({
      userId: id,
      displayName: d.displayName,
      role: d.role,
      departmentId: null,
      title: d.title,
      phone: d.phone,
      email: d.email,
      tags: sourceTag ? [...(d.tags ?? []), sourceTag] : d.tags,
      notes: d.notes,
      status: d.status,
      online: false,
      joinedAt: Date.now(),
      lastActive: Date.now(),
    });
  }

  const dealTitleMap = new Map<string, string>();
  const deals: Deal[] = [];
  for (const d of plan.deals) {
    const id = `deal_${uid()}`;
    let contactId = '';
    if (d.contactRef && handleToId.has(d.contactRef)) contactId = handleToId.get(d.contactRef)!;
    deals.push({
      id,
      title: d.title,
      contactId,
      stage: d.stage,
      amount: d.amount,
      currency: d.currency,
      ownerId: opts.defaultOwnerId ?? '',
      expectedClose: d.expectedClose ?? null,
      createdAt: Date.now(),
      notes: d.notes,
    });
    dealTitleMap.set(d.title.trim().toLowerCase(), id);
  }

  const tasks: CrmTask[] = [];
  for (const t of plan.tasks) {
    const id = `task_${uid()}`;
    let contactId: string | null = null;
    if (t.contactRef && handleToId.has(t.contactRef)) contactId = handleToId.get(t.contactRef)!;
    let dealId: string | null = null;
    if (t.dealRef && dealTitleMap.has(t.dealRef.trim().toLowerCase())) dealId = dealTitleMap.get(t.dealRef.trim().toLowerCase())!;
    tasks.push({
      id,
      title: t.title,
      done: t.done,
      priority: t.priority,
      dueAt: parseDate(t.due),
      assigneeId: null,
      contactId,
      dealId,
      createdAt: Date.now(),
    });
  }

  return {
    contacts,
    mergedContacts,
    deals,
    tasks,
    issues: plan.issues,
    stats: {
      importedContacts: contacts.length,
      mergedContacts: mergedCount,
      importedDeals: deals.length,
      importedTasks: tasks.length,
      duplicatesSkipped,
      errors: plan.issues.filter((i) => i.severity === 'error').length,
      warnings: plan.issues.filter((i) => i.severity === 'warning').length,
    },
  };
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function importFromText(
  text: string,
  opts: ImportOptions = {},
): { format: ImportFormat; plan: ImportPlan; result: ImportResult } {
  const format = detectFormat(text, opts.formatHint);
  let contactRecs: RawRecord[] = [];
  let dealRecs: RawRecord[] = [];
  let taskRecs: RawRecord[] = [];
  let structured = false;

  if (format === 'json') {
    const parsed: unknown = JSON.parse(text);
    if (Array.isArray(parsed)) {
      const recs = parsed.map(objToRaw);
      contactRecs = recs; dealRecs = recs; taskRecs = recs;
    } else if (isStructured(parsed)) {
      const p = parsed as Record<string, unknown[]>;
      contactRecs = (p.contacts ?? []).map(objToRaw);
      dealRecs = (p.deals ?? []).map(objToRaw);
      taskRecs = (p.tasks ?? []).map(objToRaw);
      structured = true;
    } else {
      const recs = [objToRaw(parsed)];
      contactRecs = recs; dealRecs = recs; taskRecs = perObjectContactsOnly(recs);
    }
  } else {
    const recs = parseCsvToRecords(text);
    contactRecs = recs; dealRecs = recs; taskRecs = recs;
  }

  const plan = buildPlan(contactRecs, dealRecs, taskRecs, opts, structured);
  const result = applyPlan(plan, opts);
  return { format, plan, result };
}