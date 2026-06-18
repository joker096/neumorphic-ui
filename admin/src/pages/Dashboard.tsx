import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useAdminI18n } from '../lib/i18n'
import MetricCard from '../components/MetricCard'
import StatTable from '../components/StatTable'

export default function Dashboard() {
  const { t } = useAdminI18n()
  const [overview, setOverview] = useState({ onlineNow: 0, today: 0, totalUsers: 0, countries: 0 })
  const [countries, setCountries] = useState<Array<{ country: string; count: number }>>([])
  const [devices, setDevices] = useState<Array<{ name: string; count: number; percentage: number }>>([])
  const [ads, setAds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getOverview().then(setOverview).catch(() => {}),
      api.getCountries().then(r => setCountries(r.countries)).catch(() => {}),
      api.getDevices().then(r => setDevices(r.devices)).catch(() => {}),
      api.getAds().then(r => setAds(r.ads)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center text-gray-500 py-12">{t('dashboard.loading')}</div>

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold">{t('dashboard.title')}</h1>
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label={t('dashboard.onlineNow')} value={overview.onlineNow} icon="🟢" />
        <MetricCard label={t('dashboard.today')} value={overview.today} icon="📊" />
        <MetricCard label={t('dashboard.totalUsers')} value={overview.totalUsers} icon="👥" />
        <MetricCard label={t('dashboard.countries')} value={overview.countries} icon="🌍" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-400 mb-3">{t('dashboard.topCountries')}</h2>
          <StatTable columns={[{ key: 'country', label: t('dashboard.country') }, { key: 'count', label: t('dashboard.users') }]} data={countries} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-400 mb-3">{t('dashboard.deviceDistribution')}</h2>
          <div className="bg-[#1a1d24] rounded-xl p-4 space-y-3">
            {devices.map(d => (
              <div key={d.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{d.name}</span>
                  <span className="text-gray-400">{d.percentage}%</span>
                </div>
                <div className="h-1.5 bg-[#0d0f12] rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${d.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {ads.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 mb-3">{t('dashboard.recentAds')}</h2>
          <div className="grid grid-cols-4 gap-4">
            {ads.slice(0, 4).map(ad => (
              <div key={ad.id} className="bg-[#1a1d24] rounded-xl p-3">
                <div className="font-semibold text-sm truncate">{ad.title}</div>
                <div className="text-xs text-gray-500 mt-1">{ad.impressions} {t('dashboard.impressions')}</div>
                <div className="text-xs text-orange-400">
                  {ad.clicks} {t('dashboard.clicks')} ({ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0'}% {t('dashboard.ctr')})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
