/**
 * App lock authentication backoff configuration
 */
export const LOCK_BACKOFF: Record<number, number> = {
  0: 0,
  1: 0,
  2: 0,
  3: 30_000,
  4: 60_000,
  5: 120_000,
  6: 300_000,
  7: 900_000,
  8: Infinity,
};

export const getLockBlockDuration = (attempts: number): number => {
  return LOCK_BACKOFF[attempts] ?? Infinity;
};
