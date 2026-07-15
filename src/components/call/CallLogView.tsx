import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Phone, PhoneMissed, PhoneIncoming, PhoneOutgoing,
  Users, Plus, UserPlus, Trash2,
} from 'lucide-react'
import { useAppStore } from '../../store'
import { useI18n } from '../../lib/i18n'
import { toast } from 'sonner'
import { FormModal } from '../ui/FormModal'
import { FormField } from '../ui/FormField'
import { FormActions } from '../ui/FormActions'
import { SearchInput } from '../ui/SearchInput'

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
  if (type === 'missed') return isDark ? 'text-red-400' : 'text-red-600'
  if (type === 'incoming') return isDark ? 'text-emerald-400' : 'text-emerald-600'
  return isDark ? 'text-orange-400' : 'text-orange-600'
}

const bgColor = (type: string, isDark: boolean) => {
  if (type === 'missed') return isDark ? 'bg-red-500/10' : 'bg-red-50'
  if (type === 'incoming') return isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'
  return isDark ? 'bg-orange-500/10' : 'bg-orange-50'
}

const hoverBg = (type: string, isDark: boolean) => {
  if (type === 'missed') return isDark ? 'hover:bg-red-500/5' : 'hover:bg-red-50/80'
  if (type === 'incoming') return isDark ? 'hover:bg-emerald-500/5' : 'hover:bg-emerald-50/80'
  return isDark ? 'hover:bg-orange-500/5' : 'hover:bg-orange-50/80'
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
  const contacts = useAppStore(state => state.contacts)
  const setContacts = useAppStore(state => state.setContacts)

  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<CallFilter>('all')
  const [showAddContact, setShowAddContact] = useState(false)
  const [addName, setAddName] = useState('')
  const [addId, setAddId] = useState('')
  const [pendingNumber, setPendingNumber] = useState('')

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

  const handleAddContact = () => {
    if (!addName.trim() || !addId.trim()) return
    const colors = [
      'from-teal-400 to-emerald-500', 'from-pink-400 to-rose-500',
      'from-yellow-400 to-orange-500', 'from-blue-400 to-indigo-500',
      'from-purple-400 to-fuchsia-500', 'from-cyan-400 to-blue-500',
    ]
    const color = colors[contacts.length % colors.length]
    setContacts([
      { name: addName.trim(), id: addId.trim(), color, lastSeen: Date.now() },
      ...contacts,
    ])
    setAddName('')
    setAddId('')
    setShowAddContact(false)
    toast.success(t('toast.contactAdded'), { description: addName.trim() })
  }

  const openAddContact = (name: string) => {
    setPendingNumber(name)
    setAddName(name)
    setAddId('')
    setShowAddContact(true)
  }

  return (
    <div className={`w-full h-full flex flex-col ${isDark ? 'bg-[#1a1d24]' : 'bg-white'} ${className}`}>
      <div className="shrink-0 mx-3 md:mx-4 mt-3 md:mt-4 mb-1">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('chat.searchOrDial')}
          isDark={isDark}
          shape="pill"
        />
      </div>

      <div className="flex items-center gap-1.5 shrink-0 px-3 md:px-4 py-2.5 overflow-x-auto scrollbar-none">
        {filters.map(f => (
          <motion.button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            whileTap={{ scale: 0.95 }}
            className={`shrink-0 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.15em] px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeFilter === f.key
                ? isDark
                  ? 'bg-orange-500/20 text-orange-400 shadow-sm'
                  : 'bg-orange-100 text-orange-700 shadow-sm'
                : isDark
                  ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-black/5'
            }`}
          >
            {t(f.labelKey)}
          </motion.button>
        ))}
        {callHistory.length > 0 && (
          <div className="ml-auto flex items-center gap-1 shrink-0">
            <motion.button
              onClick={clearCallHistory}
              whileTap={{ scale: 0.95 }}
              className={`text-[10px] md:text-[11px] font-medium transition-colors px-2 py-1.5 rounded-lg ${
                isDark ? 'text-gray-500 hover:text-red-400 hover:bg-white/5' : 'text-slate-400 hover:text-red-500 hover:bg-black/5'
              }`}
            >
              <Trash2 size={14} className="inline mr-1" />
              Clear
            </motion.button>
          </div>
        )}
      </div>

      <div className="flex shrink-0 px-3 md:px-4 pb-1">
        <motion.button
          onClick={() => { setPendingNumber(''); setAddName(''); setAddId(''); setShowAddContact(true) }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-1.5 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.15em] transition-colors px-2 py-1.5 rounded-lg ${
            isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5' : 'text-slate-400 hover:text-slate-600 hover:bg-black/5'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          {t('contacts.addContact')}
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 md:px-3 pb-4 scrollbar-none">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex flex-col items-center justify-center h-full ${isDark ? 'text-gray-500' : 'text-slate-400'}`}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
              <Phone className="w-7 h-7 opacity-40" />
            </div>
            <p className="text-sm font-medium">{t('chat.folders.noCalls')}</p>
            <p className="text-xs mt-1 opacity-50">{t('chat.folders.noCallsSubtitle') || 'Your call history will appear here'}</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((entry) => {
              const Icon = typeIcon[entry.type] || Phone
              const isUnknown = entry.name.startsWith('+') || entry.name === 'Unknown'
              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className={`group flex items-center gap-3 px-3 py-3 rounded-2xl transition-all cursor-pointer min-h-[56px] ${hoverBg(entry.type, isDark)} ${
                    isDark ? '' : ''
                  }`}
                  onClick={() => onCall?.(entry.name)}
                >
                  <div className={`shrink-0 w-10 h-10 rounded-[14px] flex items-center justify-center ${bgColor(entry.type, isDark)} ${typeColor(entry.type, isDark)}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold truncate leading-snug ${typeColor(entry.type, isDark)}`}>
                      {entry.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-medium tracking-wide text-orange-400">{entry.time}</span>
                      {entry.duration && (
                        <>
                          <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-slate-300'}`}>•</span>
                          <span className={`text-[10px] font-medium ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{entry.duration}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {isUnknown && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); openAddContact(entry.name) }}
                      className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all active:scale-90 ${
                        isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-slate-700'
                      }`}
                      title={t('contacts.addContact')}
                    >
                      <UserPlus size={14} />
                    </motion.button>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      <FormModal
        isOpen={showAddContact}
        onClose={() => setShowAddContact(false)}
        title={t('contacts.addContact')}
        subtitle={t('contacts.addContactSubtitle') || 'Enter name and network ID'}
        icon={UserPlus}
        theme={theme}
      >
        <div className="flex flex-col gap-3 mt-2">
          <FormField
            theme={theme}
            autoFocus
            placeholder={t('contacts.contactName')}
            value={addName}
            onChange={setAddName}
          />
          <FormField
            theme={theme}
            placeholder={t('contacts.networkId')}
            value={addId}
            onChange={setAddId}
            monospace
          />
        </div>
        <FormActions
          theme={theme}
          submitLabel={t('contacts.saveContact')}
          cancelLabel={t('contacts.close')}
          onSubmit={handleAddContact}
          onCancel={() => setShowAddContact(false)}
          disabled={!addName.trim() || !addId.trim()}
        />
      </FormModal>
    </div>
  )
}
