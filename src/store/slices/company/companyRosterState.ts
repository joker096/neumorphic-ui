import type { CompanyRosterSync } from '../../../lib/company/relayRoster';

// Active serverless roster/presence sync connection (one per store instance).
let activeRoster: CompanyRosterSync | null = null;

/** The live roster sync, or null before `joinCompanyChannel` / after leaving. */
export const getActiveRoster = (): CompanyRosterSync | null => activeRoster;

/** Replace the live roster sync, stopping the previous connection first. */
export const replaceActiveRoster = (next: CompanyRosterSync | null): void => {
  activeRoster?.stop();
  activeRoster = next;
};

/** Stop and forget the live roster sync (`leaveCompanyChannel`). */
export const stopActiveRoster = (): void => {
  activeRoster?.stop();
  activeRoster = null;
};