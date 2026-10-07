import { useState } from 'react';
import { CreditCard, Plus, ArrowUpRight, ArrowDownLeft, ShieldCheck, Smartphone, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { SettingsGroup, SettingsSectionTitle, SettingsToggleRow, SettingsRow } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { toast } from '../ui/Toast';
import { PaymentRequestCard } from '../payments/PaymentRequestCard';
import { ChatPickerModal } from '../payments/ChatPickerModal';
import { createPaymentRequest, buildPaymentMessage } from '../../services/paymento';
import { generateOrderId, buildGatewayUrl } from '../../config/paymento';
import { isPaymentSuccessful } from '../../types/paymento';
import { useAppStore, selectWalletBalance } from '../../store';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dateTime';
interface PaymentsSectionProps {
  isDark?: boolean;
  onBack: () => void;
}

interface WalletPayload {
  token: string;
  paymentUrl: string;
  amount: string;
  currency: string;
  description: string;
}

type WalletMode = 'topup' | 'send';

const STATUS_ICON = {
  pending: <Clock size={14} />,
  success: <CheckCircle2 size={14} />,
  failed: <XCircle size={14} />,
};

export const PaymentsSection = ({ isDark = false, onBack }: PaymentsSectionProps) => {
  const { t, lang } = useI18n();
  const transactions = useAppStore((s) => s.transactions);
  const walletCurrency = useAppStore((s) => s.walletCurrency);
  const walletEnabled = useAppStore((s) => s.walletEnabled);
  const biometricEnabled = useAppStore((s) => s.biometricEnabled);
  const setWalletEnabled = useAppStore((s) => s.setWalletEnabled);
  const setBiometricEnabled = useAppStore((s) => s.setBiometricEnabled);

  const [mode, setMode] = useState<WalletMode | null>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(walletCurrency);
  const [creating, setCreating] = useState(false);
  const [active, setActive] = useState<WalletPayload | null>(null);
  const [activeMode, setActiveMode] = useState<WalletMode | null>(null);
  const [picker, setPicker] = useState<WalletPayload | null>(null);

  const balance = selectWalletBalance(transactions);

  const openForm = (m: WalletMode) => {
    if (!walletEnabled) {
      toast(t('wallet.disabled', 'Payments are disabled'), 'error');
      return;
    }
    setMode(m);
    setActive(null);
    setAmount('');
  };

  const handleCreate = async () => {
    if (!mode) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast(t('wallet.invalidAmount', 'Enter a valid amount'), 'error');
      return;
    }
    setCreating(true);
    try {
      const res = await createPaymentRequest({
        amount: amt,
        currency,
        orderId: generateOrderId(),
        description: mode === 'topup' ? t('wallet.topUp', 'Top up') : t('wallet.send', 'Send'),
      });
      const payload: WalletPayload = {
        token: res.token,
        paymentUrl: res.paymentUrl || buildGatewayUrl(res.token),
        amount: String(amt),
        currency,
        description: mode === 'topup' ? t('wallet.topUp', 'Top up') : t('wallet.send', 'Send'),
      };
      useAppStore.getState().walletTransactionStart(
        mode,
        amt,
        mode === 'topup' ? t('wallet.topUp', 'Top up') : t('wallet.send', 'Send'),
        payload.token,
      );
      setActive(payload);
      setActiveMode(mode);
      setCreating(false);
      setMode(null);
    } catch (e: any) {
      toast(e?.message || 'Failed', 'error');
      setCreating(false);
    }
  };

  const handleStatus = (status: number) => {
    if (!active) return;
    const successful = isPaymentSuccessful(status);
    useAppStore.getState().walletTransactionResolve(active.token, successful);
    if (successful) {
      toast(active.description === t('wallet.topUp', 'Top up') ? t('wallet.topUpDone', 'Top-up completed') : t('wallet.sendDone', 'Transfer completed'), 'success');
    }
  };

  const handleSendToChat = () => {
    if (!active) return;
    setPicker(active);
  };

  const handlePickChat = (chat: any) => {
    if (!picker) return;
    const msg = buildPaymentMessage(picker);
    useAppStore.getState().forwardMessage(msg, String(chat.id));
    toast(t('wallet.sentToChat', 'Payment sent to chat'), 'success');
    setPicker(null);
  };

  const txIcon = (type: WalletMode) =>
    type === 'topup' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />;

  return (
    <SubView title={t('settings.payments', 'Payments & Billing')} isDark={isDark} onBack={onBack}>
      <SettingsSectionTitle title={t('wallet.title', 'Wallet')} isDark={isDark} />
      <div className={`rounded-2xl p-5 mb-2 ${isDark ? "bg-gradient-to-br from-[var(--accent)]/20 to-transparent border border-[var(--border-color)]" : "bg-gradient-to-br from-[var(--accent)]/10 to-transparent border border-[var(--accent)]/20"}`}>
        <div className="text-xs uppercase tracking-widest font-bold opacity-60 text-[var(--text-secondary)]">{t('wallet.balance', 'Balance')}</div>
        <div className="text-[32px] font-bold mt-1 text-[var(--text-primary)]">{formatCurrency(balance, walletCurrency, lang, 2)}</div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => openForm('topup')} aria-label={t('wallet.topUp', 'Top up')} title={t('wallet.topUp', 'Top up')} className="min-h-11 px-3 flex-1 flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] text-[var(--button-primary-text)] active:scale-95 transition-transform">
            <Plus size={16} />
            <span className="text-sm font-medium">{t('wallet.topUp', 'Top up')}</span>
          </button>
          <button onClick={() => openForm('send')} aria-label={t('wallet.send', 'Send')} title={t('wallet.send', 'Send')} className={`min-h-11 px-3 flex-1 flex items-center justify-center gap-2 rounded-lg transition-colors active:scale-95 ${isDark ? "bg-white/10 text-[var(--text-primary)]" : "bg-slate-800 text-white"}`}>
            <ArrowUpRight size={16} />
            <span className="text-sm font-medium">{t('wallet.send', 'Send')}</span>
          </button>
        </div>
      </div>

      {(mode || active) && (
        <div className="rounded-2xl p-4 mb-2 border bg-white/5 border-[var(--border-color)]">
          {!active ? (
            <>
              <div className="text-sm font-medium mb-2 text-[var(--text-primary)]">
                {mode === 'topup' ? t('wallet.topUp', 'Top up') : t('wallet.send', 'Send')}
              </div>
              <div className="flex gap-2 mb-2">
                <input
                  aria-label={t('payments.amount', 'Amount')}
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={`flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none border ${isDark ? 'bg-white/5 border-[var(--border-color)] text-[var(--text-primary)]' : 'bg-white border-[var(--border-color)] text-[var(--text-primary)]'}`}
                />
                <input
                  aria-label={t('payments.currency', 'Currency')}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  maxLength={6}
                  className={`w-24 rounded-lg px-3 py-2 text-sm outline-none border ${isDark ? 'bg-white/5 border-[var(--border-color)] text-[var(--text-primary)]' : 'bg-white border-[var(--border-color)] text-[var(--text-primary)]'}`}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  data-testid="wallet-submit"
                  aria-label={mode === 'topup' ? t('wallet.topUp', 'Top up') : t('wallet.send', 'Send')}
                  title={mode === 'topup' ? t('wallet.topUp', 'Top up') : t('wallet.send', 'Send')}
                  className="flex-1 flex items-center justify-center text-sm font-medium px-3 py-2 rounded-lg bg-[var(--accent)] text-[var(--button-primary-text)] active:scale-[0.99] transition-transform disabled:opacity-50"
                >
                  {creating ? <Loader2 size={16} className="animate-spin" /> : mode === 'topup' ? <Plus size={16} /> : <ArrowUpRight size={16} />}
                  <span className="ml-1">{mode === 'topup' ? t('wallet.topUp', 'Top up') : t('wallet.send', 'Send')}</span>
                </button>
                <button
                  onClick={() => setMode(null)}
                  aria-label={t('common.close', 'Close')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium active:scale-[0.99] transition-transform ${isDark ? 'bg-white/10 text-[var(--text-primary)]' : 'bg-black/5 text-[var(--text-secondary)]'}`}
                >
                  {t('common.cancel', 'Cancel')}
                </button>
              </div>
            </>
          ) : (
            <>
              <PaymentRequestCard
                token={active.token}
                amount={active.amount}
                currency={active.currency}
                description={active.description}
                isDark={isDark}
                onStatus={handleStatus}
                onSendToChat={activeMode === 'send' ? handleSendToChat : undefined}
              />
            </>
          )}
        </div>
      )}

      <SettingsSectionTitle title={t('settings.paymentSettings', 'Settings')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsToggleRow
          icon={<CreditCard size={16} />}
          iconBg={isDark ? "bg-emerald-500/10" : "bg-emerald-100"}
          iconColor={isDark ? "text-emerald-400" : "text-emerald-600"}
          title={t('settings.paymentsEnabled', 'Payments')}
          subtitle={t('settings.paymentsEnabledSub', 'Send and receive money')}
          isOn={walletEnabled}
          isDark={isDark}
          onToggle={() => { setWalletEnabled(!walletEnabled); toast(t('settings.saved', 'Saved'), 'success'); }}
        />
        <SettingsToggleRow
          icon={<Smartphone size={16} />}
          iconBg="t-accent-bg"
          iconColor="t-accent"
          title={t('settings.biometricPay', 'Biometric confirmation')}
          subtitle={t('settings.biometricPaySub', 'Require Face ID / fingerprint')}
          isOn={biometricEnabled}
          isDark={isDark}
          onToggle={() => setBiometricEnabled(!biometricEnabled)}
        />
        <SettingsRow
          icon={<ShieldCheck size={16} />}
          iconBg={isDark ? "bg-purple-500/10" : "bg-purple-100"}
          iconColor={isDark ? "text-purple-400" : "text-purple-600"}
          title={t('settings.paymentSecurity', 'Security')}
          subtitle={t('settings.paymentSecuritySub', 'Encrypted & tokenized')}
          isDark={isDark}
        />
      </SettingsGroup>

      <SettingsSectionTitle title={t('wallet.transactions', 'Transactions')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        {transactions.length === 0 && (
          <div className={`px-4 py-6 text-center text-sm ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)]'}`}>
            {t('wallet.empty', 'No transactions yet')}
          </div>
        )}
        {transactions.map((tx, i) => (
          <div key={tx.id}>
            {i > 0 && <div className="border-t border-[var(--border-color)]" />}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-white/5" : "bg-black/5"} ${tx.amount >= 0 ? "text-emerald-400" : "text-[var(--text-secondary)]"}`}>
                {txIcon(tx.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--text-primary)]">{tx.title}</div>
                <div className={`text-xs flex items-center gap-1 ${tx.status === 'failed' ? 'text-red-500' : (isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)]')}`}>
                  {STATUS_ICON[tx.status]}
                  {tx.status === 'pending' ? t('wallet.pending', 'Pending') : tx.status === 'failed' ? t('wallet.failed', 'Payment failed') : formatDate(tx.date, lang)}
                </div>
              </div>
              <span className={`text-sm font-semibold ${tx.amount >= 0 ? "text-emerald-400" : "text-[var(--text-primary)]"}`}>
                {tx.amount >= 0 ? '+' : '-'}{formatCurrency(Math.abs(tx.amount), walletCurrency, lang, 2)}
              </span>
            </div>
          </div>
        ))}
      </SettingsGroup>

      <ChatPickerModal
        open={picker !== null}
        onClose={() => setPicker(null)}
        onPick={handlePickChat}
        title={t('wallet.payToChat', 'Send payment to chat')}
      />
    </SubView>
  );
};
