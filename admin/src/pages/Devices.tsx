import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import { useAdminI18n } from '../lib/i18n'
import { adminErrorMessage, isSessionLost } from '../lib/errorMessage'
import ErrorState from '../components/ErrorState'

export default function Devices() {
  const { t } = useAdminI18n()
  const [devices, setDevices] = useState<Array<{ name: string; count: number; percentage: number }>>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setError(null)
    api.getDevices().then(r => { setDevices(r.devices ?? []); setTotal(r.total ?? 0) })
      .catch(err => { if (!isSessionLost(err)) setError(adminErrorMessage(err) ?? '') })
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold">{t('devices.title')} ({total} {t('devices.total')})</h1>
      {error !== null && <ErrorState message={error} onRetry={load} />}
      <div className="max-w-lg space-y-4">
        {devices.map(d => (
          <div key={d.name} className="bg-[var(--bg-tertiary)] rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">{d.name}</span>
              <span className="text-gray-400 text-sm">{d.count} ({d.percentage}%)</span>
            </div>
            <div className="h-2 bg-[#0d0f12] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" style={{ width: `${d.percentage}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
