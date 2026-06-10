// Stars Manager - Manage stars and rewards

export interface StarsConfig {
  balance: number;
  earned: number;
  spent: number;
}

export class StarsManager {
  private config: StarsConfig = {
    balance: 0,
    earned: 0,
    spent: 0,
  };

  purchase(amount: number): void {
    this.config.balance += amount;
    this.config.earned += amount;
  }

  spend(amount: number): boolean {
    if (this.config.balance >= amount) {
      this.config.balance -= amount;
      this.config.spent += amount;
      return true;
    }
    return false;
  }

  getStatus(): StarsConfig {
    return this.config;
  }
}

export const starsManager = new StarsManager();
