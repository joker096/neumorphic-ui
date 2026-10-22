import { useState } from 'react'
import { api } from '../api/client'
import { useAdminI18n } from '../lib/i18n'
import { adminErrorMessage } from '../lib/errorMessage'

export default function Settings() {
  const { t } = useAdminI18n()
  const [message, setMessage] = useState('')
  const [newSecret, setNewSecret] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleReset2FA = async () => {
    if (!confirm(t('settings.confirmReset2fa'))) return
    setBusy(true)
    setError('')
    setMessage('')
    setNewSecret('')
    try {
      const res = await api.reset2FA()
      setNewSecret(res.secret)
      setMessage(t('settings.reset2faMessage'))
    } catch (err) {
      setError(adminErrorMessage(err) ?? t('common.actionFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-lg font-bold">{t('settings.title')}</h1>
      <div className="bg-[var(--bg-tertiary)] rounded-xl p-4 space-y-3">
        <h2 className="font-semibold text-sm">{t('settings.security')}</h2>
        <button
          onClick={handleReset2FA}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-orange-500/10 text-orange-400 text-sm hover:bg-orange-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {busy ? t('settings.reset2faBusy') : t('settings.reset2fa')}
        </button>
      </div>
      {error && <div className="bg-red-500/10 text-red-400 rounded-xl p-3 text-sm">{error}</div>}
      {message && <div className="bg-blue-500/10 text-blue-400 rounded-xl p-3 text-sm">{message}</div>}
      {newSecret && (
        <div className="space-y-2">
          <div className="text-xs text-[var(--text-secondary)]">{t('settings.reset2faNewSecret')}</div>
          <code className="block bg-black/30 rounded-lg p-3 text-xs font-mono break-all select-all">
            {newSecret}
          </code>
        </div>
      )}
    </div>
  )
}
