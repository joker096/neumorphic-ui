import React, { useState } from 'react';
import { Search } from 'lucide-react';

export const LightSearchBar: React.FC<{
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
        className={`absolute -bottom-1 left-1/2 -translate-x-1/2 h-3 bg-orange-400 blur-[10px] rounded-full pointer-events-none transition-all duration-500 ${focused ? "w-[250px] opacity-100" : "w-[100px] opacity-0 group-hover:opacity-40"}`}
      />
      <div
        className={`absolute -bottom-[2px] left-1/2 -translate-x-1/2 h-[2px] bg-white rounded-full blur-[1px] pointer-events-none transition-all duration-500 ${focused ? "w-[80px] opacity-100" : "w-[20px] opacity-0 group-hover:opacity-30"}`}
      />
      <div
        className={`absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-6 h-[4px] bg-white rounded-full blur-[4px] opacity-100 pointer-events-none transition-all duration-500 ${focused ? "opacity-100" : "opacity-0"}`}
      />

      <div
        className={`relative w-full h-[64px] rounded-full px-8 py-0 flex items-center justify-between border transition-all duration-300 
        ${
          pressed
            ? "bg-[#e2e8f0] shadow-[inset_4px_4px_10px_rgba(165,175,190,0.4),_inset_-2px_-2px_6px_rgba(255,255,255,1)] border-black/5 scale-[0.98]"
            : focused
              ? "bg-[#eaeff4] border-orange-300/60 scale-[1.02] shadow-[-6px_-6px_12px_rgba(255,255,255,1),_8px_10px_20px_rgba(165,175,190,0.4),_inset_3px_3px_6px_rgba(165,175,190,0.1)]"
              : "bg-[#eaeff4] shadow-[-12px_-12px_24px_rgba(255,255,255,0.9),_16px_20px_35px_rgba(165,175,190,0.5),_inset_1.5px_1.5px_3px_rgba(255,255,255,1)] border-white/80 hover:scale-[1.01]"
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
          placeholder={placeholder || "Search chats or messages..."}
          className="bg-transparent border-none outline-none w-full text-[15.5px] font-medium text-[#4b5563] placeholder:text-[#88909e] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]"
        />
        <div
          className={`ml-3 cursor-pointer w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${focused ? "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 active:scale-90 active:bg-orange-500/30" : "text-[#5b6371] hover:bg-gray-200/50"}`}
        >
          <Search
            size={22}
            strokeWidth={1.75}
            className={`drop-shadow-[0_1px_1px_rgba(255,255,255,1)]`}
          />
        </div>
      </div>
    </div>
  );
};
