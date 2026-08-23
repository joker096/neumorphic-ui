import { useEffect, useState } from 'react'
import { Webhook, AlertTriangle, CheckCircle2, Copy, KeyRound, ShieldCheck } from 'lucide-react'
import { useI18n } from '../../lib/i18n'
import { SubView } from '../ui/SubView'
import { SettingsGroup, SettingsSectionTitle, SettingsRow } from '../ui/SettingsRow'
import { toast } from '../ui/Toast'
import { getPaymentoConfig, savePaymentoConfig } from '../../lib/paymentoConfig'
import { pushPaymentoConfig } from '../../services/paymento'
import { PAYMENTO_BACKEND_BASE } from '../../config/paymento'
import type { PaymentoConfig } from '../../types/paymento'

interface StoreSettingsSectionProps {
  isDark?: boolean
  onBack: () => void
}

function useAppBaseUrl(): string {
  const fromEnv = (import.meta.env.VITE_APP_URL as string | undefined) || ''
  if (fromEnv) return fromEnv.replace(/\/+$/, '')
  if (typeof window !== 'undefined') return `${window.location.origin}`
  return ''
}

export const StoreSettingsSection = ({ isDark = false, onBack }: StoreSettingsSectionProps) => {
  const { t } = useI18n()
  const baseUrl = useAppBaseUrl()
  const suggestedIpn = `${baseUrl}${PAYMENTO_BACKEND_BASE}/ipn`

  const [config, setConfig] = useState<PaymentoConfig>({
    apiKey: '',
    secretKey: '',
    ipnUrl: '',
    returnUrl: '',
    enabled: false,
  })
  const [ipnInput, setIpnInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getPaymentoConfig().then((c) => {
      setConfig(c)
      setIpnInput(c.ipnUrl || suggestedIpn)
      setLoaded(true)
    })
  }, [suggestedIpn])

  const ipnConfigured = !!config.ipnUrl && config.ipnUrl.startsWith('https://')
  const ipnValid = ipnInput.startsWith('https://') && /^https:\/\/.+/.test(ipnInput.trim())

  const handleSave = async () => {
    if (!ipnValid) {
      toast(t('storeSettings.ipnInvalid', 'Enter a valid HTTPS URL for IPN notifications'), 'error')
      return
    }
    setSaving(true)
    try {
      const next: PaymentoConfig = {
        ...config,
        ipnUrl: ipnInput.trim(),
        enabled: !!(config.apiKey && config.secretKey),
      }
      await savePaymentoConfig(next)
      if (next.apiKey && next.secretKey) {
        await pushPaymentoConfig(next)
      }
      setConfig(next)
      toast(t('storeSettings.saved', 'Store settings saved'), 'success')
    } catch (e: any) {
      toast(e?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const copyIpn = async () => {
    await navigator.clipboard?.writeText(ipnInput)
    toast(t('storeSettings.copied', 'IPN URL copied'), 'success')
  }

  return (
    <SubView title={t('storeSettings.title', 'Store Settings')} isDark={isDark} onBack={onBack}>
      <SettingsSectionTitle title={t('storeSettings.general', 'General')} isDark={isDark} />

      {/* IPN status banner */}
      <div
        className={`rounded-2xl p-4 mb-2 border ${
          ipnConfigured
            ? isDark
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-emerald-50 border-emerald-200'
            : isDark
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-amber-50 border-amber-200'
        }`}
      >
        <div className="flex items-start gap-3">
          {ipnConfigured ? (
            <CheckCircle2 size={20} className="text-emerald-500 mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={20} className="text-amber-500 mt-0.5 shrink-0" />
          )}
          <div className="min-w-0">
            <div
              className={`text-sm font-semibold ${
                ipnConfigured ? 'text-emerald-600' : isDark ? 'text-amber-300' : 'text-amber-700'
              }`}
            >
              {ipnConfigured
                ? t('storeSettings.ipnConfiguredTitle', 'IPN URL Configured')
                : t('storeSettings.ipnNotConfiguredTitle', 'IPN URL Not Configured')}
            </div>
            <p className={`mt-1 text-xs leading-relaxed ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
              {ipnConfigured
                ? t('storeSettings.ipnConfiguredDesc', 'Your store is receiving real-time payment status updates from the Paymento gateway.')
                : t(
                    'storeSettings.ipnNotConfiguredDesc',
                    "You haven't configured your IPN URL for this store yet. The IPN (Instant Payment Notification) URL is essential for receiving real-time payment status updates from Paymento gateway.",
                  )}
            </p>
          </div>
        </div>
      </div>

      <SettingsGroup isDark={isDark}>
        <SettingsRow
          icon={<Webhook size={16} />}
          iconBg={isDark ? 'bg-sky-500/10' : 'bg-sky-100'}
          iconColor={isDark ? 'text-sky-400' : 'text-sky-600'}
          title={t('storeSettings.ipn', 'IPN URL')}
          subtitle={t('storeSettings.ipnSub', 'Instant Payment Notification endpoint')}
          isDark={isDark}
        />
        <div className="px-4 pb-4">
          <p className={`text-xs leading-relaxed mb-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            {t(
              'storeSettings.ipnHelp',
              'Enter the URL where you want to receive Instant Payment Notifications (IPN). The URL must use HTTPS protocol. IPN notifications will be sent via HTTP POST method.',
            )}
          </p>
          <div className="flex gap-2">
            <input
              value={ipnInput}
              onChange={(e) => setIpnInput(e.target.value)}
              placeholder="https://your-domain.com/ipn-endpoint"
              className={`flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none border ${
                ipnValid
                  ? isDark
                    ? 'bg-white/5 border-[var(--border-color)] text-[var(--text-primary)]'
                    : 'bg-white border-slate-300 text-slate-900'
                  : isDark
                    ? 'bg-white/5 border-red-500/40 text-[var(--text-primary)]'
                    : 'bg-white border-red-400 text-slate-900'
              }`}
            />
            <button
              onClick={copyIpn}
              className={`flex items-center justify-center px-3 rounded-lg active:scale-95 transition-transform ${
                isDark ? 'bg-white/10 text-[var(--text-primary)]' : 'bg-slate-100 text-slate-700'
              }`}
              aria-label="Copy IPN URL"
            >
              <Copy size={15} />
            </button>
          </div>
          {!ipnValid && ipnInput.length > 0 && (
            <p className="mt-1 text-xs text-red-500">
              {t('storeSettings.ipnInvalid', 'Enter a valid HTTPS URL for IPN notifications')}
            </p>
          )}
          <p className={`mt-2 text-[11px] ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
            {t('storeSettings.ipnSuggestion', 'Suggested endpoint:')} {suggestedIpn}
          </p>
        </div>
      </SettingsGroup>

      {/* API credentials */}
      <SettingsSectionTitle title={t('storeSettings.credentials', 'Paymento API Credentials')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <div className="px-4 py-3">
          <label className={`flex items-center gap-2 text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
            <KeyRound size={13} /> {t('storeSettings.apiKey', 'API Key')}
          </label>
          <input
            value={config.apiKey}
            onChange={(e) => setConfig((c) => ({ ...c, apiKey: e.target.value }))}
            placeholder="Your Paymento merchant API key"
            className={`w-full rounded-lg px-3 py-2 text-sm outline-none border ${
              isDark ? 'bg-white/5 border-[var(--border-color)] text-[var(--text-primary)]' : 'bg-white border-slate-300 text-slate-900'
            }`}
          />
        </div>
        <div className="px-4 pb-4">
          <label className={`flex items-center gap-2 text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
            <ShieldCheck size={13} /> {t('storeSettings.secret', 'Secret Key')}
          </label>
          <div className="flex gap-2">
            <input
              type={showSecret ? 'text' : 'password'}
              value={config.secretKey}
              onChange={(e) => setConfig((c) => ({ ...c, secretKey: e.target.value }))}
              placeholder="Your Paymento secret key"
              className={`flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none border ${
                isDark ? 'bg-white/5 border-[var(--border-color)] text-[var(--text-primary)]' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            <button
              onClick={() => setShowSecret((s) => !s)}
              className={`px-3 rounded-lg text-xs font-medium active:scale-95 transition-transform ${
                isDark ? 'bg-white/10 text-[var(--text-primary)]' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {showSecret ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className={`mt-1 text-[11px] ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
            {t('storeSettings.secretNote', 'Stored encrypted in secure storage. Pushed to the backend to verify IPN signatures.')}
          </p>
        </div>
        <div className="px-4 pb-4">
          <label className={`flex items-center gap-2 text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
            {t('storeSettings.returnUrl', 'Return URL (optional)')}
          </label>
          <input
            value={config.returnUrl}
            onChange={(e) => setConfig((c) => ({ ...c, returnUrl: e.target.value }))}
            placeholder="https://your-domain.com/order/complete"
            className={`w-full rounded-lg px-3 py-2 text-sm outline-none border ${
              isDark ? 'bg-white/5 border-[var(--border-color)] text-[var(--text-primary)]' : 'bg-white border-slate-300 text-slate-900'
            }`}
          />
        </div>
      </SettingsGroup>

      <button
        onClick={handleSave}
        disabled={saving || !loaded}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium bg-[var(--accent)] text-[var(--button-primary-text)] active:scale-[0.99] transition-transform disabled:opacity-50"
      >
        {saving ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
        {t('storeSettings.save', 'Save Store Settings')}
      </button>
    </SubView>
  )
}
