import React, { useState } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  showSearch: boolean;
  isDark?: boolean;
  searchQuery: string;
  onSearchChange?: (value: string) => void;
  placeholder?: string;
  t?: (key: string, options?: any) => string;
}

export const SearchBar = ({ showSearch, isDark = false, searchQuery, onSearchChange = () => {}, placeholder }: SearchBarProps) => {
  if (!showSearch) return null;

  return (
    <div className={`px-5 relative z-10 overflow-hidden ${isDark ? "bg-[#1a1d24]/90 border-b border-white/5 backdrop-blur-md" : "bg-[#f4f7f9]/90 border-b border-black/5 backdrop-blur-md"}`}>
      <div className="py-2.5">
        <div
          className={`w-full h-10 rounded-full px-4 flex items-center ${
            isDark
              ? "bg-[#13151b] border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
              : "bg-[#eaeff4] border border-black/5 shadow-[inset_2px_2px_4px_rgba(165,175,190,0.3),_inset_-1px_-1px_2px_rgba(255,255,255,1)]"
          }`}
        >
          <Search
            size={16}
            className={`mr-2 shrink-0 ${isDark ? "text-gray-500" : "text-slate-400"}`}
          />
          <input
            type="search"
            placeholder={placeholder || "Search..."}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full bg-transparent border-none outline-none text-[13.5px] font-medium ${isDark ? "text-white placeholder:text-gray-500" : "text-slate-700 placeholder:text-slate-400"}`}
          />
          {searchQuery && (
            <div
              onClick={() => onSearchChange("")}
              className={`ml-2 shrink-0 cursor-pointer w-6 h-6 flex items-center justify-center rounded-full ${isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-black/10 text-slate-500"}`}
            >
              <X size={14} strokeWidth={2.5} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
