import React, { useRef, useState } from 'react';
import { HelpCircle, BookOpen, MessageSquare, Bug, LifeBuoy, ShieldCheck, ExternalLink, ChevronDown } from 'lucide-react';
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
  {
    q: 'faqQ1', qFallback: 'How do I enable two-step verification?',
    a: 'faqA1', aFallback: 'Open Settings → Privacy & Security → Two-step verification, then follow the setup.',
  },
  {
    q: 'faqQ2', qFallback: 'Where are my archived chats?',
    a: 'faqA2', aFallback: 'Open the Archive folder from the chat list, or swipe down on the chat list to reveal it.',
  },
  {
    q: 'faqQ3', qFallback: 'How do I change the theme?',
    a: 'faqA3', aFallback: 'Open Settings → Appearance and toggle Dark theme, or pick a different accent color.',
  },
  {
    q: 'faqQ4', qFallback: 'Can I export my data?',
    a: 'faqA4', aFallback: 'Yes. Go to Settings → Backup & Export to download your data as an encrypted file.',
  },
];

const CATEGORIES = [
  { value: 'general', labelKey: 'contactCategoryGeneral', fallback: 'General question' },
  { value: 'bug', labelKey: 'contactCategoryBug', fallback: 'Bug report' },
  { value: 'account', labelKey: 'contactCategoryAccount', fallback: 'Account & login' },
  { value: 'billing', labelKey: 'contactCategoryBilling', fallback: 'Billing' },
  { value: 'suggest', labelKey: 'contactCategorySuggest', fallback: 'Suggestion' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const HelpSupportSection = ({ isDark = false, onBack }: HelpSupportSectionProps) => {
  const { t } = useI18n();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const emailValid = EMAIL_RE.test(email.trim());
  const messageValid = message.trim().length > 0;
  const canSubmit = emailValid && messageValid;

  const submit = () => {
    if (!emailValid) {
      setError(t('contactInvalidEmail', 'Please enter a valid email address.'));
      return;
    }
    if (!messageValid) {
      setError(t('contactRequired', 'Please enter your email and a message.'));
      return;
    }
    setError(null);
    setSent(true);
    toast(t('ticketSent', 'Request sent'), 'success');
  };

  const reportBug = () => {
    setCategory('bug');
    setSent(false);
    setError(null);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => messageRef.current?.focus(), 350);
    });
  };

  const resetForm = () => {
    setSent(false);
    setEmail('');
    setMessage('');
    setCategory('general');
    setError(null);
  };

  return (
    <SubView title={t('helpSupport', 'Help & Support')} isDark={isDark} onBack={onBack}>
      <SettingsSectionTitle title={t('quickHelp', 'Quick help')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsRow
          icon={<BookOpen size={16} />}
          iconBg={isDark ? "bg-emerald-500/10" : "bg-emerald-100"}
          iconColor={isDark ? "text-emerald-400" : "text-emerald-600"}
          title={t('userGuide', 'User guide')}
          subtitle={t('userGuideSub', 'Getting started')}
          isDark={isDark}
          onClick={() => toast(t('opening', 'Opening guide…'), 'info')}
        />
        <SettingsRow
          icon={<ShieldCheck size={16} />}
          iconBg="t-accent-bg"
          iconColor="t-accent"
          title={t('safetyTips', 'Safety tips')}
          subtitle={t('safetyTipsSub', 'Protect your account')}
          isDark={isDark}
          onClick={() => toast(t('opening', 'Opening…'), 'info')}
        />
        <SettingsRow
          icon={<ExternalLink size={16} />}
          iconBg={isDark ? "bg-purple-500/10" : "bg-purple-100"}
          iconColor={isDark ? "text-purple-400" : "text-purple-600"}
          title={t('statusPage', 'Service status')}
          subtitle={t('statusSub', 'All systems operational')}
          isDark={isDark}
          rightElement={
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
              {t('allGood', 'Operational')}
            </span>
          }
        />
      </SettingsGroup>

      <SettingsSectionTitle title={t('faq', 'FAQ')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        {FAQ.map((item, i) => (
          <div key={i}>
            {i > 0 && <div className="border-t border-[var(--border-color)]" />}
            <button
              type="button"
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              aria-expanded={openFaq === i}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors active:scale-[0.99] ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}
            >
              <span className={`text-sm font-medium ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t(item.q, item.qFallback)}</span>
              <HelpCircle size={16} className={`shrink-0 transition-colors ${openFaq === i ? "text-[var(--accent)]" : (isDark ? "text-gray-500" : "text-slate-400")}`} aria-hidden="true" />
            </button>
            {openFaq === i && (
              <div className={`px-4 pb-4 text-sm leading-relaxed ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t(item.a, item.aFallback)}</div>
            )}
          </div>
        ))}
      </SettingsGroup>

      <SettingsSectionTitle title={t('contactUs', 'Contact us')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <div ref={formRef} className="p-4 flex flex-col gap-3">
          {sent ? (
            <EmptyState
              isDark={isDark}
              icon={<LifeBuoy size={28} />}
              title={t('thanksTitle', 'Thanks for reaching out')}
              description={t('thanksDesc', 'Our team usually replies within 24 hours.')}
              action={{ label: t('sendAnother', 'Send another'), onClick: resetForm }}
            />
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <label className={`text-xs font-medium ${isDark ? "text-[var(--text-primary)]" : "text-slate-700"}`} htmlFor="help-email">{t('contactEmailLabel', 'Email')}</label>
                <input
                  id="help-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (error) setError(null); }}
                  placeholder={t('contactEmailPlaceholder', 'you@example.com')}
                  className={`w-full rounded-lg px-3 py-2 text-sm bg-[var(--input-bg)] text-[var(--input-text)] border outline-none focus:ring-2 focus:ring-[var(--accent)]/40 ${error && !emailValid ? "border-rose-500" : "border-[var(--border-color)]"}`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={`text-xs font-medium ${isDark ? "text-[var(--text-primary)]" : "text-slate-700"}`} htmlFor="help-category">{t('contactCategory', 'Category')}</label>
                <div className="relative">
                  <select
                    id="help-category"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full appearance-none rounded-lg px-3 py-2 pr-9 text-sm bg-[var(--input-bg)] text-[var(--input-text)] border border-[var(--border-color)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{t(c.labelKey, c.fallback)}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? "text-gray-400" : "text-slate-400"}`} aria-hidden="true" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={`text-xs font-medium ${isDark ? "text-[var(--text-primary)]" : "text-slate-700"}`} htmlFor="help-message">{t('describeIssue', 'Describe your issue…')}</label>
                <textarea
                  id="help-message"
                  ref={messageRef}
                  value={message}
                  onChange={e => { setMessage(e.target.value); if (error) setError(null); }}
                  rows={4}
                  placeholder={t('describeIssue', 'Describe your issue…')}
                  className={`w-full rounded-lg px-3 py-2 text-sm bg-[var(--input-bg)] text-[var(--input-text)] border resize-none outline-none focus:ring-2 focus:ring-[var(--accent)]/40 ${error && !messageValid ? "border-rose-500" : "border-[var(--border-color)]"}`}
                />
              </div>

              {error && <div className="text-xs text-rose-500" role="alert">{error}</div>}

              <button
                type="button"
                disabled={!canSubmit}
                onClick={submit}
                className={`mt-1 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium min-h-[44px] transition-colors active:scale-[0.99] ${canSubmit ? "bg-[var(--accent)] text-[var(--button-primary-text)]" : "bg-[var(--bg-tertiary)] text-gray-400 cursor-not-allowed"}`}
              >
                <MessageSquare size={16} aria-hidden="true" /> {t('sendRequest', 'Send request')}
              </button>
            </>
          )}
        </div>
      </SettingsGroup>

      <button
        type="button"
        onClick={reportBug}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-colors active:scale-[0.99] ${isDark ? "bg-white/5 text-rose-300 hover:bg-white/10" : "bg-rose-50 text-rose-500 hover:bg-rose-100"}`}
      >
        <Bug size={16} aria-hidden="true" /> {t('reportBug', 'Report a bug')}
      </button>
    </SubView>
  );
};
