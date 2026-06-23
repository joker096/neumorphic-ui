import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CheckCheck,
  ChevronDown,
  Mic,
  MicOff,
  Phone,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Plus,
  Search,
  User,
  UserPlus,
  Users,
  Video,
  Volume1,
  Volume2,
  X,
} from "lucide-react";
import { ContactProfileModal, type ContactProfile } from "./ContactProfileModal";
import { useAppStore } from "../store";
import { useI18n } from "../lib/i18n";
import type { Contact } from "../types/contact";
import { toast } from "sonner";
import { MOCK_CALLS } from "./mockData";

interface DialpadProps {
  theme: "light" | "dark";
  onCall?: (name: string, color?: string) => void;
  onVideoCall?: (name: string, color?: string) => void;
  onMessage?: (name: string, color?: string) => void;
  contacts: Contact[];
  showContactPicker: boolean;
  setShowContactPicker: (show: boolean) => void;
  setEditingContact: (contact: Contact | null) => void;
}

/**
 * Custom SVG Icon to precisely match the "Eucive" double-chevron diamond.
 */
// --- Light Neumorphic Element Pieces ---

export const NeumorphicKnob = () => (
  <div className="w-[18px] h-[18px] rounded-full bg-[#eaeff4] shadow-[-2px_-2px_5px_rgba(255,255,255,0.9),_2px_2px_5px_rgba(165,175,190,0.5),_inset_1px_1px_2px_rgba(255,255,255,0.8),_inset_-1px_-1px_2px_rgba(165,175,190,0.1)] shrink-0" />
);

export const GlowingKnobLine = ({ count }: { count?: number }) => (
  <div className="w-[20px] h-[20px] rounded-full bg-[#eaeff4] shadow-[0_0_15px_rgba(255,160,80,0.8),_-2px_-2px_5px_rgba(255,255,255,0.9),_2px_2px_5px_rgba(165,175,190,0.5),_inset_1px_1px_2px_rgba(255,255,255,0.8)] shrink-0 flex items-center justify-center relative">
    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-300 via-orange-400 to-orange-200 opacity-90 shadow-[inset_0_-2px_4px_rgba(234,88,12,0.5)]" />
    {count && (
      <span className="relative z-10 text-[10px] font-bold text-orange-950 pb-[0.5px] pr-[0.5px]">
        {count}
      </span>
    )}
  </div>
);

export const GlowingPlusLight = () => (
  <div className="relative flex items-center justify-center p-1 w-6 h-6 shrink-0">
    <div className="absolute inset-0 bg-orange-400/50 blur-[14px] rounded-full scale-[2.2]" />
    <Plus
      size={20}
      strokeWidth={2}
      className="relative z-10 text-orange-50 drop-shadow-[0_0_4px_rgba(249,115,22,0.9)]"
    />
  </div>
);

export const LightPillButton = ({ title, subtitle, icon: Icon, badge }: any) => {
  const [active, setActive] = useState(false);
  return (
    <div
      onClick={() => setActive(!active)}
      className={`w-[260px] h-[66px] rounded-[33px] pl-6 pr-5 py-3 flex items-center justify-between cursor-pointer transition-all duration-300 select-none group border ${
        active
          ? "bg-[#e2e8f0] shadow-[inset_4px_4px_8px_rgba(165,175,190,0.25),_inset_-2px_-2px_6px_rgba(255,255,255,1)] border-black/5"
          : "bg-[#eaeff4] shadow-[-10px_-10px_22px_rgba(255,255,255,0.9),_14px_18px_32px_rgba(165,175,190,0.55),_inset_1.5px_1.5px_2.5px_rgba(255,255,255,1)] hover:scale-[1.03] active:scale-[0.97] border-white/80"
      }`}
    >
      <div className="flex flex-col -space-y-[1px] mt-1 pointer-events-none overflow-hidden pr-3">
        <span
          className={`text-[14.5px] font-semibold tracking-tight truncate w-full transition-colors ${active ? "text-orange-600" : "text-[#1a1a1b] group-hover:text-orange-600"}`}
        >
          {title}
        </span>
        <span className="text-[11.5px] font-medium text-[#88909e] truncate w-full">
          {subtitle}
        </span>
      </div>
      <div className="flex items-center justify-center shrink-0">
        {badge ? (
          <div className="w-[22px] h-[22px] rounded-full bg-gradient-to-tr from-orange-400 to-orange-300 shadow-[0_4px_8px_rgba(249,115,22,0.4),_inset_0_-2px_4px_rgba(249,115,22,0.5)] shrink-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-orange-950 pb-[0.5px] pr-[0.5px]">
              {badge}
            </span>
          </div>
        ) : Icon ? (
          <Icon
            size={20}
            strokeWidth={1.75}
            className={`transition-all duration-300 ${active ? "text-orange-500 scale-110" : "text-[#4b5563]"}`}
          />
        ) : null}
      </div>
    </div>
  );
};

