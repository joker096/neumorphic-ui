export type WalletTxType = 'topup' | 'send';

export interface WalletTransaction {
  id: string;
  type: WalletTxType;
  title: string;
  amount: number; // signed: +topup / -send
  date: number;
  status: 'pending' | 'success' | 'failed';
  token?: string;
}

export interface WalletSlice {
  transactions: WalletTransaction[];
  walletCurrency: string;
  walletEnabled: boolean;
  biometricEnabled: boolean;
  walletTransactionStart: (type: WalletTxType, amount: number, title: string, token?: string) => void;
  walletTransactionResolve: (token: string, successful: boolean) => void;
  setWalletEnabled: (v: boolean) => void;
  setBiometricEnabled: (v: boolean) => void;
}

const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const selectWalletBalance = (transactions: WalletTransaction[]): number =>
  transactions.reduce((sum, tx) => (tx.status === 'success' ? sum + tx.amount : sum), 0);

export const createWalletSlice = (set: any, get: any): WalletSlice => ({
  transactions: [],
  walletCurrency: 'USD',
  walletEnabled: true,
  biometricEnabled: true,
  walletTransactionStart: (type, amount, title, token) => {
    const amt = type === 'topup' ? Math.abs(amount) : -Math.abs(amount);
    const tx: WalletTransaction = {
      id: newId(),
      type,
      title: title || (type === 'topup' ? 'Top up' : 'Send'),
      amount: amt,
      date: Date.now(),
      status: 'pending',
      token,
    };
    set((st: any) => ({ transactions: [tx, ...st.transactions].slice(0, 100) }));
  },
  walletTransactionResolve: (token, successful) => {
    const target = get().transactions.find((tx: WalletTransaction) => tx.token === token);
    if (!target || target.status !== 'pending') return;
    set((st: any) => ({
      transactions: st.transactions.map((tx: WalletTransaction) =>
        tx.token === token ? { ...tx, status: successful ? 'success' : 'failed' } : tx,
      ),
    }));
  },
  setWalletEnabled: (v) => set({ walletEnabled: v }),
  setBiometricEnabled: (v) => set({ biometricEnabled: v }),
});
