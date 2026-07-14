import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, TrendingUp, WifiOff } from 'lucide-react'
import { SearchInput } from './SearchInput'
import { useI18n } from '../../lib/i18n'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (url: string) => void
}

// Local placeholder GIFs (1x1 transparent pixel as data URI)
const LOCAL_PLACEHOLDER = 'data:image/gif;base64,RhLlYiRnR2345';

const TRENDING_GIFS = [
  { url: 'https://media.tenor.com/6JpZb3wQqPkAAAAC/wave-hello.gif', preview: 'https://media.tenor.com/6JpZb3wQqPkAAAAC/wave-hello.gif', local: true },
  { url: 'https://media.tenor.com/uxJX0xL9eRsAAAAC/laughing-lol.gif', preview: 'https://media.tenor.com/uxJX0xL9eRsAAAAC/laughing-lol.gif', local: true },
  { url: 'https://media.tenor.com/51VqJdMf4i4AAAAC/clap-applause.gif', preview: 'https://media.tenor.com/51VqJdMf4i4AAAAC/clap-applause.gif', local: true },
  { url: 'https://media.tenor.com/mSgZsPwKJggAAAAC/dancing-dance.gif', preview: 'https://media.tenor.com/mSgZsPwKJggAAAAC/dancing-dance.gif', local: true },
  { url: 'https://media.tenor.com/GfS4l7Z7fqIAAAAC/party-confetti.gif', preview: 'https://media.tenor.com/GfS4l7Z7fqIAAAAC/party-confetti.gif', local: true },
  { url: 'https://media.tenor.com/7YQ8Kn3qDkEAAAAC/ok-thumbs-up.gif', preview: 'https://media.tenor.com/7YQ8Kn3qDkEAAAAC/ok-thumbs-up.gif', local: true },
  { url: 'https://media.tenor.com/G8pJfX0YAN4AAAAC/sad-cry.gif', preview: 'https://media.tenor.com/G8pJfX0YAN4AAAAC/sad-cry.gif', local: true },
  { url: 'https://media.tenor.com/rUGjX6PtVQsAAAAC/heart-love.gif', preview: 'https://media.tenor.com/rUGjX6PtVQsAAAAC/heart-love.gif', local: true },
]

export const GifSearch = ({ open, onClose, onSelect }: Props) => {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ url: string; preview: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const searchGifs = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        // Check if online before attempting search
        if (!navigator.onLine) {
          setResults([])
          setLoading(false)
          return
        }
        const apiKey = import.meta.env.VITE_TENOR_API_KEY
         if (!apiKey) {
           setResults([])
           setLoading(false)
           return
         }
         const params = new URLSearchParams({
           q: q.trim(),
           limit: '20',
           media_filter: 'minimal',
           ar_range: 'standard',
         })
         const res = await fetch(`https://g.tenor.com/v1/search?${params}&key=${apiKey}`)
        if (!res.ok) throw new Error('API error')
        const data = await res.json()
        setResults((data.results || []).map((r: any) => ({
          url: r.media[0]?.gif?.url || r.itemurl,
          preview: r.media[0]?.tinygif?.url || r.media[0]?.gif?.url,
        })))
      } catch {
        // Offline or API error: show trending local GIFs
        setResults(TRENDING_GIFS.slice(0, 8).map((gif) => ({
          url: gif.url,
          preview: gif.preview,
        })))
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
          className={`absolute bottom-20 left-4 right-4 z-[150] max-h-80 rounded-md shadow-2xl overflow-hidden border ${'bg-[var(--bg-primary)] border-[var(--border-color)]'}`}
        >
          <div className="flex items-center gap-2 p-3">
            <div className="flex-1">
              <SearchInput
                value={query}
                onChange={v => { setQuery(v); searchGifs(v) }}
                placeholder={t('gifSearch.searchPlaceholder')}
                isDark
                autoFocus
              />
            </div>
            <button onClick={onClose} className={`min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center ${'text-[var(--text-primary)] hover:bg-white/10'}`}>
              <X size={16} />
            </button>
          </div>

          <div className="overflow-y-auto max-h-60 p-2">
            {isOffline && (
              <div className={`flex items-center gap-2 px-2 py-2 text-xs ${'text-orange-400'}`}>
                <WifiOff size={14} /> Offline mode - GIF search disabled
              </div>
            )}
            {!query && !loading && results.length === 0 && !isOffline && (
              <div className={`flex items-center gap-2 px-2 py-1.5 text-xs font-semibold uppercase tracking-wider ${'text-[var(--text-tertiary)]'}`}>
                <TrendingUp size={14} /> {t('gifSearch.trending')}
              </div>
            )}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className={`w-6 h-6 border-2 rounded-full animate-spin ${'border-white/20 border-t-white'}`} />
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {(results.length > 0 ? results : TRENDING_GIFS).map((gif, i) => (
                  <button
                    key={i}
                    onClick={() => { onSelect(gif.url); onClose() }}
                    className="aspect-square rounded-md overflow-hidden hover:ring-2 ring-orange-500 transition-all active:scale-95"
                  >
                    <img src={gif.preview} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
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
