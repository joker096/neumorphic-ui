import React, { useState } from 'react';
import { CreditCard, Wallet, Plus, ArrowUpRight, ArrowDownLeft, Receipt, ShieldCheck, Smartphone } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { SettingsGroup, SettingsSectionTitle, SettingsRow, SettingsToggleRow } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { toast } from '../ui/Toast';

interface PaymentsSectionProps {
  isDark?: boolean;
  onBack: () => void;
}

const TRANSACTIONS = [
  { id: 1, title: 'Coffee Shop', amount: -4.5, date: '2026-08-12', icon: <Wallet size={16} /> },
  { id: 2, title: 'Refund · Marketplace', amount: 12.0, date: '2026-08-10', icon: <ArrowDownLeft size={16} /> },
  { id: 3, title: 'Transfer to Mom', amount: -20.0, date: '2026-08-08', icon: <ArrowUpRight size={16} /> },
];

export const PaymentsSection = ({ isDark = false, onBack }: PaymentsSectionProps) => {
  const { t } = useI18n();
  const [enabled, setEnabled] = useState(true);
  const [biometric, setBiometric] = useState(true);
  const [balance] = useState(128.4);

  return (
    <SubView title={t('settings.payments', 'Payments & Billing')} isDark={isDark} onBack={onBack}>
      <SettingsSectionTitle title={t('settings.wallet', 'Wallet')} isDark={isDark} />
      <div className={`rounded-2xl p-5 mb-2 ${isDark ? "bg-gradient-to-br from-[var(--accent)]/20 to-transparent border border-[var(--border-color)]" : "bg-gradient-to-br from-[var(--accent)]/10 to-transparent border border-[var(--accent)]/20"}`}>
        <div className={`text-[11px] uppercase tracking-widest font-bold opacity-60 ${isDark ? "text-[var(--text-primary)]" : "text-slate-700"}`}>{t('settings.balance', 'Balance')}</div>
        <div className={`text-3xl font-bold mt-1 ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>${balance.toFixed(2)}</div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => toast(t('settings.topUp', 'Top up started'), 'success')} className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg min-h-[40px] bg-[var(--accent)] text-[var(--button-primary-text)] active:scale-95 transition-transform">
            <Plus size={15} /> {t('settings.topUpBtn', 'Top up')}
          </button>
          <button onClick={() => toast(t('settings.sendStarted', 'Send started'), 'info')} className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg min-h-[40px] transition-colors active:scale-95 ${isDark ? "bg-white/10 text-[var(--text-primary)]" : "bg-slate-800 text-white"}`}>
            <ArrowUpRight size={15} /> {t('settings.sendBtn', 'Send')}
          </button>
        </div>
      </div>

      <SettingsSectionTitle title={t('settings.paymentSettings', 'Settings')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsToggleRow
          icon={<CreditCard size={16} />}
          iconBg={isDark ? "bg-emerald-500/10" : "bg-emerald-100"}
          iconColor={isDark ? "text-emerald-400" : "text-emerald-600"}
          title={t('settings.paymentsEnabled', 'Payments')}
          subtitle={t('settings.paymentsEnabledSub', 'Send and receive money')}
          isOn={enabled}
          isDark={isDark}
          onToggle={() => { setEnabled(v => !v); toast(t('settings.saved', 'Saved'), 'success'); }}
        />
        <SettingsToggleRow
          icon={<Smartphone size={16} />}
          iconBg={isDark ? "bg-blue-500/10" : "bg-blue-100"}
          iconColor={isDark ? "text-blue-400" : "text-blue-600"}
          title={t('settings.biometricPay', 'Biometric confirmation')}
          subtitle={t('settings.biometricPaySub', 'Require Face ID / fingerprint')}
          isOn={biometric}
          isDark={isDark}
          onToggle={() => setBiometric(v => !v)}
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

      <SettingsSectionTitle title={t('settings.recentTransactions', 'Recent transactions')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        {TRANSACTIONS.map((tx, i) => (
          <div key={tx.id}>
            {i > 0 && <div className={`border-t ${isDark ? "border-[var(--border-color)]" : "border-[var(--border-color)]"}`} />}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-white/5" : "bg-slate-100"} ${tx.amount >= 0 ? "text-emerald-400" : (isDark ? "text-gray-300" : "text-slate-600")}`}>
                {tx.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{tx.title}</div>
                <div className={`text-[11px] ${isDark ? "text-gray-500" : "text-slate-400"}`}>{tx.date}</div>
              </div>
              <span className={`text-sm font-semibold ${tx.amount >= 0 ? "text-emerald-400" : (isDark ? "text-[var(--text-primary)]" : "text-slate-800")}`}>
                {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
        <button
          onClick={() => toast(t('settings.receiptOpen', 'Opening receipts…'), 'info')}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors active:scale-[0.99] ${isDark ? "text-[var(--accent)] hover:bg-white/5" : "text-[var(--accent)] hover:bg-black/5"}`}
        >
          <Receipt size={16} /> {t('settings.viewAllReceipts', 'View all receipts')}
        </button>
      </SettingsGroup>
    </SubView>
  );
};
