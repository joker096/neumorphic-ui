const sessions = new Map<string, { debugId?: string; createdAt: number }>();

export function registerRiskSession(contactId: string, debugId?: string) {
  if (!debugId) return;
  const existing = sessions.get(contactId);
  if (existing && existing.debugId === debugId) {
    throw new Error('duplicate_debug_session');
  }
  sessions.set(contactId, { debugId, createdAt: Date.now() });
}

export function getLastActionDebugId(contactId: string): string | undefined {
  const session = sessions.get(contactId);
  return session?.debugId;
}