import React, { useState } from 'react';
import { Search } from 'lucide-react';

export const DarkSearchBar: React.FC<{
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  placeholder?: string;
}> = ({ searchQuery, onSearchChange, placeholder }) => {
  const [internalVal, setInternalVal] = useState("");
  const val = searchQuery !== undefined ? searchQuery : internalVal;
  const setVal = onSearchChange || setInternalVal;
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <div className="relative group w-full">
      <div
        className={`absolute -bottom-1 left-1/2 -translate-x-1/2 h-3 bg-orange-500 blur-[10px] rounded-full pointer-events-none transition-all duration-500 ${focused ? "w-[250px] opacity-100" : "w-[100px] opacity-0 group-hover:opacity-40"}`}
      />
      <div
        className={`absolute -bottom-[2px] left-1/2 -translate-x-1/2 h-[2px] bg-white rounded-full blur-[1px] pointer-events-none transition-all duration-500 ${focused ? "w-[80px] opacity-80" : "w-[20px] opacity-0 group-hover:opacity-30"}`}
      />
      <div
        className={`absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-6 h-[4px] bg-white rounded-full blur-[4px] opacity-100 pointer-events-none transition-all duration-500 ${focused ? "opacity-100" : "opacity-0"}`}
      />

      <div
        className={`relative w-full h-[64px] rounded-full px-8 py-0 flex items-center justify-between border transition-all duration-300 
        ${
          pressed
            ? "bg-[#101216] shadow-[inset_0_12px_24px_rgba(0,0,0,0.9),_inset_0_3px_6px_rgba(0,0,0,0.9)] border-orange-500/20 scale-[0.98]"
            : focused
              ? "bg-[#13151b] border-orange-500/40 scale-[1.02] shadow-[0_12px_24px_rgba(0,0,0,0.6),_inset_0_1.5px_2px_rgba(249,115,22,0.1),_inset_0_-2px_4px_rgba(0,0,0,0.9)]"
              : "bg-[#13151b] shadow-[0_16px_28px_rgba(0,0,0,0.4),_0_6px_12px_rgba(0,0,0,0.3),_inset_0_1.5px_2px_rgba(255,255,255,0.08),_inset_0_-2px_4px_rgba(0,0,0,0.8)] border-white/[0.04] hover:scale-[1.01]"
        }`}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
      >
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder || "Search messages, people..."}
          className="bg-transparent border-none outline-none w-full text-[15.5px] font-medium text-[#e8ecf2] placeholder:text-[#7a8190]"
        />
        <div
          className={`ml-3 cursor-pointer w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${focused ? "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 active:scale-90 active:bg-orange-500/30" : "text-[#a0a5b1] hover:bg-white/5"}`}
        >
          <Search size={22} strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
};
