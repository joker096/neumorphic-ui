import React from 'react'
import { SearchInput } from '../ui/SearchInput'
import { useI18n } from '../../lib/i18n'

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
              className={`shrink-0 min-h-[32px] px-3 rounded-full text-[12px] font-semibold transition-colors cursor-pointer ${
                active
                  ? isDark
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                    : 'bg-orange-500/15 text-orange-600 border border-orange-500/40'
                  : isDark
                    ? 'bg-white/5 text-gray-300 border border-[var(--border-color)] hover:bg-white/10'
                    : 'bg-black/5 text-slate-600 border border-[var(--border-color)] hover:bg-black/10'
              }`}
            >
              {t(f.labelKey, f.fallback)}
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
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-40 enabled:hover:bg-black/10 dark:enabled:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)]"><polyline points="18 15 12 9 6 15"></polyline></svg>
            </button>
            <button
              type="button"
              onClick={onNextMatch}
              disabled={!hasMatches}
              aria-label={t('chat.searchNext', 'Next match')}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-40 enabled:hover:bg-black/10 dark:enabled:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)]"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}