export const LightSearchBar = ({ searchQuery, onSearchChange, placeholder }: { searchQuery?: string, onSearchChange?: (val: string) => void, placeholder?: string }) => {
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

// --- Dark Matte Elements ---

export const DarkPillButton = ({ title, subtitle, icon: Icon, badge }: any) => {
  const [active, setActive] = useState(false);
  return (
    <div
      onClick={() => setActive(!active)}
      className={`relative group w-[260px] h-[66px] rounded-[33px] cursor-pointer transition-all duration-300 select-none ${!active && "hover:scale-[1.03] active:scale-[0.97]"} ${
        active
          ? "shadow-[inset_0_12px_24px_rgba(0,0,0,0.9),_inset_0_3px_6px_rgba(0,0,0,0.9)] bg-[#101216] border border-orange-500/20"
          : "shadow-[0_22px_38px_rgba(0,0,0,0.5),_0_10px_16px_rgba(0,0,0,0.35),_inset_0_1.5px_2px_rgba(255,255,255,0.08),_inset_0_-2px_4px_rgba(0,0,0,0.8)] bg-[#13151b] border border-white/[0.04]"
      }`}
    >
      {/* Outer Glows for active button */}
      {active && (
        <>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-3 bg-orange-500 rounded-full blur-[10px] opacity-100 pointer-events-none" />
          <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-10 h-[2px] bg-white rounded-full blur-[1px] opacity-80 pointer-events-none" />
          <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-4 h-[4px] bg-white rounded-full blur-[4px] opacity-100 pointer-events-none" />
        </>
      )}

      <div className="w-full h-full rounded-[33px] pl-6 pr-5 py-3 flex items-center justify-between pointer-events-none overflow-hidden relative z-10 transition-colors">
        <div className="flex flex-col -space-y-[1px] mt-0.5 mt-1">
          <span
            className={`text-[14.5px] font-semibold tracking-wide truncate w-full transition-colors ${active ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]" : "text-[#e8ecf2]"}`}
          >
            {title}
          </span>
          <span className="text-[11.5px] font-medium text-[#7a8190] truncate w-full">
            {subtitle}
          </span>
        </div>
        <div className="flex items-center justify-center shrink-0">
          {badge ? (
            <div className="w-[22px] h-[22px] bg-gradient-to-tr from-orange-500 to-orange-400 rounded-full shadow-[0_0_12px_rgba(249,115,22,0.7),_inset_0_2px_3px_rgba(255,255,255,0.4)] border border-white/20 flex items-center justify-center">
              <span className="text-[11px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] pb-[0.5px] pr-[0.5px]">
                {badge}
              </span>
            </div>
          ) : Icon ? (
            <Icon
              size={20}
              strokeWidth={active ? 2 : 1.75}
              className={`transition-all duration-300 ${active ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)] scale-110" : "text-[#7a8190]"}`}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export const DarkSearchBar = ({ searchQuery, onSearchChange, placeholder }: { searchQuery?: string, onSearchChange?: (val: string) => void, placeholder?: string }) => {
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

// --- Messenger Specific Action Orbs ---
export const ActionCircleButton = ({
  icon: Icon,
  theme,
  label,
  color = "default",
  isToggleable = true,
}: any) => {
  const [active, setActive] = useState(false);
  const isDark = theme === "dark";

  let iconColor = isDark ? "text-white/70" : "text-slate-500";
  let hoverIconColor = isDark
    ? "group-hover:text-white"
    : "group-hover:text-slate-800";
  let activeIconColor = isDark
    ? "text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]"
    : "text-slate-900 drop-shadow-[0_1px_1px_rgba(255,255,255,1)]";

  if (color === "red") {
    iconColor = isDark ? "text-red-400/80" : "text-red-500";
    hoverIconColor = isDark
      ? "group-hover:text-red-300 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]"
      : "group-hover:text-red-600";
    activeIconColor = isDark
      ? "text-red-400 drop-shadow-[0_0_12px_rgba(248,113,113,0.8)] scale-105"
      : "text-red-600 drop-shadow-[0_2px_4px_rgba(220,38,38,0.3)] scale-105";
  } else if (color === "yellow") {
    iconColor = "text-amber-500";
    hoverIconColor = isDark
      ? "group-hover:text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
      : "group-hover:text-amber-400";
    activeIconColor = isDark
      ? "text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] scale-105"
      : "text-amber-500 drop-shadow-[0_1px_1px_rgba(255,255,255,1)] scale-105";
  } else if (color === "green") {
    iconColor = isDark ? "text-teal-400" : "text-teal-600";
    hoverIconColor = isDark
      ? "group-hover:text-teal-300 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]"
      : "group-hover:text-teal-700";
    activeIconColor =
      "text-teal-400 drop-shadow-[0_0_12px_rgba(45,212,191,0.8)] scale-105";
  } else if (color === "blue") {
    iconColor = isDark ? "text-blue-400" : "text-blue-600";
    hoverIconColor = isDark
      ? "group-hover:text-blue-300 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]"
      : "group-hover:text-blue-700";
    activeIconColor = isDark
      ? "text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.8)] scale-105"
      : "text-blue-600 drop-shadow-[0_1px_1px_rgba(255,255,255,1)] scale-105";
  }

  // default blue/teal when active if no color specified
  if (active && color === "default") {
    activeIconColor = isDark
      ? "text-orange-400 drop-shadow-[0_0_12px_rgba(251,146,60,0.8)] scale-105"
      : "text-orange-500 scale-105 drop-shadow-[0_2px_4px_rgba(249,115,22,0.3)]";
  }

  return (
    <div
      className="flex flex-col items-center gap-3 group cursor-pointer w-[80px]"
      onClick={() => isToggleable && setActive(!active)}
    >
      <div
        className={`w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all duration-300 ${!active ? "group-hover:scale-[1.05] active:scale-95" : "scale-95"} ${
          isDark
            ? active
              ? "bg-[#101216] shadow-[inset_0_12px_24px_rgba(0,0,0,0.9),_inset_0_3px_6px_rgba(0,0,0,0.9)] border border-orange-500/20"
              : "bg-[#13151b] shadow-[0_12px_24px_rgba(0,0,0,0.5),_inset_0_1.5px_2px_rgba(255,255,255,0.08),_inset_0_-2px_4px_rgba(0,0,0,0.8)] border border-white/[0.04]"
            : active
              ? "bg-[#e2e8f0] shadow-[inset_4px_4px_10px_rgba(165,175,190,0.4),_inset_-2px_-2px_6px_rgba(255,255,255,1)] border border-black/5"
              : "bg-[#eaeff4] shadow-[-6px_-6px_12px_rgba(255,255,255,0.9),_8px_8px_16px_rgba(165,175,190,0.5),_inset_2px_2px_4px_rgba(255,255,255,1)] border border-white/80"
        }`}
      >
        <Icon
          size={24}
          strokeWidth={1.75}
          className={`transition-all duration-300 ${active ? activeIconColor : `${iconColor} ${hoverIconColor} text-slate-800`}`}
        />
      </div>
      <span
        className={`text-[10.5px] font-bold uppercase tracking-wider text-center transition-colors ${active ? (isDark ? "text-orange-400" : "text-orange-600") : isDark ? "text-gray-500 group-hover:text-gray-300" : "text-slate-500 group-hover:text-slate-800"}`}
      >
        {label}
      </span>
    </div>
  );
};

// --- Authentic Messenger Call Dialpad ---

export const PillButton = ({
  label,
  subtitle,
  rightIcon,
  hasDropdown = false,
  glowColor = "orange",
  isLarge = false,
  theme = "dark",
  active = false,
  onClick,
}: any) => {
  const isDark = theme === "dark";
  return (
    <div
      onClick={onClick}
      className={`relative flex items-center shrink-0 cursor-pointer group transition-transform hover:scale-[1.02] active:scale-95 ${
        isLarge
          ? "w-full h-[52px] justify-center flex-col"
          : "w-[110px] h-[48px] justify-between px-2.5"
      }`}
    >
      <div
        className={`absolute inset-0 rounded-full flex items-center justify-center font-bold tracking-wide transition-all z-10 ${
          isDark
            ? active
              ? "bg-[#1a1d24] shadow-[0_6px_16px_rgba(0,0,0,0.8),_inset_0_1px_2px_rgba(255,255,255,0.06),_inset_0_-2px_4px_rgba(0,0,0,0.9)] border border-white/[0.04]"
              : "bg-[#15171d] hover:bg-[#1a1d24] shadow-[0_4px_10px_rgba(0,0,0,0.4),_inset_0_1px_1px_rgba(255,255,255,0.03),_inset_0_-1px_2px_rgba(0,0,0,0.5)] border border-white/[0.02]"
            : active
              ? "bg-[#f4f7f9] shadow-[-6px_-6px_14px_rgba(255,255,255,1),_8px_10px_20px_rgba(165,175,190,0.3),_inset_1px_1px_2px_rgba(255,255,255,1)] border border-white/90"
              : "bg-[#eef2f6] hover:bg-[#f4f7f9] shadow-[-2px_-2px_6px_rgba(255,255,255,0.7),_4px_6px_10px_rgba(165,175,190,0.2),_inset_1px_1px_2px_rgba(255,255,255,0.5)] border border-white/50"
        }`}
      />

      <div
        className={`relative z-20 flex flex-col justify-center w-full ${isLarge ? "items-center" : "items-start pl-0.5"}`}
      >
        <span
          className={`${isLarge ? "text-[14px] w-full text-center" : "text-[12px] font-bold"} leading-[14px] transition-colors ${active ? (isDark ? "text-white font-bold drop-shadow-sm" : "text-slate-900 font-bold drop-shadow-sm") : isDark ? "text-white font-bold group-hover:text-white" : "text-slate-900 font-bold group-hover:text-slate-800"} ${active ? (isDark ? "text-white drop-shadow-sm" : "text-slate-800 drop-shadow-sm") : isDark ? "text-gray-400 group-hover:text-white" : "text-slate-500 group-hover:text-slate-800"}`}
        >
          {label}
        </span>
        {!isLarge && subtitle && (
          <span
            className={`text-[8.5px] font-semibold opacity-60 leading-tight transition-colors ${active ? (isDark ? "text-gray-300" : "text-slate-600") : isDark ? "text-gray-500" : "text-slate-400"}`}
          >
            {subtitle}
          </span>
        )}
      </div>

      {!isLarge && rightIcon === "plus" && (
        <Plus
          size={14}
          strokeWidth={3}
          className={`relative z-20 shrink-0 transition-colors ${active ? (isDark ? "text-white drop-shadow-sm" : "text-slate-800 drop-shadow-sm") : isDark ? "text-gray-500 group-hover:text-white" : "text-slate-400 group-hover:text-slate-800"}`}
        />
      )}
      {!isLarge && rightIcon === "check" && (
        <CheckCheck
          size={14}
          strokeWidth={2.5}
          className={`relative z-20 shrink-0 transition-colors ${active ? (isDark ? "text-white" : "text-slate-800") : isDark ? "text-gray-500" : "text-slate-400"}`}
        />
      )}
      {!isLarge && rightIcon === "toggle" && (
        <div
          className={`relative z-20 shrink-0 w-[16px] h-[10px] rounded-full shadow-inner flex items-center ${active ? "bg-orange-500" : isDark ? "bg-[#0a0b0e]" : "bg-[#ced6e0]"} transition-colors px-[1px]`}
        >
          <div
            className={`w-[8px] h-[8px] rounded-full shadow-md bg-white transition-transform ${active ? "translate-x-[6px]" : "translate-x-0"}`}
          />
        </div>
      )}

      {/* Dropdown Glow / Chevron Mock */}
      {hasDropdown && (
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-80 group-hover:opacity-100 transition-opacity z-0">
          <ChevronDown
            size={14}
            className={
              isDark
                ? "text-gray-500 group-hover:text-gray-300"
                : "text-slate-400 group-hover:text-slate-600"
            }
            strokeWidth={3}
          />
          <div
            className={`absolute top-2 w-5 h-2 blur-[5px] rounded-full ${
              glowColor === "orange"
                ? "bg-orange-500"
                : glowColor === "blue"
                  ? "bg-blue-500"
                  : "bg-teal-500"
            }`}
          />
        </div>
      )}
      {(isLarge || active) && (
        <>
          <div
            className={`absolute -bottom-1 left-1/2 -translate-x-1/2 ${isLarge ? "w-24" : "w-16"} h-3 ${glowColor === "orange" ? "bg-orange-500" : glowColor === "blue" ? "bg-blue-500" : "bg-teal-500"} rounded-full blur-[10px] opacity-100 pointer-events-none z-0`}
          />
          <div
            className={`absolute -bottom-[1px] left-1/2 -translate-x-1/2 ${isLarge ? "w-12" : "w-8"} h-[2px] bg-white rounded-full blur-[1px] opacity-80 pointer-events-none z-20`}
          />
        </>
      )}
    </div>
  );
};

export const Dialpad = ({ 
  theme, 
  onCall, 
  onVideoCall, 
  onMessage, 
  contacts,
  showContactPicker,
  setShowContactPicker,
  setEditingContact
}: { 
  theme: "light" | "dark", 
  onCall?: (n: string, color?: string) => void, 
  onVideoCall?: (n: string, color?: string) => void,
  onMessage?: (n: string, color?: string) => void,
  contacts: Array<{ name: string; id: string; color: string; lastSeen: number }>,
  showContactPicker: boolean,
  setShowContactPicker: (show: boolean) => void,
  setEditingContact: (contact: Contact | null) => void
}) => {
  const isDark = theme === "dark";
  const { t } = useI18n();
  const [number, setNumber] = useState("");
  const [selectedContact, setSelectedContact] = useState<ContactProfile | null>(null);
  const [callFilter, setCallFilter] = useState<
    "all" | "incoming" | "outgoing" | "missed"
  >("all");
  
  const { activeCall, setActiveCall, setContacts } = useAppStore();
  const isCalling = !!activeCall;
  const isVideoCall = activeCall?.isVideo || false;
  const isMuted = activeCall?.isMuted || false;
  const isSpeaker = activeCall?.isSpeaker || false;
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let interval: number;
    if (activeCall) {
      interval = window.setInterval(() => {
        setCallDuration(Math.floor((Date.now() - activeCall.startTime) / 1000));
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  const handlePress = (num: string) => {
    if (number.length < 14) setNumber((prev) => prev + num);
  };

  const handleDelete = () => {
    setNumber((prev) => prev.slice(0, -1));
  };

  const handleCallToggle = () => {
    if (isCalling) {
       setActiveCall(null);
    } else {
       const mockCall = {
         callId: `preview_${Date.now()}`,
         direction: 'outgoing' as const,
         status: 'connecting' as const,
         callType: 'audio' as const,
          remotePeer: { peerId: 'manual', displayName: number || t('chat.unknownCaller') },
         localStream: null,
         screenStream: null,
         isMuted: false,
         isSpeaker: false,
         isVideoEnabled: false,
         isVideo: false,
         isRecording: false,
         startTime: Date.now(),
         participants: [],
       };
       setActiveCall(mockCall);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const keys = [
    { num: "1", letters: " " },
    { num: "2", letters: "ABC" },
    { num: "3", letters: "DEF" },
    { num: "4", letters: "GHI" },
    { num: "5", letters: "JKL" },
    { num: "6", letters: "MNO" },
    { num: "7", letters: "PQRS" },
    { num: "8", letters: "TUV" },
    { num: "9", letters: "WXYZ" },
    { num: "*", letters: " " },
    { num: "0", letters: "+" },
    { num: "#", letters: " " },
  ];

  const filteredCalls = MOCK_CALLS.filter(
    (call) => callFilter === "all" || call.type === callFilter,
  );

  return (
    <div
      className={`p-8 rounded-[48px] flex flex-col items-center shadow-2xl relative overflow-hidden h-[540px] w-full ${
        isDark
          ? "bg-[#1a1d24] border border-white/10"
          : "bg-[#eaeff4] border border-white/60"
      }`}
    >
      {/* Background radial soft light */}
      <div
        className={`absolute top-0 right-0 w-[200px] h-[200px] rounded-full blur-[80px] pointer-events-none transition-colors duration-500 ${isDark ? "bg-orange-500/10" : "bg-orange-400/20"}`}
      />

      {isCalling ? (
        <div className="flex flex-col items-center justify-center flex-1 w-full relative z-10 animate-fade-in gap-8">
          <div className="relative">
            <div
              className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold shadow-inner ${isDark ? "bg-[#13151b] text-white" : "bg-[#e2e8f0] text-slate-700"}`}
            >
              <User
                size={48}
                className={isDark ? "text-gray-500" : "text-slate-400"}
              />
            </div>
            {isVideoCall && (
              <div className={`absolute -bottom-1 -right-1 w-10 h-10 rounded-full flex items-center justify-center border-2 ${isDark ? "bg-orange-500 border-[#13151b] text-white" : "bg-orange-500 border-[#e2e8f0] text-white"}`}>
                <Video size={16} />
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            <span
              className={`text-[24px] font-bold tracking-tight ${isDark ? "text-white" : "text-slate-800"}`}
            >
              {number.length > 0 ? number : t('chat.unknownCaller')}
            </span>
            <span
              className={`text-[15px] font-mono font-medium tracking-widest ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
            >
              {formatDuration(callDuration)}
            </span>
          </div>

          <div className="flex gap-6 mt-4">
            <div
              onClick={() => activeCall && setActiveCall({ ...activeCall, isMuted: !isMuted })}
              title={isMuted ? t('chat.unmuteMicrophone') : t('chat.muteMicrophone')}
              className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 shadow-md ${
                isMuted
                  ? isDark
                    ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                    : "bg-slate-800 text-white shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
                  : isDark
                    ? "bg-[#13151b] text-gray-400 hover:bg-white/10 border border-white/5"
                    : "bg-[#f8fafc] text-slate-500 hover:bg-white border border-black/5"
              }`}
            >
              {isMuted ? (
                <MicOff size={22} className="text-current" />
              ) : (
                <Mic size={22} className="text-current" />
              )}
            </div>
            <div
              onClick={() => activeCall && setActiveCall({ ...activeCall, isSpeaker: !isSpeaker })}
              title={isSpeaker ? t('chat.disableSpeaker') : t('chat.enableSpeaker')}
              className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 shadow-md ${
                isSpeaker
                  ? isDark
                    ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                    : "bg-slate-800 text-white shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
                  : isDark
                    ? "bg-[#13151b] text-gray-400 hover:bg-white/10 border border-white/5"
                    : "bg-[#f8fafc] text-slate-500 hover:bg-white border border-black/5"
              }`}
            >
{isSpeaker ? (
                 <div className="w-6 h-6 rounded-full flex items-center justify-center">
                   <Volume2 size={18} className="text-current" />
                 </div>
               ) : (
                 <div className="w-6 h-6 rounded-full flex items-center justify-center">
                   <Volume1 size={18} className="text-current" />
                 </div>
               )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="relative w-full h-12 mb-6 flex items-center justify-center z-10 transition-colors">
            <Search
              size={18}
              className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDark ? "text-gray-500" : "text-slate-400"}`}
            />
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder={t('chat.searchOrDial')}
              className={`w-full h-full bg-transparent border-none outline-none text-center px-10 pr-[60px] text-[20px] font-medium tracking-[0.05em] transition-colors placeholder:text-[14px] ${
                isDark
                  ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] placeholder:text-gray-600"
                  : "text-slate-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] placeholder:text-slate-400"
              }`}
            />
            <button
              onClick={() => setShowContactPicker(true)}
              className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all ${isDark ? "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white" : "bg-black/5 hover:bg-black/10 text-slate-500 hover:text-slate-800"}`}
              title={t('chat.selectContact')}
            >
              <Users size={18} />
            </button>
          </div>

          {number.length === 0 ? (
            <div className="w-full relative z-10 h-[360px] flex flex-col">
              <div className="flex items-center justify-between px-2 mb-4">
                <div
                  className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isDark ? "text-gray-500" : "text-slate-400"}`}
                >
                  {t('chat.recent')}
                </div>
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 shrink-0" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
                  {[
                    { id: "all", label: t('chat.all') },
                    { id: "incoming", label: t('chat.incomingShort') },
                    { id: "outgoing", label: t('chat.outgoingShort') },
                    { id: "missed", label: t('chat.missed') },
                  ].map((tab) => (
                    <div
                      key={tab.id}
                      onClick={() => setCallFilter(tab.id as any)}
                      className={`text-[10px] font-bold uppercase cursor-pointer transition-colors px-2 py-1 rounded-md shrink-0 ${
                        callFilter === tab.id
                          ? isDark
                            ? "bg-white/10 text-white"
                            : "bg-black/10 text-slate-800"
                          : isDark
                            ? "text-gray-500 hover:text-gray-300"
                            : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {tab.label}
                    </div>
                  ))}
                </div>
              </div>
              <div
                className={`flex flex-col gap-1.5 flex-1 overflow-y-auto ${isDark ? "scrollbar-dark" : "scrollbar-light"}`}
              >
                {filteredCalls.map((call) => (
                  <div
                    key={call.id}
                    onClick={() => {
                        setSelectedContact({
                           id: `hash_${call.id}`, 
                           name: call.name, 
                           color: call.name === "Unknown" ? "from-gray-500 to-gray-600" : "from-blue-400 to-indigo-500",
                           callInfo: {
                               time: call.time,
                               type: call.type as any,
                               duration: "10:32"
                           }
                        });
                    }}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors group ${isDark ? "hover:bg-white/5 text-gray-300" : "hover:bg-black/5 text-slate-700"}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 ${
                        call.type === "missed"
                          ? isDark
                            ? "bg-red-500/10 text-red-400"
                            : "bg-red-500/10 text-red-600"
                          : isDark
                            ? "bg-white/5 text-gray-400"
                            : "bg-black/5 text-slate-500"
                      }`}
                    >
                      {call.type === "incoming" && <PhoneIncoming size={16} />}
                      {call.type === "outgoing" && <PhoneOutgoing size={16} />}
                      {call.type === "missed" && <PhoneMissed size={16} />}
                    </div>
                    <div className="flex-1 flex flex-col min-w-0 pr-2">
                      <span
                        className={`text-[14px] font-bold truncate leading-snug ${call.type === "missed" ? (isDark ? "text-red-400" : "text-red-600") : isDark ? "text-white" : "text-slate-800"}`}
                      >
                        {call.name}
                      </span>
                      <div className="flex gap-2 items-center">
                        <span
                          className={`text-[11px] font-semibold tracking-wide ${isDark ? "text-orange-400" : "text-orange-600"}`}
                        >
                          {call.time}
                        </span>
                        {call.duration && (
                          <span
                            className={`text-[10px] font-medium ${isDark ? "text-gray-500" : "text-slate-400"}`}
                          >
                            • {call.duration}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* If name indicates it's an UNKNOWN or phone number, show Add to Contacts option */}
                    {(call.name.startsWith("+") || call.name === "Unknown") && (
                       <div 
                          className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity active:scale-95 ${isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/5 hover:bg-black/10 text-slate-700"}`}
                         onClick={(e) => {
                             e.stopPropagation();
                              toast.info(t('toast.contact'), { description: t('chat.creatingContact', { name: call.name }) });
                          }}
                         title={t('contacts.addContact')}
                       >
                          <UserPlus size={14} />
                       </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-x-6 gap-y-5 relative z-10 w-full justify-items-center h-[360px]">
              {keys.map((k) => (
                <div
                  key={k.num}
                  onClick={() => handlePress(k.num)}
                  className={`w-[72px] h-[72px] rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:scale-[1.05] active:scale-[0.92] select-none group ${
                    isDark
                      ? "bg-[#13151b] shadow-[0_8px_16px_rgba(0,0,0,0.4),_inset_0_1.5px_2px_rgba(255,255,255,0.08),_inset_0_-2px_4px_rgba(0,0,0,0.8)] border border-white/[0.04] active:shadow-[inset_0_10px_20px_rgba(0,0,0,0.9),_inset_0_2px_4px_rgba(0,0,0,0.9)]"
                      : "bg-[#eaeff4] shadow-[-6px_-6px_12px_rgba(255,255,255,0.9),_8px_8px_16px_rgba(165,175,190,0.5),_inset_2px_2px_4px_rgba(255,255,255,1)] border border-white/80 active:shadow-[inset_4px_4px_12px_rgba(165,175,190,0.5),_inset_-3px_-3px_8px_rgba(255,255,255,0.9)]"
                  }`}
                >
                  <span
                    className={`text-[26px] font-semibold leading-none transition-colors duration-200 ${isDark ? "text-gray-200 group-hover:text-white" : "text-slate-700 group-hover:text-slate-900 group-active:scale-95"}`}
                  >
                    {k.num}
                  </span>
                  {k.letters.trim() && (
                    <span
                      className={`text-[9px] mt-[3px] font-bold tracking-widest transition-colors duration-200 ${isDark ? "text-orange-500/70 group-hover:text-orange-400" : "text-orange-600/70 group-hover:text-orange-700 group-active:scale-95"}`}
                    >
                      {k.letters}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div
        className={`flex items-center justify-between w-[240px] mt-auto relative z-10`}
      >
        <div
           onClick={() => {
             if (number.length > 0) toast.success(t('toast.contactAdded'), { description: t('chat.contactAddedDescription', { number }) });
           }}
          className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 active:scale-90 ${
            number.length > 0
              ? (isDark ? "opacity-80 hover:opacity-100 text-gray-400 hover:text-white" : "opacity-80 hover:opacity-100 text-slate-500 hover:text-slate-700")
              : "opacity-0 pointer-events-none"
          } ${isCalling ? "pointer-events-none opacity-0" : ""}`}
          title={t('contacts.addContact')}
        >
          <UserPlus size={22} className="text-current" />
        </div>
        {/* Spacer for centering the call button visually */}
        <div
          onClick={handleCallToggle}
          title={isCalling ? t('chat.endCall') : t('chat.startCall')}
          className={`w-[76px] h-[76px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-[1.08] active:scale-95 hover:rotate-3 shadow-xl ${
            isCalling
              ? "bg-gradient-to-br from-red-500 to-red-600 shadow-[0_12px_24px_rgba(239,68,68,0.3),_inset_0_2px_4px_rgba(255,255,255,0.3)] active:shadow-[inset_0_8px_16px_rgba(0,0,0,0.4)]"
              : isDark
                ? "bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_12px_24px_rgba(249,115,22,0.3),_inset_0_2px_4px_rgba(255,255,255,0.3)] active:shadow-[inset_0_8px_16px_rgba(0,0,0,0.4)]"
                : "bg-gradient-to-br from-orange-400 to-orange-500 shadow-[0_12px_24px_rgba(249,115,22,0.3),_inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[inset_0_6px_12px_rgba(0,0,0,0.3)]"
          }`}
        >
          <Phone
            className={`text-white drop-shadow-sm fill-white/20 transition-transform ${isCalling ? "rotate-[135deg]" : ""}`}
            size={28}
            strokeWidth={2}
          />
        </div>
        <div
          onClick={handleDelete}
          className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 active:scale-90 opacity-80 hover:opacity-100 ${
            isDark
              ? "text-gray-400 hover:text-white"
              : "text-slate-500 hover:text-slate-700"
          } ${isCalling ? "pointer-events-none opacity-0" : ""}`}
        >
          {number.length > 0 && !isCalling ? (
            <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
              <path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z" />
            </svg>
          ) : null}
        </div>
      </div>
      
        <ContactProfileModal
           contact={selectedContact}
           theme={theme}
           onClose={() => setSelectedContact(null)}
           onCall={() => {
               if (onCall && selectedContact) onCall(selectedContact.name, selectedContact.color);
               setSelectedContact(null);
           }}
           onVideoCall={() => {
               if (onVideoCall && selectedContact) onVideoCall(selectedContact.name, selectedContact.color);
               setSelectedContact(null);
           }}
           onMessage={() => {
               if (onMessage && selectedContact) onMessage(selectedContact.name, selectedContact.color);
               setSelectedContact(null);
           }}
           onDelete={() => {
                toast.info(t('toast.contact'), { description: t('chat.deletedCallHistory', { name: selectedContact?.name || "" }) });
                setSelectedContact(null);
            }}
           onEdit={() => {
                   if (selectedContact) {
                    setEditingContact(selectedContact as unknown as Contact);
                  }
                 setSelectedContact(null);
             }}
           onBlock={() => {
                  toast.warning(t('toast.contact'), { description: t('chat.blockedContact', { name: selectedContact?.name || "" }) });
                 setSelectedContact(null);
             }}
           onToggleFavorite={(id) => {
             setContacts(prev => prev.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c));
           }}
       />
      
      {/* Contact Picker Modal */}
      {showContactPicker && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className={`w-full max-w-[340px] rounded-[32px] p-6 shadow-2xl relative ${isDark ? "bg-[#1a1d24] border border-white/10" : "bg-white border border-black/10"}`}
          >
            <div 
              className={`absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/5 hover:bg-black/10 text-slate-800"}`}
              onClick={() => setShowContactPicker(false)}
            >
              <X size={18} />
            </div>

            <div className="flex flex-col items-center mb-4 mt-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600"}`}>
                <Users size={32} />
              </div>
              <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{t('chat.selectContact')}</h3>
              <p className={`text-xs text-center mt-2 ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('chat.chooseContact')}</p>
            </div>

            <div className={`flex flex-col gap-2 max-h-[300px] overflow-y-auto ${isDark ? "scrollbar-dark" : "scrollbar-light"}`}>
              {contacts.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setNumber(c.name);
                    setShowContactPicker(false);
                  }}
                  className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${c.color} text-white font-bold text-lg shadow-md shrink-0`}>
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 flex flex-col min-w-0">
                    <span className={`font-bold truncate ${isDark ? "text-gray-100" : "text-slate-800"}`}>{c.name}</span>
                    <span className={`font-mono text-[9px] tracking-wider truncate ${isDark ? "text-gray-500" : "text-slate-400"}`}>{c.id}</span>
                  </div>
                  <Phone className={`w-5 h-5 shrink-0 ${isDark ? "text-orange-400" : "text-orange-600"}`} />
                </div>
              ))}
              {contacts.length === 0 && (
                <div className={`text-center py-8 ${isDark ? "text-gray-500" : "text-slate-500"}`}>
                  {t('chat.noContactsAvailable')} {t('chat.addContactsHint')}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
