import React from 'react'
import { SearchInput } from '../ui/SearchInput'
import { useI18n } from '../../lib/i18n'
import { ChevronDown, ChevronUp, CalendarDays } from "lucide-react";

/** Round icon button of the chat search bar. */
const ICON_BTN_CLASS = 'shrink-0 w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-40 enabled:hover:bg-black/10 dark:enabled:hover:bg-white/10 transition-colors cursor-pointer';

interface SearchBarProps {
  showSearch: boolean
  isDark?: boolean
  searchQuery: string
  onSearchChange?: (value: string) => void
  placeholder?: string
  searchTypeFilter?: 'all' | 'media' | 'files' | 'links'
  onSearchTypeChange?: (value: 'all' | 'media' | 'files' | 'links') => void
  matchCount?: number
  activeMatch?: number
  onPrevMatch?: () => void
  onNextMatch?: () => void
  onJumpToDate?: (value: string) => void
}

const FILTERS: Array<{ key: 'all' | 'media' | 'files' | 'links'; labelKey: string; fallback: string }> = [
  { key: 'all', labelKey: 'chat.filters.all', fallback: 'All' },
  { key: 'media', labelKey: 'chat.filters.media', fallback: 'Media' },
  { key: 'files', labelKey: 'chat.filters.files', fallback: 'Files' },
  { key: 'links', labelKey: 'chat.filters.links', fallback: 'Links' },
]

export const SearchBar = ({ showSearch, isDark = false, searchQuery, onSearchChange = () => {}, placeholder, searchTypeFilter = 'all', onSearchTypeChange = () => {}, matchCount = 0, activeMatch = 0, onPrevMatch, onNextMatch, onJumpToDate }: SearchBarProps) => {
  const { t } = useI18n();
  if (!showSearch) return null

  const hasMatches = matchCount > 0;

  return (
    <div className="px-5 relative z-10 overflow-hidden bg-[var(--msg-bg-panel)]/80 border-b border-[var(--msg-border-soft)] backdrop-blur-[var(--msg-glass-blur)]">
      <div className="py-2.5">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={placeholder || t('search.chatsOrMessages', 'Search')}
          isDark={isDark}
          shape="pill"
          role="searchbox"
        />
      </div>
      <div className="flex items-center gap-2 pb-2.5 overflow-x-auto">
        {FILTERS.map((f) => {
          const active = searchTypeFilter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => onSearchTypeChange(f.key)}
              aria-pressed={active}
              className={`group shrink-0 min-h-11 min-w-11 p-1 flex items-center justify-center rounded-full cursor-pointer transition-transform active:scale-95 ${
                active ? 'bg-[var(--accent)]/20' : ''
              }`}
            >
              <span className={`flex items-center px-3 py-0.5 rounded-full text-xs font-semibold transition-colors border ${
                active
                  ? 'text-[var(--accent)] border-[var(--accent)]/40'
                  : 'text-[var(--text-secondary)] border-[var(--border-color)] group-hover:text-[var(--text-primary)] group-hover:bg-[var(--msg-bg-panel-hover)]'
              }`}>
                {t(f.labelKey, f.fallback)}
              </span>
            </button>
          );
        })}

        {onJumpToDate && (
          <label className="shrink-0 flex items-center gap-1.5 min-h-11 rounded-full px-3 border border-[var(--border-color)] text-[var(--text-secondary)]">
            <CalendarDays size={14} aria-hidden="true" />
            <input
              type="date"
              aria-label={t('chat.jumpToDate', 'Jump to date')}
              title={t('chat.jumpToDate', 'Jump to date')}
              onChange={(e) => { if (e.target.value) onJumpToDate(e.target.value); }}
              className="bg-transparent text-xs text-[var(--text-primary)] outline-none"
            />
          </label>
        )}

        {searchQuery.trim() !== '' && (
          <div className="shrink-0 ml-auto flex items-center gap-1 pl-2">
            <span className="text-xs tabular-nums text-[var(--text-tertiary)] min-w-[52px] text-right">
              {hasMatches ? `${activeMatch + 1}/${matchCount}` : t('chat.searchNoResults', 'No results')}
            </span>
            <button
              type="button"
              onClick={onPrevMatch}
              disabled={!hasMatches}
              aria-label={t('chat.searchPrev', 'Previous match')}
              title={t('chat.searchPrev', 'Previous match')}
              className={ICON_BTN_CLASS}
            >
              <ChevronUp size={16} className="text-[var(--text-secondary)]" />
            </button>
            <button
              type="button"
              onClick={onNextMatch}
              disabled={!hasMatches}
              aria-label={t('chat.searchNext', 'Next match')}
              title={t('chat.searchNext', 'Next match')}
              className={ICON_BTN_CLASS}
            >
              <ChevronDown size={16} className="text-[var(--text-secondary)]" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}




