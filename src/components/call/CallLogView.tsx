import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Phone, PhoneMissed, PhoneIncoming, PhoneOutgoing,
  Search, Users, X, Plus
} from 'lucide-react'
import { useAppStore } from '../../store'
import { useI18n } from '../../lib/i18n'

interface CallLogViewProps {
  onCall?: (name: string) => void
  theme?: 'dark' | 'light'
  className?: string
}

type CallFilter = 'all' | 'incoming' | 'outgoing' | 'missed'

const typeIcon = {
  missed: PhoneMissed,
  incoming: PhoneIncoming,
  outgoing: PhoneOutgoing,
} as const

const typeColor = (type: string, isDark: boolean) => {
  if (type === 'missed') return isDark ? 'text-red-400' : 'text-red-500'
  if (type === 'incoming') return isDark ? 'text-green-400' : 'text-green-600'
  return isDark ? 'text-orange-400' : 'text-orange-600'
}

const bgColor = (type: string, isDark: boolean) => {
  if (type === 'missed') return isDark ? 'bg-red-500/10' : 'bg-red-50'
  if (type === 'incoming') return isDark ? 'bg-green-500/10' : 'bg-green-50'
  return isDark ? 'bg-orange-500/10' : 'bg-orange-50'
}

const filters: { key: CallFilter; labelKey: string }[] = [
  { key: 'all', labelKey: 'chat.all' },
  { key: 'incoming', labelKey: 'chat.incomingShort' },
  { key: 'outgoing', labelKey: 'chat.outgoingShort' },
  { key: 'missed', labelKey: 'chat.missed' },
]

export const CallLogView = ({ onCall, theme = 'dark', className = '' }: CallLogViewProps) => {
  const isDark = theme === 'dark'
  const { t } = useI18n()
  const callHistory = useAppStore(state => state.callHistory)
  const clearCallHistory = useAppStore(state => state.clearCallHistory)

  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<CallFilter>('all')

  const filtered = useMemo(() => {
    let list = callHistory
    if (search) {
      list = list.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    }
    if (activeFilter !== 'all') {
      list = list.filter(e => e.type === activeFilter)
    }
    return list
  }, [callHistory, search, activeFilter])

  return (
    <div className={`w-full h-full flex flex-col bg-[#1a1d24] ${isDark ? '' : 'bg-white'} ${className}`}>
      {/* Search bar */}
      <div className="relative flex items-center h-11 md:h-12 shrink-0 mx-3 md:mx-4 mt-3 md:mt-4 mb-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          placeholder={t('chat.searchOrDial')}
          className="w-full h-full bg-transparent border border-white/10 rounded-xl pl-9 pr-9 text-sm font-medium outline-none transition-colors text-white placeholder:text-gray-500 focus:border-orange-500/50"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 shrink-0 px-3 md:px-4 py-2 overflow-x-auto scrollbar-none">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`shrink-0 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.15em] px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeFilter === f.key
                ? 'bg-orange-500/20 text-orange-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t(f.labelKey)}
          </button>
        ))}
        {callHistory.length > 0 && (
          <div className="ml-auto flex items-center gap-1 shrink-0">
            <button
              onClick={clearCallHistory}
              className="text-[10px] md:text-[11px] font-medium text-gray-500 hover:text-red-400 transition-colors px-2 py-1 rounded-md hover:bg-white/5"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Contact button */}
      <div className="flex shrink-0 px-3 md:px-4 pb-1">
        <button className="flex items-center gap-1.5 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 rounded-md hover:bg-white/5">
          <Plus className="w-3 h-3" />
          {t('chat.selectContact')}
        </button>
      </div>

      {/* Call list */}
      <div className="flex-1 overflow-y-auto px-2 md:px-3 pb-4 scrollbar-none">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Phone className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm font-medium">{t('chat.folders.noCalls')}</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((entry) => {
              const Icon = typeIcon[entry.type] || Phone
              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className="group flex items-center gap-3 px-2.5 py-2.5 rounded-2xl transition-colors hover:bg-white/5 cursor-pointer min-h-[52px]"
                  onClick={() => onCall?.(entry.name)}
                >
                  <div className={`shrink-0 w-10 h-10 rounded-[14px] flex items-center justify-center ${bgColor(entry.type, isDark)} ${typeColor(entry.type, isDark)}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-bold truncate leading-snug ${typeColor(entry.type, isDark)}`}>
                      {entry.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-semibold tracking-wide text-orange-400">{entry.time}</span>
                      {entry.duration && (
                        <>
                          <span className="text-gray-600 text-[10px]">•</span>
                          <span className="text-[10px] font-medium text-gray-500">{entry.duration}</span>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
