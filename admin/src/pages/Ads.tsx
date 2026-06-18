import { useState, useEffect, FormEvent } from 'react'
import { api } from '../api/client'
import { useAdminI18n } from '../lib/i18n'

interface Ad { id: number; title: string; image_url: string; target_url: string; active: number; impressions: number; clicks: number; created_at: string; updated_at: string }

export default function Ads() {
  const { t } = useAdminI18n()
  const [ads, setAds] = useState<Ad[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)

  const loadAds = () => api.getAds().then(r => setAds(r.ads)).catch(() => {})

  useEffect(() => { loadAds() }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (editingId) await api.updateAd(editingId, { title, image_url: imageUrl, target_url: targetUrl })
    else await api.createAd({ title, image_url: imageUrl, target_url: targetUrl, active: true })
    setShowForm(false); setEditingId(null); setTitle(''); setImageUrl(''); setTargetUrl('')
    loadAds()
  }

  const toggleActive = async (ad: Ad) => { await api.updateAd(ad.id, { active: !ad.active }); loadAds() }
  const deleteAd = async (id: number) => { if (confirm(t('ads.confirmDelete'))) { await api.deleteAd(id); loadAds() } }
  const editAd = (ad: Ad) => { setTitle(ad.title); setImageUrl(ad.image_url); setTargetUrl(ad.target_url); setEditingId(ad.id); setShowForm(true) }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold">{t('ads.title')}</h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); setTitle(''); setImageUrl(''); setTargetUrl('') }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold">{t('ads.newAd')}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#1a1d24] rounded-xl p-4 space-y-3 max-w-lg">
          <input placeholder={t('ads.titleLabel')} value={title} onChange={e => setTitle(e.target.value)} required
            className="w-full bg-[#0d0f12] text-white rounded-lg px-3 py-2 text-sm border border-white/5 outline-none focus:border-orange-500/50" />
          <input placeholder={t('ads.imageUrlLabel')} value={imageUrl} onChange={e => setImageUrl(e.target.value)} required
            className="w-full bg-[#0d0f12] text-white rounded-lg px-3 py-2 text-sm border border-white/5 outline-none focus:border-orange-500/50" />
          <input placeholder={t('ads.targetUrlLabel')} value={targetUrl} onChange={e => setTargetUrl(e.target.value)} required
            className="w-full bg-[#0d0f12] text-white rounded-lg px-3 py-2 text-sm border border-white/5 outline-none focus:border-orange-500/50" />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold">{editingId ? t('ads.update') : t('ads.create')}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 text-sm">{t('ads.cancel')}</button>
          </div>
        </form>
      )}

      <div className="grid gap-3">
        {ads.map(ad => (
          <div key={ad.id} className="bg-[#1a1d24] rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0 text-lg">📢</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{ad.title}</div>
              <div className="text-xs text-gray-500 truncate">{ad.target_url}</div>
              <div className="text-xs text-gray-500 mt-1">{ad.impressions} {t('ads.impressions')} · {ad.clicks} {t('ads.clicks')} · {ad.impressions > 0 ? ` ${((ad.clicks / ad.impressions) * 100).toFixed(1)}% CTR` : ' 0% CTR'}</div>
            </div>
            <button onClick={() => toggleActive(ad)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${ad.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
              {ad.active ? t('ads.active') : t('ads.inactive')}
            </button>
            <button onClick={() => editAd(ad)} className="px-3 py-1 rounded-lg bg-white/5 text-gray-400 text-xs">{t('ads.edit')}</button>
            <button onClick={() => deleteAd(ad.id)} className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs">{t('ads.delete')}</button>
          </div>
        ))}
        {ads.length === 0 && <p className="text-center text-gray-500 py-8">{t('ads.noAds')}</p>}
      </div>
    </div>
  )
}
