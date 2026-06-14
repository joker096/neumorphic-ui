import { useState, useEffect } from 'react'
import { useI18n } from '../../lib/i18n'

const API_BASE = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:8766'

interface AdData {
  id: number
  title: string
  image_url: string
  target_url: string
}

export function AdBanner() {
  const { t } = useI18n()
  const [ad, setAd] = useState<AdData | null>(null)
  const [impressionSent, setImpressionSent] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/api/ads/active`)
      .then(r => r.json())
      .then(data => {
        if (data.ad) setAd(data.ad)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (ad && !impressionSent) {
      setImpressionSent(true)
      fetch(`${API_BASE}/api/ads/${ad.id}/impression`, { method: 'POST' }).catch(() => {})
    }
  }, [ad, impressionSent])

  if (!ad) return null

  const handleClick = () => {
    fetch(`${API_BASE}/api/ads/${ad.id}/click`, { method: 'POST' }).catch(() => {})
    window.open(ad.target_url, '_blank')
  }

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-3 px-4 py-3 mx-2 mb-2 rounded-xl
        bg-gradient-to-r from-orange-500/10 to-amber-500/5
        border border-orange-500/20 cursor-pointer
        hover:from-orange-500/15 hover:to-amber-500/10
        transition-all duration-200 active:scale-[0.99]"
    >
      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-orange-500/20 flex items-center justify-center">
        {ad.image_url ? (
          <img src={ad.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg">📢</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-orange-700 dark:text-orange-300 truncate">
          {ad.title}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-orange-500/60">
          {t('common.sponsored')}
        </div>
      </div>
      <div className="text-[10px] font-bold px-2 py-0.5 rounded
        bg-orange-500/15 text-orange-600 dark:text-orange-400">
        {t('common.ad')}
      </div>
    </div>
  )
}
