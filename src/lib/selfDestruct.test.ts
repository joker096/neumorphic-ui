import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  applyDefaultSelfDestruct,
  isSelfDestructExpired,
  mergeExpiredMedia,
  nextSelfDestructDeadline,
  nextSelfDestructDeadlineInLists,
  purgeExpiredHistory,
  purgeExpiredLists,
  purgeExpiredSaved,
  resolveInboundSelfDestruct,
  wireSelfDestructTtl,
  EXPIRED_QUOTE_TYPE,
  SELF_DESTRUCT_WIRE_MAX_MS,
  SELF_DESTRUCT_WIRE_MIN_MS,
} from './selfDestruct';
import { FTR_MAGIC } from './fileTransfer/frames';
import { SELF_DESTRUCT_MS } from '../constants/time';

const NOW = 1_000_000;

describe('selfDestruct helpers', () => {
  it('treats only messages with a reached deadline as expired', () => {
    expect(isSelfDestructExpired({ selfDestructAt: NOW - 1 }, NOW)).toBe(true);
    expect(isSelfDestructExpired({ selfDestructAt: NOW }, NOW)).toBe(true);
    expect(isSelfDestructExpired({ selfDestructAt: NOW + 1 }, NOW)).toBe(false);
    expect(isSelfDestructExpired({}, NOW)).toBe(false);
    expect(isSelfDestructExpired({ selfDestructAt: 'soon' as any }, NOW)).toBe(false);
    expect(isSelfDestructExpired(null, NOW)).toBe(false);
  });

  it('returns the earliest pending deadline and reports overdue ones', () => {
    const history = [{ selfDestructAt: NOW + 500 }, {}, { selfDestructAt: NOW + 100 }];
    expect(nextSelfDestructDeadline(history, NOW)).toBe(NOW + 100);
    expect(nextSelfDestructDeadline([{ selfDestructAt: NOW - 5 }], NOW)).toBe(NOW - 5);
    expect(nextSelfDestructDeadline([{}], NOW)).toBeNull();
    expect(nextSelfDestructDeadline(undefined, NOW)).toBeNull();
  });

  it('keeps the original reference when nothing is expired', () => {
    const history = [{ id: 1 }, { id: 2, selfDestructAt: NOW + 10 }];
    const result = purgeExpiredHistory(history, NOW);
    expect(result.value).toBe(history);
    expect(result.purged).toEqual([]);
  });

  it('removes expired messages and reports voice/file media to erase', () => {
    const history = [
      { id: 'keep', text: 'hi' },
      { id: 'gone', selfDestructAt: NOW - 1, type: 'audio', voiceId: 'voice-7' },
      {
        id: 'album',
        selfDestructAt: NOW - 1,
        fileTransferId: 't-1',
        attachment: FTR_MAGIC + 't-1',
        album: [{ url: FTR_MAGIC + 't-1' }, { url: FTR_MAGIC + 't-2' }],
      },
      { id: 'also-keep' },
    ];

    const result = purgeExpiredHistory(history, NOW);

    expect(result.value!.map((m: any) => m.id)).toEqual(['keep', 'also-keep']);
    expect(result.purged.map((m: any) => m.id)).toEqual(['gone', 'album']);
    expect(result.media.voiceIds).toEqual(['voice-7']);
    expect(result.media.transferIds).toEqual(['t-1', 't-2']);
  });

  it('sweeps every chat and channel, deduplicating shared media ids', () => {
    const chats = [
      { id: 'dm-1', history: [{ id: 'a', selfDestructAt: NOW - 1, fileTransferId: 't-9' }] },
      { id: 'dm-2', history: [{ id: 'b' }] },
      {
        id: 'ch-1',
        history: [{ id: 'c', selfDestructAt: NOW - 1, type: 'audio', voiceId: 'v-1' }],
      },
    ];

    const result = purgeExpiredLists(chats, NOW);

    expect(result.value.map((c) => c.id)).toEqual(['dm-1', 'dm-2', 'ch-1']);
    expect(result.value[0].history).toEqual([]);
    expect(result.value[1].history).toEqual([{ id: 'b' }]);
    expect(result.purged.map((m: any) => m.id)).toEqual(['a', 'c']);
    expect(result.media).toEqual({ voiceIds: ['v-1'], transferIds: ['t-9'] });
  });

  it('returns the same list reference when no chat changed', () => {
    const chats = [{ id: 'dm-1', history: [{ id: 'a' }] }];
    expect(purgeExpiredLists(chats, NOW).value).toBe(chats);
  });

  it('scrubs the quoted copy of a purged message out of replies', () => {
    const history = [
      { id: 'secret', text: 'burn after reading', selfDestructAt: NOW - 1 },
      { id: 'reply', text: 'ok', replyTo: { id: 'secret', sender: 'me', text: 'burn after reading' } },
      { id: 'other-reply', text: 'ok', replyTo: { id: 'other', sender: 'bob', text: 'kept' } },
    ];

    const result = purgeExpiredHistory(history, NOW);

    expect(result.value![0].replyTo).toEqual({ id: 'secret', sender: 'me', type: EXPIRED_QUOTE_TYPE });
    expect(result.value![0].replyTo.text).toBeUndefined();
    expect(result.value![1].replyTo).toEqual({ id: 'other', sender: 'bob', text: 'kept' });
  });

  it('drops saved-message entries that reference a purged message', () => {
    const saved = [{ messageId: 'a' }, { messageId: 'keep' }];
    expect(purgeExpiredSaved(saved, new Set(['a']))).toEqual([{ messageId: 'keep' }]);
    expect(purgeExpiredSaved(saved, new Set())).toBe(saved);
    expect(purgeExpiredSaved([], new Set(['a']))).toEqual([]);
  });

  it('finds the earliest deadline across chats without flattening them', () => {
    const chats = [
      { id: 'dm-1', history: [{ selfDestructAt: NOW + 900 }] },
      { id: 'dm-2' },
      { id: 'dm-3', history: [] },
      { id: 'dm-4', history: [{ selfDestructAt: NOW + 300 }] },
    ];
    expect(nextSelfDestructDeadlineInLists(chats, NOW)).toBe(NOW + 300);
    expect(nextSelfDestructDeadlineInLists([{ id: 'a', history: [{ selfDestructAt: NOW + 900 }] }, { id: 'b' }], NOW))
      .toBe(NOW + 900);
  });

  it('reports an overdue deadline ahead of any later one and stays null when nothing expires', () => {
    const chats = [
      { id: 'dm-1', history: [{ selfDestructAt: NOW - 5 }] },
      { id: 'dm-2', history: [{ selfDestructAt: NOW + 10 }] },
    ];
    expect(nextSelfDestructDeadlineInLists(chats, NOW)).toBe(NOW - 5);
    expect(nextSelfDestructDeadlineInLists([{ id: 'a', history: [{ id: 'x' }] }], NOW)).toBeNull();
    expect(nextSelfDestructDeadlineInLists([], NOW)).toBeNull();
    expect(nextSelfDestructDeadlineInLists(undefined, NOW)).toBeNull();
  });

  it('stamps the default timer on outgoing messages and leaves untimed ones alone', () => {
    const timed: any = { id: 1 };
    expect(applyDefaultSelfDestruct(timed, '5 min', NOW)).toBe(timed);
    expect(timed.selfDestructAt).toBe(NOW + SELF_DESTRUCT_MS['5 min']);

    const plain: any = { id: 2 };
    applyDefaultSelfDestruct(plain, undefined, NOW);
    expect(plain.selfDestructAt).toBeUndefined();

    const unknown: any = { id: 3 };
    applyDefaultSelfDestruct(unknown, 'not a preset', NOW);
    expect(unknown.selfDestructAt).toBeUndefined();
  });

  it('unions media buckets without duplicating ids', () => {
    const target = { voiceIds: ['v-1'], transferIds: ['t-1'] };
    const extra = { voiceIds: ['v-1', 'v-2'], transferIds: ['t-2'] };
    expect(mergeExpiredMedia(target, extra)).toBe(target);
    expect(target).toEqual({ voiceIds: ['v-1', 'v-2'], transferIds: ['t-1', 't-2'] });
  });
});

