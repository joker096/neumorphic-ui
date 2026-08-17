import React, { useState } from 'react';
import { HelpCircle, BookOpen, MessageSquare, Bug, LifeBuoy, ShieldCheck, ExternalLink } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { SettingsGroup, SettingsSectionTitle, SettingsRow } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { toast } from '../ui/Toast';
import { EmptyState } from '../ui/States';

interface HelpSupportSectionProps {
  isDark?: boolean;
  onBack: () => void;
}

const FAQ = [
  { q: 'How do I enable two-step verification?', a: 'Open Settings → Privacy & Security → Two-step verification.' },
  { q: 'Where are my archived chats?', a: 'Swipe down on the chat list or open the Archive folder.' },
  { q: 'How do I change the theme?', a: 'Open Settings → Appearance → Dark theme toggle.' },
  { q: 'Can I export my data?', a: 'Yes, in Settings → Backup & Export.' },
];

export const HelpSupportSection = ({ isDark = false, onBack }: HelpSupportSectionProps) => {
  const { t } = useI18n();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [ticket, setTicket] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <SubView title={t('settings.helpSupport', 'Help & Support')} isDark={isDark} onBack={onBack}>
      <SettingsSectionTitle title={t('settings.quickHelp', 'Quick help')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsRow
          icon={<BookOpen size={16} />}
          iconBg={isDark ? "bg-emerald-500/10" : "bg-emerald-100"}
          iconColor={isDark ? "text-emerald-400" : "text-emerald-600"}
          title={t('settings.userGuide', 'User guide')}
          subtitle={t('settings.userGuideSub', 'Getting started')}
          isDark={isDark}
          onClick={() => toast(t('settings.opening', 'Opening guide…'), 'info')}
        />
        <SettingsRow
          icon={<ShieldCheck size={16} />}
          iconBg={isDark ? "bg-blue-500/10" : "bg-blue-100"}
          iconColor={isDark ? "text-blue-400" : "text-blue-600"}
          title={t('settings.safetyTips', 'Safety tips')}
          subtitle={t('settings.safetyTipsSub', 'Protect your account')}
          isDark={isDark}
          onClick={() => toast(t('settings.opening', 'Opening…'), 'info')}
        />
        <SettingsRow
          icon={<ExternalLink size={16} />}
          iconBg={isDark ? "bg-purple-500/10" : "bg-purple-100"}
          iconColor={isDark ? "text-purple-400" : "text-purple-600"}
          title={t('settings.statusPage', 'Service status')}
          subtitle={t('settings.statusSub', 'All systems operational')}
          isDark={isDark}
          onClick={() => toast(t('settings.allGood', 'All systems operational'), 'success')}
        />
      </SettingsGroup>

      <SettingsSectionTitle title={t('settings.faq', 'FAQ')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        {FAQ.map((item, i) => (
          <div key={i}>
            {i > 0 && <div className={`border-t ${isDark ? "border-[var(--border-color)]" : "border-[var(--border-color)]"}`} />}
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors active:scale-[0.99] ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}
            >
              <span className={`text-sm font-medium ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{item.q}</span>
              <HelpCircle size={16} className={`shrink-0 ${openFaq === i ? "text-[var(--accent)]" : (isDark ? "text-gray-500" : "text-slate-400")}`} />
            </button>
            {openFaq === i && (
              <div className={`px-4 pb-4 text-sm ${isDark ? "text-gray-400" : "text-slate-500"}`}>{item.a}</div>
            )}
          </div>
        ))}
      </SettingsGroup>

      <SettingsSectionTitle title={t('settings.contactUs', 'Contact us')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <div className="p-4">
          <textarea
            value={ticket}
            onChange={e => setTicket(e.target.value)}
            placeholder={t('settings.describeIssue', 'Describe your issue…')}
            rows={3}
            className={`w-full rounded-lg px-3 py-2 text-sm bg-[var(--input-bg)] text-[var(--input-text)] border border-[var(--border-color)] resize-none`}
          />
          <button
            disabled={!ticket.trim() || sent}
            onClick={() => { setSent(true); toast(t('settings.ticketSent', 'Request sent'), 'success'); }}
            className={`mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium min-h-[44px] transition-colors active:scale-[0.99] ${ticket.trim() && !sent ? "bg-[var(--accent)] text-[var(--button-primary-text)]" : "bg-[var(--bg-tertiary)] text-gray-400 cursor-not-allowed"}`}
          >
            <MessageSquare size={16} /> {sent ? t('settings.ticketThanks', 'We’ll be in touch') : t('settings.sendRequest', 'Send request')}
          </button>
        </div>
      </SettingsGroup>

      {sent && (
        <EmptyState
          isDark={isDark}
          icon={<LifeBuoy size={28} />}
          title={t('settings.thanksTitle', 'Thanks for reaching out')}
          description={t('settings.thanksDesc', 'Our team usually replies within 24 hours.')}
        />
      )}

      <button
        onClick={() => toast(t('settings.reportSent', 'Bug report sent'), 'success')}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-colors active:scale-[0.99] ${isDark ? "bg-white/5 text-rose-300 hover:bg-white/10" : "bg-rose-50 text-rose-500 hover:bg-rose-100"}`}
      >
        <Bug size={16} /> {t('settings.reportBug', 'Report a bug')}
      </button>
    </SubView>
  );
};
