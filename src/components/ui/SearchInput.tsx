import { Search } from 'lucide-react';
import { Input } from './Input';

type SearchInputProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

export const SearchInput = ({ value, onChange, placeholder }: SearchInputProps) => (
  <div className="flex items-center gap-2 w-full px-3 py-2 rounded-md bg-[var(--search-bg)] border border-[var(--search-border)]">
    <Search size={16} className="text-[var(--search-icon)]" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="flex-1 bg-transparent outline-none text-sm text-[var(--search-text)] placeholder:text-[var(--search-placeholder)]"
    />
  </div>
);
