import type { SystemRole } from './types';
import type { DraftContact, DraftDeal, DraftTask, ImportIssue, ImportOptions, RawRecord } from './crmImportTypes';
import {
  AMOUNT_ALIASES,
  DEAL_CLOSE_ALIASES,
  DEAL_CONTACT_ALIASES,
  DEAL_NOTES_ALIASES,
  DEAL_SPECIFIC_ALIASES,
  DEAL_TITLE_FALLBACK,
  EMAIL_ALIASES,
  FIRST_ALIASES,
  LAST_ALIASES,
  NAME_ALIASES,
  NOTES_ALIASES,
  PHONE_ALIASES,
  STAGE_ALIASES,
  STATUS_ALIASES,
  TAGS_ALIASES,
  TASK_CONTACT_ALIASES,
  TASK_DEAL_ALIASES,
  TASK_DONE_ALIASES,
  TASK_DUE_ALIASES,
  TASK_PRIORITY_ALIASES,
  TASK_SPECIFIC_ALIASES,
  TITLE_ALIASES,
} from './crmImportAliases';
import { handleFromString, mapDone, mapPriority, mapStage, mapStatus, parseAmount, parseDate, parseTags, pick } from './crmImportValues';

/**
 * Raw record → draft contact / deal / task. A record yields a contact when it has
 * a name, a deal when it has a deal column or amount+stage, a task when it has a
 * task column.
 */

export function extractContact(rec: RawRecord, row: number, issues: ImportIssue[]): DraftContact | null {
  let name = pick(rec, NAME_ALIASES);
  if (!name) {
    const f = pick(rec, FIRST_ALIASES);
    const l = pick(rec, LAST_ALIASES);
    if (f || l) name = `${f ?? ''} ${l ?? ''}`.trim();
  }
  if (!name) return null;

  const phone = pick(rec, PHONE_ALIASES)?.trim() || undefined;
  const email = pick(rec, EMAIL_ALIASES)?.trim() || undefined;
  const statusRaw = pick(rec, STATUS_ALIASES)?.trim();
  const status = mapStatus(statusRaw, row, issues);
  const tags = parseTags(pick(rec, TAGS_ALIASES));
  const title = pick(rec, TITLE_ALIASES)?.trim() || undefined;
  const notes = pick(rec, NOTES_ALIASES)?.trim() || undefined;

  return { displayName: name, phone, email, status, tags, title, notes, role: 'member' as SystemRole };
}

export function extractDeal(rec: RawRecord, contactRef: string | undefined, row: number, issues: ImportIssue[], opts: ImportOptions): DraftDeal | null {
  const dealSpecific = pick(rec, DEAL_SPECIFIC_ALIASES);
  const amountRaw = pick(rec, AMOUNT_ALIASES);
  const stageRaw = pick(rec, STAGE_ALIASES);
  if (!dealSpecific && !(amountRaw && stageRaw)) return null;

  const title = (dealSpecific ?? pick(rec, DEAL_TITLE_FALLBACK) ?? 'Сделка').trim();
  const stage = mapStage(stageRaw, row, issues);
  const { amount, currency } = parseAmount(amountRaw, opts.defaultCurrency ?? 'USD');
  const notes = pick(rec, DEAL_NOTES_ALIASES)?.trim() || undefined;
  const expectedClose = parseDate(pick(rec, DEAL_CLOSE_ALIASES)) ?? null;

  const explicit = pick(rec, DEAL_CONTACT_ALIASES)?.trim();
  const ref = explicit ? handleFromString(explicit) : contactRef;

  return { title, contactRef: ref, stage, amount, currency, notes, expectedClose };
}

export function extractTask(rec: RawRecord, contactRef: string | undefined, row: number, issues: ImportIssue[]): DraftTask | null {
  const taskSpecific = pick(rec, TASK_SPECIFIC_ALIASES);
  if (!taskSpecific) return null;

  const title = taskSpecific.trim();
  const priority = mapPriority(pick(rec, TASK_PRIORITY_ALIASES), row, issues);
  const due = pick(rec, TASK_DUE_ALIASES)?.trim();
  const done = mapDone(pick(rec, TASK_DONE_ALIASES));

  const explicit = pick(rec, TASK_CONTACT_ALIASES)?.trim();
  const ref = explicit ? handleFromString(explicit) : contactRef;
  const dealRef = pick(rec, TASK_DEAL_ALIASES)?.trim();

  return { title, contactRef: ref, dealRef, priority, due, done };
}