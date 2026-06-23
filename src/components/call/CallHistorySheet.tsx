import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Phone, PhoneMissed, PhoneIncoming, PhoneOutgoing, Trash2, Search } from 'lucide-react'
import { useAppStore } from '../../store'
import { useI18n } from '../../lib/i18n'

interface Props {
  open: boolean
  onClose: () => void
  onCall: (name: string) => void
  theme: 'dark' | 'light'
}

const typeIcon = {
  missed: PhoneMissed,
  incoming: PhoneIncoming,
  outgoing: PhoneOutgoing,
}

const typeColor = (type: string, isDark: boolean) => {
  if (type === 'missed') return isDark ? 'text-red-400' : 'text-red-500'
  if (type === 'incoming') return isDark ? 'text-green-400' : 'text-green-600'
  return isDark ? 'text-orange-400' : 'text-orange-600'
}

export const CallHistorySheet = ({ open, onClose, onCall, theme }: Props) => {
  const isDark = theme === 'dark'
  const { t } = useI18n()
  const callHistory = useAppStore(state => state.callHistory)
  const clearCallHistory = useAppStore(state => state.clearCallHistory)
  const [search, setSearch] = React.useState('')

  const filtered = callHistory.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className={`w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden ${isDark ? 'bg-[#1a1d24] border border-white/10' : 'bg-white border border-black/10'}`}
          >
            <div className="flex items-center justify-between p-5 pb-3">
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Call History</h2>
              <div className="flex items-center gap-2">
                {callHistory.length > 0 && (
                  <button onClick={clearCallHistory} className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'text-gray-400 hover:text-red-400 hover:bg-white/10' : 'text-slate-500 hover:text-red-500 hover:bg-black/10'}`} title="Clear all">
                    <Trash2 size={16} />
                  </button>
                )}
                <button onClick={onClose} className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-slate-800'}`}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="px-5 pb-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isDark ? 'bg-[#13151b]' : 'bg-slate-50'}`}>
                <Search size={16} className={isDark ? 'text-gray-500' : 'text-slate-400'} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search calls"
                  className={`flex-1 bg-transparent text-sm outline-none ${isDark ? 'text-white placeholder-gray-500' : 'text-slate-800 placeholder-slate-400'}`}
                />
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-2 pb-4">
              {filtered.length === 0 ? (
                <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                  <Phone size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No calls yet</p>
                </div>
              ) : (
                filtered.map(entry => {
                  const Icon = typeIcon[entry.type] || Phone
                  return (
                    <div key={entry.id} className={`flex items-center gap-3 p-3 rounded-2xl transition-colors group ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                      <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${typeColor(entry.type, isDark)} ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm truncate ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>
                          {entry.name}
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                          <span className="capitalize">{entry.type}</span>
                          <span>·</span>
                          <span>{entry.time}</span>
                          {entry.duration && <><span>·</span><span>{entry.duration}</span></>}
                        </div>
                      </div>
                      <button
                        onClick={() => { onCall(entry.name); onClose() }}
                        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-green-500/10 text-green-600 hover:bg-green-500/20'}`}
                      >
                        <Phone size={14} fill="currentColor" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
