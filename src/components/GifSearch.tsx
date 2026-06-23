import React, { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, X, TrendingUp } from 'lucide-react'
import { useI18n } from '../lib/i18n'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (url: string) => void
  theme: 'dark' | 'light'
}

const TRENDING_GIFS = [
  'https://media.tenor.com/6JpZb3wQqPkAAAAC/wave-hello.gif',
  'https://media.tenor.com/uxJX0xL9eRsAAAAC/laughing-lol.gif',
  'https://media.tenor.com/51VqJdMf4i4AAAAC/clap-applause.gif',
  'https://media.tenor.com/mSgZsPwKJggAAAAC/dancing-dance.gif',
  'https://media.tenor.com/GfS4l7Z7fqIAAAAC/party-confetti.gif',
  'https://media.tenor.com/7YQ8Kn3qDkEAAAAC/ok-thumbs-up.gif',
  'https://media.tenor.com/G8pJfX0YAN4AAAAC/sad-cry.gif',
  'https://media.tenor.com/rUGjX6PtVQsAAAAC/heart-love.gif',
]

export const GifSearch = ({ open, onClose, onSelect, theme }: Props) => {
  const isDark = theme === 'dark'
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ url: string; preview: string }[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const searchGifs = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: q.trim(),
          limit: '20',
          media_filter: 'minimal',
          ar_range: 'standard',
        })
        const res = await fetch(`https://g.tenor.com/v1/search?${params}&key=LIVDSRZULELA`)
        if (!res.ok) throw new Error('API error')
        const data = await res.json()
        setResults((data.results || []).map((r: any) => ({
          url: r.media[0]?.gif?.url || r.itemurl,
          preview: r.media[0]?.tinygif?.url || r.media[0]?.gif?.url,
        })))
      } catch {
        setResults(TRENDING_GIFS.slice(0, 8).map(url => ({ url, preview: url })))
      }
      setLoading(false)
    }, 400)
  }, [])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className={`absolute bottom-20 left-4 right-4 z-[150] max-h-80 rounded-2xl shadow-2xl overflow-hidden border ${isDark ? 'bg-[#1a1d24] border-white/10' : 'bg-white border-black/10'}`}
        >
          <div className="flex items-center gap-2 p-3">
            <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl ${isDark ? 'bg-[#13151b]' : 'bg-slate-50'}`}>
              <Search size={16} className={isDark ? 'text-gray-500' : 'text-slate-400'} />
              <input
                autoFocus
                value={query}
                onChange={e => { setQuery(e.target.value); searchGifs(e.target.value) }}
                placeholder={t('gifSearch.searchPlaceholder')}
                className={`flex-1 bg-transparent text-sm outline-none ${isDark ? 'text-white placeholder-gray-500' : 'text-slate-800 placeholder-slate-400'}`}
              />
              {query && <button onClick={() => { setQuery(''); setResults([]) }} className={isDark ? 'text-gray-500' : 'text-slate-400'}><X size={14} /></button>}
            </div>
            <button onClick={onClose} className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-slate-800'}`}>
              <X size={16} />
            </button>
          </div>

          <div className="overflow-y-auto max-h-60 p-2">
            {!query && !loading && (
              <div className={`flex items-center gap-2 px-2 py-1.5 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                <TrendingUp size={14} /> {t('gifSearch.trending')}
              </div>
            )}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className={`w-6 h-6 border-2 rounded-full animate-spin ${isDark ? 'border-white/20 border-t-white' : 'border-slate-200 border-t-slate-600'}`} />
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {(results.length > 0 ? results : TRENDING_GIFS.map(url => ({ url, preview: url }))).map((gif, i) => (
                  <button
                    key={i}
                    onClick={() => { onSelect(gif.url); onClose() }}
                    className="aspect-square rounded-xl overflow-hidden hover:ring-2 ring-orange-500 transition-all active:scale-95"
                  >
                    <img src={gif.preview} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
