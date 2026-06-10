// Account Manager - Manage multiple user accounts

export interface Account {
  id: string;
  userId: string;
  name: string;
  publicKey: string;
  avatar?: string;
  lastActive?: number;
}

export class AccountManager {
  private accounts: Map<string, Account> = new Map();

  createAccount(userId: string, name: string, publicKey: string): { id: string } {
    const id = crypto.randomUUID();

    this.accounts.set(id, {
      id,
      userId,
      name,
      publicKey,
      lastActive: Date.now(),
    });

    return { id };
  }

  addAccount(account: Omit<Account, 'id'>): { id: string } {
    const id = crypto.randomUUID();

    this.accounts.set(id, {
      id,
      ...account,
      lastActive: Date.now(),
    });

    return { id };
  }

  switchAccount(accountId: string): boolean {
    const account = this.accounts.get(accountId);
    if (!account) {
      return false;
    }

    account.lastActive = Date.now();
    this.accounts.set(accountId, account);

    return true;
  }

  getAccount(id: string): Account | null {
    return this.accounts.get(id) || null;
  }

  getAccounts(): Account[] {
    return Array.from(this.accounts.values());
  }

  deleteAccount(id: string): boolean {
    return this.accounts.delete(id);
  }

  updateAccount(id: string, updates: Partial<Account>): boolean {
    const account = this.accounts.get(id);
    if (!account) {
      return false;
    }

    this.accounts.set(id, { ...account, ...updates });
    return true;
  }
}

export const accountManager = new AccountManager();
