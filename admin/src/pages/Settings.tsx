import { useState } from 'react'
import { useAdminI18n } from '../lib/i18n'

export default function Settings() {
  const { t } = useAdminI18n()
  const [message, setMessage] = useState('')

  const handleReset2FA = () => {
    if (confirm(t('settings.confirmReset2fa'))) {
      setMessage(t('settings.reset2faMessage'))
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-lg font-bold">{t('settings.title')}</h1>
      <div className="bg-[#1a1d24] rounded-xl p-4 space-y-3">
        <h2 className="font-semibold text-sm">{t('settings.security')}</h2>
        <button onClick={handleReset2FA}
          className="px-4 py-2 rounded-lg bg-orange-500/10 text-orange-400 text-sm hover:bg-orange-500/20 transition-colors">
          {t('settings.reset2fa')}
        </button>
      </div>
      {message && <div className="bg-blue-500/10 text-blue-400 rounded-xl p-3 text-sm">{message}</div>}
    </div>
  )
}
