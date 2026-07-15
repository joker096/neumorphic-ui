import React from 'react'
import { SearchInput } from '../ui/SearchInput'

interface SearchBarProps {
  showSearch: boolean
  isDark?: boolean
  searchQuery: string
  onSearchChange?: (value: string) => void
  placeholder?: string
}

export const SearchBar = ({ showSearch, isDark = false, searchQuery, onSearchChange = () => {}, placeholder }: SearchBarProps) => {
  if (!showSearch) return null

  return (
    <div className={`px-5 relative z-10 overflow-hidden ${isDark ? 'bg-[#1a1d24]/90 border-b border-white/5 backdrop-blur-md' : 'bg-[#f4f7f9]/90 border-b border-black/5 backdrop-blur-md'}`}>
      <div className="py-2.5">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={placeholder || 'Search...'}
          isDark={isDark}
          shape="pill"
          role="searchbox"
        />
      </div>
    </div>
  )
}
