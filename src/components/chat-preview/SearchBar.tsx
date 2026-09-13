import React from 'react'
import { SearchInput } from '../ui/SearchInput'
import { useI18n } from '../../lib/i18n'
import { ChevronDown, ChevronUp } from "lucide-react";

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
}

const FILTERS: Array<{ key: 'all' | 'media' | 'files' | 'links'; labelKey: string; fallback: string }> = [
  { key: 'all', labelKey: 'chat.filters.all', fallback: 'All' },
  { key: 'media', labelKey: 'chat.filters.media', fallback: 'Media' },
  { key: 'files', labelKey: 'chat.filters.files', fallback: 'Files' },
  { key: 'links', labelKey: 'chat.filters.links', fallback: 'Links' },
]

export const SearchBar = ({ showSearch, isDark = false, searchQuery, onSearchChange = () => {}, placeholder, searchTypeFilter = 'all', onSearchTypeChange = () => {}, matchCount = 0, activeMatch = 0, onPrevMatch, onNextMatch }: SearchBarProps) => {
  const { t } = useI18n();
  if (!showSearch) return null

  const hasMatches = matchCount > 0;

  return (
    <div className={`px-5 relative z-10 overflow-hidden ${isDark ? 'bg-[var(--bg-tertiary)]/90 border-b border-[var(--border-color)] backdrop-blur-md' : 'bg-[var(--bg-primary)]/90 border-b border-[var(--border-color)] backdrop-blur-md'}`}>
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
                active
                  ? isDark
                    ? 'bg-orange-500/20'
                    : 'bg-orange-500/15'
                  : ''
              }`}
            >
              <span className={`flex items-center px-3 py-0.5 rounded-full text-[12px] font-semibold transition-colors border ${
                active
                  ? isDark
                    ? 'text-orange-300 border-orange-500/40'
                    : 'text-orange-600 border-orange-500/40'
                  : isDark
                    ? 'text-gray-300 border-[var(--border-color)] group-hover:text-white group-hover:bg-white/10'
                    : 'text-slate-600 border-[var(--border-color)] group-hover:text-slate-800 group-hover:bg-black/10'
              }`}>
                {t(f.labelKey, f.fallback)}
              </span>
            </button>
          );
        })}

        {searchQuery.trim() !== '' && (
          <div className="shrink-0 ml-auto flex items-center gap-1 pl-2">
            <span className="text-[12px] tabular-nums text-[var(--text-tertiary)] min-w-[52px] text-right">
              {hasMatches ? `${activeMatch + 1}/${matchCount}` : t('chat.searchNoResults', 'No results')}
            </span>
            <button
              type="button"
              onClick={onPrevMatch}
              disabled={!hasMatches}
              aria-label={t('chat.searchPrev', 'Previous match')}
              title={t('chat.searchPrev', 'Previous match')}
              className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-40 enabled:hover:bg-black/10 dark:enabled:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ChevronUp size={16} className="text-[var(--text-secondary)]" />
            </button>
            <button
              type="button"
              onClick={onNextMatch}
              disabled={!hasMatches}
              aria-label={t('chat.searchNext', 'Next match')}
              title={t('chat.searchNext', 'Next match')}
              className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-40 enabled:hover:bg-black/10 dark:enabled:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ChevronDown size={16} className="text-[var(--text-secondary)]" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}




