import { useState, useRef, useEffect } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDark?: boolean;
  showCancel?: boolean;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search',
  isDark,
  showCancel = true,
  onCancel,
  autoFocus,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  return (
    <div className="flex items-center gap-2 w-full">
      <div
        className={`flex-1 flex items-center h-9 rounded-[10px] px-3 transition-all duration-200 ${
          isDark
            ? 'bg-[#1C1C1E] border border-white/5 focus-within:border-blue-500/30'
            : 'bg-[#E9E9EA] border border-transparent focus-within:border-blue-400/30'
        }`}
      >
        <svg className={`w-[15px] h-[15px] mr-2 shrink-0 ${isDark ? 'text-[#8E8E93]' : 'text-[#8E8E93]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`w-full bg-transparent border-none outline-none text-[15px] leading-none py-2 ${
            isDark ? 'text-white placeholder:text-[#8E8E93]' : 'text-black placeholder:text-[#8E8E93]'
          }`}
        />
      </div>
      {showCancel && isFocused && (
        <button
          onClick={() => { onChange(''); onCancel?.(); inputRef.current?.blur(); }}
          className={`text-[15px] font-normal shrink-0 transition-opacity ${
            isDark ? 'text-blue-400' : 'text-blue-500'
          }`}
        >
          Cancel
        </button>
      )}
    </div>
  );
}