describe('selfDestruct wire TTL', () => {
  it('sends the remaining duration, never the absolute deadline', () => {
    expect(wireSelfDestructTtl(NOW + 60_000, NOW)).toBe(60_000);
    expect(wireSelfDestructTtl(undefined, NOW)).toBeUndefined();
    expect(wireSelfDestructTtl('soon', NOW)).toBeUndefined();
    expect(wireSelfDestructTtl(Number.NaN, NOW)).toBeUndefined();
  });

  it('clamps an already elapsed deadline to the floor instead of dropping the timer', () => {
    // A queued message flushed after its deadline must not become permanent on
    // the receiver, so the sender still announces a (minimal) TTL.
    expect(wireSelfDestructTtl(NOW - 10_000, NOW)).toBe(SELF_DESTRUCT_WIRE_MIN_MS);
    expect(wireSelfDestructTtl(NOW, NOW)).toBe(SELF_DESTRUCT_WIRE_MIN_MS);
    expect(wireSelfDestructTtl(NOW + 1, NOW)).toBe(SELF_DESTRUCT_WIRE_MIN_MS);
  });

  it('clamps both ends so a self-destruct message cannot become immortal', () => {
    expect(wireSelfDestructTtl(NOW + 365 * 24 * 60 * 60 * 1000, NOW)).toBe(SELF_DESTRUCT_WIRE_MAX_MS);
    expect(resolveInboundSelfDestruct(SELF_DESTRUCT_WIRE_MAX_MS * 10, NOW)).toBe(NOW + SELF_DESTRUCT_WIRE_MAX_MS);
    expect(resolveInboundSelfDestruct(0, NOW)).toBe(NOW + SELF_DESTRUCT_WIRE_MIN_MS);
    expect(resolveInboundSelfDestruct(5, NOW)).toBe(NOW + SELF_DESTRUCT_WIRE_MIN_MS);
  });

  it('turns an inbound duration into a local deadline and rejects junk', () => {
    expect(resolveInboundSelfDestruct(60_000, NOW)).toBe(NOW + 60_000);
    expect(resolveInboundSelfDestruct(undefined, NOW)).toBeUndefined();
    expect(resolveInboundSelfDestruct(null, NOW)).toBeUndefined();
    expect(resolveInboundSelfDestruct(-1, NOW)).toBeUndefined();
    expect(resolveInboundSelfDestruct(1.5, NOW)).toBeUndefined();
    expect(resolveInboundSelfDestruct('60000', NOW)).toBeUndefined();
    expect(resolveInboundSelfDestruct(Number.NaN, NOW)).toBeUndefined();
  });

  it('survives a clock skew between sender and receiver', () => {
    // Sender is 10 minutes ahead: the absolute deadline would have landed in
    // the past and destroyed the message on arrival.
    const ttl = wireSelfDestructTtl(NOW + 60_000, NOW - 600_000)!;
    const receivedAt = resolveInboundSelfDestruct(ttl, NOW)!;
    expect(receivedAt).toBeGreaterThanOrEqual(NOW + SELF_DESTRUCT_WIRE_MIN_MS);
  });
});

