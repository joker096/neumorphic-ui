/** ISO date (YYYY-MM-DD, UTC) n days before today — stable within a session */
export const isoDaysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
