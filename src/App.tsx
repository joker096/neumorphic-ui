
import { MeshRadar } from "./components/MeshRadar";
import { SystemPulsePlayer } from "./components/SystemPulsePlayer";
import { ContactsView } from "./components/ContactsView";
import { SettingsView } from "./components/SettingsView";
import { RecordingsScreen } from "./components/RecordingsScreen";
import { ContactProfileModal, ContactProfile } from "./components/ContactProfileModal";
import { ContactCreateEditModal } from "./components/ContactCreateEditModal";
import { MorseDecoder, encodeMorse, isMorseCode } from "./components/MorseDecoder";
import { Tooltip } from "./components/Tooltip";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  X,
  Search,
  CheckCheck,
  Mic,
  MicOff,
  BellOff,
  Settings,
  MessageCircle,
  Bell,
  Phone,
  Bookmark,
  Archive,
  Users,
  Megaphone,
  Shield,
  Target,
  Cloud,
  Globe,
  Activity,
  Eye,
  User,
  Star,
  Trash2,
  UserPlus,
  PhoneForwarded,
  Moon,
  Battery,
  Volume1,
  Volume2,
  VolumeX,
  ChevronRight,
  Check,
  ChevronDown,
  Play,
  Video,
  Music,
  Pause,
  SkipBack,
  SkipForward,
  Minimize2,
  Maximize2,
  FolderPlus,
  FilePlus,
  ListMusic,
  List,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Sun,
  QrCode,
  Scan,
  MoreVertical,
  Hash,
  Bot,
  Clock,
  Lock,
  ListFilter,
   Smile
 } from "lucide-react";

/**
 * Custom SVG Icon to precisely match the "Eucive" double-chevron diamond.
 */
const CustomDiamondIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 7.5 L16.5 12 L12 16.5 L7.5 12 Z" />
    <path d="M9.5 4.5 L12 2 L14.5 4.5" />
    <path d="M9.5 19.5 L12 22 L14.5 19.5" />
  </svg>
);

// --- Light Neumorphic Element Pieces ---

const NeumorphicKnob = () => (
  <div className="w-[18px] h-[18px] rounded-full bg-[#eaeff4] shadow-[-2px_-2px_5px_rgba(255,255,255,0.9),_2px_2px_5px_rgba(165,175,190,0.5),_inset_1px_1px_2px_rgba(255,255,255,0.8),_inset_-1px_-1px_2px_rgba(165,175,190,0.1)] shrink-0" />
);

const GlowingKnobLine = ({ count }: { count?: number }) => (
  <div className="w-[20px] h-[20px] rounded-full bg-[#eaeff4] shadow-[0_0_15px_rgba(255,160,80,0.8),_-2px_-2px_5px_rgba(255,255,255,0.9),_2px_2px_5px_rgba(165,175,190,0.5),_inset_1px_1px_2px_rgba(255,255,255,0.8)] shrink-0 flex items-center justify-center relative">
    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-300 via-orange-400 to-orange-200 opacity-90 shadow-[inset_0_-2px_4px_rgba(234,88,12,0.5)]" />
    {count && (
      <span className="relative z-10 text-[10px] font-bold text-orange-950 pb-[0.5px] pr-[0.5px]">
        {count}
      </span>
    )}
  </div>
);

const GlowingPlusLight = () => (
  <div className="relative flex items-center justify-center p-1 w-6 h-6 shrink-0">
    <div className="absolute inset-0 bg-orange-400/50 blur-[14px] rounded-full scale-[2.2]" />
    <Plus
      size={20}
      strokeWidth={2}
      className="relative z-10 text-orange-50 drop-shadow-[0_0_4px_rgba(249,115,22,0.9)]"
    />
  </div>
);

const LightPillButton = ({ title, subtitle, icon: Icon, badge }: any) => {
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
      <div className="flex flex-col -space-y-[1px] mt-0.5 mt-1 pointer-events-none overflow-hidden pr-3">
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

const LightSearchBar = ({ searchQuery, onSearchChange, placeholder }: { searchQuery?: string, onSearchChange?: (val: string) => void, placeholder?: string }) => {
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

const DarkPillButton = ({ title, subtitle, icon: Icon, badge }: any) => {
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

const DarkSearchBar = ({ searchQuery, onSearchChange, placeholder }: { searchQuery?: string, onSearchChange?: (val: string) => void, placeholder?: string }) => {
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
const ActionCircleButton = ({
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

const PillButton = ({
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
          className={`${isLarge ? "text-[14px] w-full text-center" : "text-[12px] font-bold"} leading-[14px] transition-colors ${active ? (isDark ? "text-white font-bold drop-shadow-sm" : "text-slate-900 font-bold drop-shadow-sm") : isDark ? "text-white font-bold group-hover:text-white" : "text-slate-900 font-bold group-hover:text-slate-800"} leading-[14px] transition-colors ${active ? (isDark ? "text-white drop-shadow-sm" : "text-slate-800 drop-shadow-sm") : isDark ? "text-gray-400 group-hover:text-white" : "text-slate-500 group-hover:text-slate-800"}`}
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

const Dialpad = ({ 
  theme, 
  onCall, 
  onMessage, 
  contacts,
  showContactPicker,
  setShowContactPicker,
  setEditingContact
}: { 
  theme: "light" | "dark", 
  onCall?: (n: string, color?: string) => void, 
  onMessage?: (n: string, color?: string) => void,
  contacts: Array<{ name: string; id: string; color: string; lastSeen: number }>,
  showContactPicker: boolean,
  setShowContactPicker: (show: boolean) => void,
  setEditingContact: (contact: Contact | null) => void
}) => {
  const isDark = theme === "dark";
  const [number, setNumber] = useState("");
  const [selectedContact, setSelectedContact] = useState<ContactProfile | null>(null);
  const [callFilter, setCallFilter] = useState<
    "all" | "incoming" | "outgoing" | "missed"
  >("all");
  
  const { activeCall, setActiveCall } = useAppStore();
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
       setActiveCall({
          number: number || "Unknown",
          startTime: Date.now(),
          isMuted: false,
          isSpeaker: false
       });
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
              {number.length > 0 ? number : "Unknown Caller"}
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
              title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
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
              title={isSpeaker ? "Disable Speaker" : "Enable Speaker"}
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
              placeholder="Search or dial..."
              className={`w-full h-full bg-transparent border-none outline-none text-center px-10 pr-[60px] text-[20px] font-medium tracking-[0.05em] transition-colors placeholder:text-[14px] ${
                isDark
                  ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] placeholder:text-gray-600"
                  : "text-slate-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] placeholder:text-slate-400"
              }`}
            />
            <button
              onClick={() => setShowContactPicker(true)}
              className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all ${isDark ? "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white" : "bg-black/5 hover:bg-black/10 text-slate-500 hover:text-slate-800"}`}
              title="Select Contact"
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
                  Recent
                </div>
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 shrink-0" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
                  {[
                    { id: "all", label: "All" },
                    { id: "incoming", label: "In" },
                    { id: "outgoing", label: "Out" },
                    { id: "missed", label: "Missed" },
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
                         className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity click:scale-95 ${isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/5 hover:bg-black/10 text-slate-700"}`}
                         onClick={(e) => {
                             e.stopPropagation();
                             toast.info("Contact", { description: `Creating new contact for ${call.name}` });
                          }}
                         title="Add to Contacts"
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
             if (number.length > 0) toast.success("Contact Added", { description: `Added ${number} to contacts!` });
           }}
          className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 active:scale-90 ${
            number.length > 0
              ? (isDark ? "opacity-80 hover:opacity-100 text-gray-400 hover:text-white" : "opacity-80 hover:opacity-100 text-slate-500 hover:text-slate-700")
              : "opacity-0 pointer-events-none"
          } ${isCalling ? "pointer-events-none opacity-0" : ""}`}
          title="Add to Contacts"
        >
          <UserPlus size={22} className="text-current" />
        </div>
        {/* Spacer for centering the call button visually */}
        <div
          onClick={handleCallToggle}
          title={isCalling ? "End Call" : "Start Call"}
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
          onMessage={() => {
              if (onMessage && selectedContact) onMessage(selectedContact.name, selectedContact.color);
              setSelectedContact(null);
          }}
          onDelete={() => {
               toast.info("Contact", { description: `Deleted call history for ${selectedContact?.name}` });
               setSelectedContact(null);
           }}
          onEdit={() => {
                if (selectedContact) {
                  setEditingContact(selectedContact);
                }
                setSelectedContact(null);
            }}
          onBlock={() => {
                toast.warning("Contact", { description: `Blocked number/contact: ${selectedContact?.name}` });
                setSelectedContact(null);
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
              <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>Select Contact</h3>
              <p className={`text-xs text-center mt-2 ${isDark ? "text-gray-400" : "text-slate-500"}`}>Choose a contact to call or message.</p>
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
                  No contacts available. Add contacts from the Identity tab.
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

// --- Central Hub Interactive Toggle Icons ---

const HubToggleIcon = ({ active, onClick, icon: Icon, color, isDark, title }: any) => {
  let activeColor = "";
  let activeBorder = "";
  if (color === "purple") {
    activeColor = isDark
      ? "text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.9)]"
      : "text-purple-600 drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]";
    activeBorder = isDark ? "border-purple-500/40" : "border-purple-400/60";
  }
  if (color === "blue") {
    activeColor = isDark
      ? "text-orange-400 drop-shadow-[0_0_6px_rgba(251,146,60,0.9)]"
      : "text-orange-600 drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]";
    activeBorder = isDark ? "border-orange-500/40" : "border-orange-400/60";
  }
  if (color === "green") {
    activeColor = isDark
      ? "text-green-400 drop-shadow-[0_0_6px_rgba(74,222,128,0.9)]"
      : "text-emerald-500 drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]";
    activeBorder = isDark ? "border-green-500/40" : "border-emerald-400/60";
  }

  const idleColor = isDark ? "text-gray-500" : "text-slate-400";

  return (
    <div
      onClick={onClick}
      title={title}
      className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${
        active
          ? isDark
            ? `bg-[#1a1d24] shadow-[inset_0_4px_8px_rgba(0,0,0,0.8),_inset_0_-1px_2px_rgba(255,255,255,0.05)] ${activeBorder}`
            : `bg-[#eaeff4] shadow-[inset_3px_3px_6px_rgba(165,175,190,0.5),_inset_-2px_-2px_4px_rgba(255,255,255,1)] ${activeBorder}`
          : isDark
            ? "hover:bg-white/5 border border-transparent shadow-[0_4px_8px_rgba(0,0,0,0.4)] hover:shadow-[0_6px_12px_rgba(0,0,0,0.5)] bg-[#13151b]"
            : "hover:bg-white border border-transparent shadow-[0_2px_6px_rgba(165,175,190,0.3)] hover:shadow-[0_4px_8px_rgba(165,175,190,0.4)] bg-[#f4f7f9]"
      }`}
    >
      <Icon
        size={active ? 20 : 18}
        className={`transition-all duration-300 ${active ? activeColor : idleColor}`}
        strokeWidth={active ? 2.5 : 1.75}
      />
    </div>
  );
};

// --- Central Radial Menu Infographic Component ---

interface RadialItem { id: string; angle: number; title: string; subtitle: string; icon: any; }

const RadialMenu = ({ theme, items, badges, centerTitle, centerSubtitle, onCenterClick, onItemClick }: { theme: "light" | "dark"; items: RadialItem[]; centerTitle: string; centerSubtitle: string; onCenterClick?: () => void; onItemClick?: (id: string) => void; badges?: Record<string, number>; }) => {
  const isDark = theme === "dark";
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const store = useAppStore();

  // Additional Hub States (from persistent store)
  const volume = Math.round(store.soundVolume * 100);
  const dnd = store.radialDnd;
  const proxy = store.radialProxy;
  const energy = store.radialEnergy;

  const containerRef = useRef<HTMLDivElement>(null);

  // Infographic layout calculations
  const cx = 400;
  const cy = 350;
  const hubR = 110;
  const arcR = 175;
  const bubbleR = 255;
  const textR = 340;
  const volR = hubR + 35; // The interactive dashed line radius

  // Colors adapted to theme aesthetics
  const arcStrokeColor = isDark ? "#374151" : "#cbd5e1";
  const dotFill = isDark ? "#13151b" : "#eaeff4";
  const dotStroke = isDark ? "#f97316" : "#14b8a6"; // orange vs teal
  const textTitleColor = isDark ? "text-gray-300" : "text-slate-800";

  const handleVolumeInteraction = (e: React.PointerEvent<SVGPathElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 550 / rect.height;

    const svgX = (e.clientX - rect.left) * scaleX;
    const svgY = (e.clientY - rect.top) * scaleY;

    const dx = svgX - cx;
    const dy = svgY - cy;

    const angle = Math.atan2(dy, dx);

    let newVol = 0;
    if (angle < 0) {
      newVol = dx < 0 ? 0 : 100;
    } else {
      newVol = (1 - angle / Math.PI) * 100;
    }

    store.setSoundVolume(Math.min(1, Math.max(0, Math.round(newVol) / 100)));
  };

  return (
    <div
      ref={containerRef}
      className="relative w-[800px] h-[550px] overflow-visible select-none"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {/* Background SVG for Connector Arcs and Lines */}
      <svg
        className="absolute inset-0 w-full h-full z-0 pointer-events-none"
        viewBox="0 0 800 550"
      >
        <motion.path
          d={`M ${cx - hubR - 5} ${cy} L ${cx - arcR} ${cy} A ${arcR} ${arcR} 0 0 1 ${cx + arcR} ${cy} L ${cx + hubR + 5} ${cy}`}
          fill="none"
          stroke={arcStrokeColor}
          strokeWidth="3"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: isOpen ? 1 : 0, opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />

        {items.map((item, i) => {
          const rad = (item.angle * Math.PI) / 180;
          const arcX = cx + arcR * Math.cos(rad);
          const arcY = cy - arcR * Math.sin(rad);
          const bX = cx + bubbleR * Math.cos(rad);
          const bY = cy - bubbleR * Math.sin(rad);

          return (
            <g key={`lines-${item.id}`}>
              <motion.line
                x1={arcX}
                y1={arcY}
                x2={bX}
                y2={bY}
                stroke={arcStrokeColor}
                strokeWidth="3"
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{
                  opacity: isOpen ? 1 : 0,
                  pathLength: isOpen ? 1 : 0,
                }}
                transition={{
                  duration: 0.4,
                  delay: isOpen ? 0.2 + i * 0.05 : 0,
                }}
              />
              <motion.circle
                cx={arcX}
                cy={arcY}
                r="7"
                fill={dotFill}
                stroke={dotStroke}
                strokeWidth="3.5"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: isOpen ? 1 : 0, opacity: isOpen ? 1 : 0 }}
                transition={{
                  duration: 0.3,
                  delay: isOpen ? 0.1 + i * 0.05 : 0,
                }}
                style={{ transformOrigin: `${arcX}px ${arcY}px` }}
              />
            </g>
          );
        })}

        {/* Volume Area Base Track (Lower Arc) */}
        <path
          d={`M ${cx - volR} ${cy} A ${volR} ${volR} 0 0 0 ${cx + volR} ${cy}`}
          fill="none"
          stroke={isDark ? "#2d3340" : "#cbd5e1"}
          strokeWidth="4"
          strokeDasharray="6 6"
          strokeLinecap="round"
          className="transition-all duration-300"
        />

        {/* Active Volume Track */}
        {volume > 0 && (
          <path
            d={`M ${cx - volR} ${cy} A ${volR} ${volR} 0 0 0 ${cx + volR * Math.cos(Math.PI - (volume / 100) * Math.PI)} ${cy + volR * Math.sin(Math.PI - (volume / 100) * Math.PI)}`}
            fill="none"
            stroke={isDark ? "#f59e0b" : "#0d9488"} // Amber / Teal
            strokeWidth="4"
            strokeDasharray="6 6"
            strokeLinecap="round"
            className="transition-all duration-75"
          />
        )}
      </svg>

      {/* SVG Interactive Catching Path for Volume Drag -> Placed outside pointer-events-none svg block for capturing */}
      <svg
        className="absolute inset-0 w-full h-full z-10"
        viewBox="0 0 800 550"
      >
        <path
          d={`M ${cx - volR} ${cy} A ${volR} ${volR} 0 0 0 ${cx + volR} ${cy}`}
          fill="none"
          stroke="transparent"
          strokeWidth="50"
          className="cursor-pointer touch-none"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            handleVolumeInteraction(e);
          }}
          onPointerMove={(e) => {
            if (e.buttons > 0) handleVolumeInteraction(e);
          }}
          onPointerUp={(e) => {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }}
        />
      </svg>

      {/* Volume Value Text & Icons & Track Knob */}
      <div
        className={`absolute flex items-center justify-center w-9 h-9 rounded-full transition-all cursor-pointer z-20 ${isDark ? "text-gray-500 hover:bg-red-500/20 hover:text-red-400" : "text-slate-400 hover:bg-red-500/15 hover:text-red-600"}`}
        style={{ left: cx - volR - 41, top: cy - 18 }}
        title={t('hub.volumeMin')}
        onClick={(e: any) => { e.stopPropagation(); store.setSoundVolume(0); }}
      >
        <VolumeX size={18} />
      </div>
      <div
        className={`absolute flex items-center justify-center w-9 h-9 rounded-full transition-all cursor-pointer z-20 ${isDark ? "text-gray-500 hover:bg-emerald-500/20 hover:text-emerald-400" : "text-slate-400 hover:bg-emerald-500/15 hover:text-emerald-600"}`}
        style={{ left: cx + volR + 13, top: cy - 18 }}
        title={t('hub.volumeMax')}
        onClick={(e: any) => { e.stopPropagation(); store.setSoundVolume(1); }}
      >
        <Volume2 size={18} />
      </div>
      <div
        className={`absolute text-[10px] uppercase tracking-widest font-bold z-10 pointer-events-none ${isDark ? "text-amber-500/80 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" : "text-teal-600/90"}`}
        style={{
          left: cx,
          top: cy + volR + 18,
          transform: "translate(-50%, 0)",
        }}
      >
        Vol // {volume}%
      </div>

      <div
        className="absolute rounded-full pointer-events-none transition-transform duration-75"
        style={{
          left: cx + volR * Math.cos(Math.PI - (volume / 100) * Math.PI),
          top: cy + volR * Math.sin(Math.PI - (volume / 100) * Math.PI),
          width: "16px",
          height: "16px",
          backgroundColor: isDark ? "#f59e0b" : "#0d9488",
          border: `2.5px solid ${isDark ? "#13151b" : "#eaeff4"}`,
          transform: "translate(-50%, -50%)",
          zIndex: 15,
          boxShadow: isDark
            ? "0 0 12px rgba(245,158,11,0.6)"
            : "0 4px 6px rgba(13,148,136,0.3)",
        }}
      />

      {/* Floating Bubble Nodes */}
      <AnimatePresence>
        {items.map((item, i) => {
          const rad = (item.angle * Math.PI) / 180;
          const bX = cx + bubbleR * Math.cos(rad);
          const bY = cy - bubbleR * Math.sin(rad);
          const textX = cx + textR * Math.cos(rad);
          const offsetX = item.angle === 180 ? -10 : item.angle === 0 ? 10 : 0;
          const textY = cy - textR * Math.sin(rad);

          const Icon = item.icon;

          return (
            <React.Fragment key={`html-${item.id}`}>
              <motion.div onClick={() => onItemClick && onItemClick(item.id.toString())} 
                title={`${item.title} - ${item.subtitle}`}
                initial={{ left: cx,
                  top: cy,
                  opacity: 0,
                  scale: 0.2,
                  x: "-50%",
                  y: "-50%",
                }}
                animate={{
                  left: isOpen ? bX : cx,
                  top: isOpen ? bY : cy,
                  opacity: isOpen ? 1 : 0,
                  scale: isOpen ? 1 : 0.2,
                  x: "-50%",
                  y: "-50%",
                }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: isOpen ? i * 0.05 : 0,
                }}
                className={`absolute flex items-center justify-center rounded-full cursor-pointer z-20 transition-all duration-300 ${
                  isDark
                    ? "bg-[#13151b] shadow-[0_12px_24px_rgba(0,0,0,0.5),_inset_0_1.5px_2px_rgba(255,255,255,0.08),_inset_0_-2px_4px_rgba(0,0,0,0.8)] border border-white/[0.04] hover:border-orange-500/30 hover:scale-105 hover:shadow-[0_16px_32px_rgba(249,115,22,0.3),_inset_0_1.5px_2px_rgba(255,255,255,0.1),_inset_0_-2px_4px_rgba(0,0,0,0.8)] active:scale-95 active:shadow-[inset_0_8px_16px_rgba(0,0,0,0.9)]"
                    : "bg-[#eaeff4] shadow-[-6px_-6px_12px_rgba(255,255,255,0.9),_8px_8px_16px_rgba(165,175,190,0.5),_inset_2px_2px_4px_rgba(255,255,255,1)] border border-white/80 hover:border-orange-400 hover:scale-[1.05] hover:shadow-[-8px_-8px_16px_rgba(255,255,255,1),_10px_10px_20px_rgba(249,115,22,0.3),_inset_2px_2px_4px_rgba(255,255,255,1)] active:scale-95 active:shadow-[inset_3px_3px_8px_rgba(165,175,190,0.4),_inset_-2px_-2px_4px_rgba(255,255,255,1)]"
                }`}
                style={{
                  width: "74px",
                  height: "74px",
                  pointerEvents: isOpen ? "auto" : "none",
                }}
              >
                {badges && badges[item.id] > 0 && (
                  <div className={`absolute -top-1 -right-2 w-[22px] h-[22px] bg-gradient-to-tr from-orange-500 to-orange-400 rounded-full shadow-[0_0_12px_rgba(249,115,22,0.7),_inset_0_2px_3px_rgba(255,255,255,0.4)] border border-white/20 flex items-center justify-center`}>
                    <span className="text-[11px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">{badges[item.id]}</span>
                  </div>
                )}
                <Icon
                  size={28}
                  className={
                    isDark
                      ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]"
                      : "text-orange-600 drop-shadow-[0_1px_1px_rgba(255,255,255,1)]"
                  }
                  strokeWidth={1.5}
                />
              </motion.div>

              <motion.div
                initial={{
                  left: cx,
                  top: cy,
                  opacity: 0,
                  scale: 0.5,
                  x: "-50%",
                  y: "-50%",
                }}
                animate={{
                  left: isOpen ? textX + offsetX : cx,
                  top: isOpen ? textY : cy,
                  opacity: isOpen ? 1 : 0,
                  scale: isOpen ? 1 : 0.5,
                  x: "-50%",
                  y: "-50%",
                }}
                transition={{
                  duration: 0.3,
                  delay: isOpen ? 0.2 + i * 0.05 : 0,
                }}
                className={`absolute w-[180px] text-center pointer-events-none flex flex-col items-center z-10 drop-shadow-md`}
              >
                <span
                  className={`text-[12px] font-bold uppercase tracking-widest ${textTitleColor}`}
                >
                  {item.title}
                </span>
                <span
                  className={`text-[10px] mt-1 font-medium tracking-wide ${isDark ? "text-gray-500" : "text-slate-500"}`}
                >
                  {item.subtitle}
                </span>
              </motion.div>
            </React.Fragment>
          );
        })}
      </AnimatePresence>

      {/* The Central Hub Dome */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "Close Menu" : "Open Hub Menu"}
        className={`absolute rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 active:scale-[0.96] z-30 group ${
          isDark
            ? `bg-[#13151b] border border-white/5 ${isOpen ? "shadow-[inset_0_12px_24px_rgba(0,0,0,0.9),_inset_0_4px_8px_rgba(0,0,0,0.9)] bg-[#101216]" : "shadow-[0_20px_40px_rgba(0,0,0,0.6),_inset_0_2px_4px_rgba(255,255,255,0.1),_inset_0_-4px_8px_rgba(0,0,0,0.9)] hover:shadow-[0_24px_48px_rgba(249,115,22,0.15),_inset_0_2px_4px_rgba(255,255,255,0.15),_inset_0_-4px_8px_rgba(0,0,0,0.9)]"}`
            : `bg-[#eaeff4] border border-white/80 ${isOpen ? "shadow-[-4px_-4px_10px_rgba(255,255,255,0.9),_6px_8px_16px_rgba(165,175,190,0.55),_inset_6px_6px_14px_rgba(165,175,190,0.4)] bg-[#e2e8f0]" : "shadow-[-16px_-16px_36px_rgba(255,255,255,0.9),_20px_24px_50px_rgba(165,175,190,0.6),_inset_3px_3px_5px_rgba(255,255,255,1)] hover:shadow-[-20px_-20px_45px_rgba(255,255,255,1),_24px_28px_60px_rgba(165,175,190,0.6),_inset_3px_3px_5px_rgba(255,255,255,1)]"}`
        }`}
        style={{
          left: cx,
          top: cy,
          width: hubR * 2,
          height: hubR * 2,
          transform: "translate(-50%, -50%)",
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close-icon"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <X
                size={56}
                className={`transition-all ${isDark ? "text-orange-400 opacity-80 group-hover:text-amber-400" : "text-orange-600 opacity-80 group-hover:text-emerald-500"}`}
                strokeWidth={1}
              />
            </motion.div>
          ) : (
            <motion.div
              key="hub-content"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center w-full"
            >
              <div className="flex flex-col items-center justify-center w-full min-h-[70px]">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-lg cursor-pointer relative z-40 overflow-hidden shrink-0 ${
                    isDark
                      ? "bg-gradient-to-tr from-[#1f222a] to-[#2a2d36] border-[2px] border-orange-500/30 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),_0_0_15px_rgba(249,115,22,0.4)]"
                      : "bg-gradient-to-tr from-[#f4f7f9] to-white border-[2px] border-orange-400 shadow-[inset_2px_2px_4px_rgba(255,255,255,1),_0_0_15px_rgba(249,115,22,0.3)]"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                    if (onCenterClick) {
                      onCenterClick();
                    }
                  }}
                >
                  <CustomDiamondIcon className={`${isDark ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]" : "text-orange-600 drop-shadow-[0_2px_4px_rgba(249,115,22,0.3)]"}`} />
                </div>
              </div>

              <div
                className={`text-[10px] font-bold tracking-[0.1em] text-center px-2 uppercase leading-tight ${isDark ? "text-white" : "text-slate-800"}`}
              >
                {centerTitle}
              </div>
              <span
                className={`text-[9px] mt-0.5 font-bold tracking-[0.1em] uppercase truncate max-w-[120px] ${isDark ? "text-orange-400" : "text-teal-600"}`}
              >
                {centerSubtitle}
              </span>

              {/* Internal Setting Toggles */}
              <div className="flex gap-2.5 mt-3 z-40 bg-transparent scale-90">
                <HubToggleIcon
                  active={dnd}
                  onClick={(e: any) => {
                    e.stopPropagation();
                    store.setRadialDnd(!dnd);
                  }}
                  icon={Moon}
                  color="purple"
                  isDark={isDark}
                  title={dnd ? t('hub.dndActive') : t('hub.dnd')}
                />
                <HubToggleIcon
                  active={proxy}
                  onClick={(e: any) => {
                    e.stopPropagation();
                    store.setRadialProxy(!proxy);
                  }}
                  icon={Shield}
                  color="blue"
                  isDark={isDark}
                  title={proxy ? t('hub.proxyActive') : t('hub.proxy')}
                />
                <HubToggleIcon
                  active={energy}
                  onClick={(e: any) => {
                    e.stopPropagation();
                    store.setRadialEnergy(!energy);
                  }}
                  icon={Battery}
                  color="green"
                  isDark={isDark}
                  title={energy ? t('hub.energyActive') : t('hub.energy')}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const MOCK_CALLS = [
  {
    id: 1,
    name: "Alice Freeman",
    time: "10:42 AM",
    type: "outgoing",
    duration: "5m 23s",
  },
  { id: 2, name: "+1 (555) 019-283", time: "Yesterday", type: "missed" },
  {
    id: 3,
    name: "Operations Team",
    time: "Yesterday",
    type: "incoming",
    duration: "12m 4s",
  },
  { id: 4, name: "Unknown", time: "Mon, 14:20", type: "missed" },
  {
    id: 5,
    name: "Bob Smith",
    time: "Sun, 08:15",
    type: "incoming",
    duration: "2m 10s",
  },
];

const MOCK_CHATS = [
  {
    id: 1,
    name: "Alice Freeman",
    message: "Hey, are we still on for tomorrow? Let me know!",
    time: "10:42",
    unread: 2,
    online: true,
    color: "from-pink-400 to-rose-400",
    history: [
      {
        id: 101,
        sender: "them",
        text: "Hey! Look at this new design concept 🎨",
        time: "10:35",
      },
      {
        id: 102,
        sender: "them",
        type: "image",
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
        time: "10:36",
      },
      {
        id: 103,
        sender: "me",
        text: "Wow, the colors are amazing! Is this for the new dashboard?",
        time: "10:38",
        status: "read",
      },
      {
        id: 104,
        sender: "them",
        type: "audio",
        duration: "0:24",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        time: "10:40",
      },
      { id: 105, sender: "them", text: "Let me know!", time: "10:42" },
    ],
  },
  {
    id: 2,
    name: "Design Team",
    message: "Bob: Let’s review the new components later.",
    time: "Yesterday",
    unread: 5,
    online: false,
    color: "from-amber-400 to-orange-500",
    history: [
      {
        id: 201,
        sender: "them",
        text: "Alice: I pushed the updated files.",
        time: "Yesterday, 14:20",
      },
      {
        id: 202,
        sender: "them",
        type: "video",
        thumb:
          "https://images.unsplash.com/photo-1616469829581-73993eb86b02?q=80&w=2670&auto=format&fit=crop",
        duration: "0:45",
        time: "Yesterday, 15:10",
      },
      {
        id: 203,
        sender: "them",
        text: "Bob: Let’s review the new components later.",
        time: "Yesterday, 16:30",
      },
    ],
  },
  {
    id: 3,
    name: "Victor",
    message: "Voice message (0:14)",
    time: "Tue",
    unread: 0,
    online: true,
    color: "from-indigo-400 to-cyan-400",
    history: [
      {
        id: 301,
        sender: "me",
        text: "Are you available to sync on the server deployment?",
        time: "Tue, 09:15",
        status: "read",
      },
      {
        id: 302,
        sender: "them",
        type: "audio",
        duration: "0:14",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        time: "Tue, 09:20",
      },
    ],
  },
  {
    id: 99,
    name: "Nexus Assistant",
    message: "Settings updated successfully.",
    time: "09:00",
    unread: 1,
    online: true,
    color: "from-slate-400 to-gray-500",
    isBot: true,
    history: [
      {
        id: 991,
        sender: "them",
        text: "Welcome to Nexus Network! How can I assist you today?",
        time: "08:58",
        keyboard: [
          [{ text: "🔒 Setup 2FA", action: "setup_2fa" }, { text: "💬 Help", action: "help" }],
          [{ text: "🛡️ Advanced Privacy", action: "privacy" }]
        ]
      },
      {
        id: 992,
        sender: "me",
        text: "/status",
        time: "08:59",
        status: "read",
      },
      {
        id: 993,
        sender: "them",
        text: "All critical services are online.\nLatency: 14ms\nNodes: 24 active",
        time: "09:00",
      }
    ]
  }
];

const MOCK_CHANNELS = [
  {
    id: 4,
    name: "Tech Insights",
    isChannel: true,
    message: "New update on the neural engines.",
    time: "11:00",
    unread: 12,
    color: "from-slate-700 to-slate-900",
    history: [
      {
        id: 401,
        sender: "them",
        text: "Welcome to Tech Insights. Today we dive into the new vector embeddings...",
        time: "Mon",
      },
      {
        id: 402,
        sender: "them",
        text: "New update on the neural engines.",
        time: "11:00",
      },
    ],
  },
  {
    id: 5,
    name: "Design Drops",
    isChannel: true,
    message: "10 tips for better neumorphic forms.",
    time: "Feb 24",
    unread: 0,
    color: "from-purple-500 to-fuchsia-500",
    history: [
      {
        id: 501,
        sender: "them",
        text: "10 tips for better neumorphic forms.",
        time: "Feb 24",
      },
    ],
  },
];

const ONLINE_CONTACTS = [
  { id: 1, name: "Alice", color: "from-pink-400 to-rose-400" },
  { id: 2, name: "Bob", color: "from-blue-400 to-indigo-400" },
  { id: 3, name: "Charlie", color: "from-amber-400 to-orange-400" },
  { id: 4, name: "Diana", color: "from-purple-400 to-fuchsia-400" },
  { id: 5, name: "Eve", color: "from-teal-400 to-emerald-400" },
];

const AvatarRow = ({ theme, onStoryClick }: any) => {
  const isDark = theme === "dark";
  return (
    <div className="flex flex-col w-full overflow-visible mb-2 pt-2 pb-1 bg-transparent shrink-0">
      <div className={`px-4 mb-2 font-mono text-[9px] uppercase tracking-widest font-bold ${isDark ? "text-gray-500" : "text-slate-400"}`}>P2P Stories</div>
      <div className="flex items-center gap-4 px-3 overflow-x-auto pb-2 scrollbar-none shrink-0" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
        
        {/* Add Story Button */}
        <div className="flex flex-col items-center gap-2 group cursor-pointer shrink-0">
          <div className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 active:scale-95 ${
            isDark ? "bg-[#1f222a] border border-white/5 border-dashed" : "bg-[#f4f7f9] border border-black/10 border-dashed"
          }`}>
             <Plus size={24} className={isDark ? "text-gray-400 group-hover:text-white" : "text-slate-500 group-hover:text-black"} />
          </div>
          <span className={`text-[10px] font-semibold tracking-wide transition-colors ${isDark ? "text-gray-400 group-hover:text-gray-200" : "text-slate-500 group-hover:text-slate-800"}`}>
            My Story
          </span>
        </div>

        {ONLINE_CONTACTS.map((c) => (
          <div
            key={c.id}
            onClick={() => onStoryClick && onStoryClick(c)}
            className="flex flex-col items-center gap-2 group cursor-pointer shrink-0"
          >
            <div
              className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 active:scale-95 ${
                isDark
                  ? "bg-[#13151b] shadow-[0_6px_12px_rgba(0,0,0,0.3),_inset_0_1.5px_2px_rgba(255,255,255,0.05),_inset_0_-2px_4px_rgba(0,0,0,0.6)] border-[2px] border-orange-500/50"
                  : "bg-[#eaeff4] shadow-[4px_4px_8px_rgba(165,175,190,0.3),_-4px_-4px_8px_rgba(255,255,255,0.8),_inset_1.5px_1.5px_2px_rgba(255,255,255,1)] border-[2px] border-orange-400"
              }`}
            >
              <div className="w-[85%] h-[85%] rounded-full shadow-inner overflow-hidden p-[2px]">
                <div
                  className={`w-full h-full rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-white font-bold text-lg`}
                >
                  {c.name.charAt(0)}
                </div>
              </div>
            </div>
            <span
              className={`text-[10px] font-semibold tracking-wide transition-colors ${isDark ? "text-gray-400 group-hover:text-gray-200" : "text-slate-500 group-hover:text-slate-800"}`}
            >
              {c.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ChatListItem = ({ chat, theme, type = "chat", active, onClick, onArchive, onAvatarClick }: any) => {
  const isDark = theme === "dark";
  const { stealthMode, typingIndicators } = useAppStore();

  const roundedClass = type === "channel" ? "rounded-2xl" : "rounded-full";
  const isMockTyping = typingIndicators && chat.id === 1 && type === "chat";

  const fuzzedTime = React.useMemo(() => {
    if (!stealthMode || !chat.time) return chat.time;
    const match = chat.time.match(/(\d{1,2}):(\d{2})/);
    if (!match) return chat.time;
    let h = parseInt(match[1]);
    let m = parseInt(match[2]);
    const offset = (chat.id % 11) - 5;
    m += offset;
    if (m < 0) { m += 60; h = (h - 1 + 24) % 24; }
    else if (m >= 60) { m -= 60; h = (h + 1) % 24; }
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }, [chat.time, chat.id, stealthMode]);

  return (
    <div className="relative mb-4 last:mb-0">
      <div className={`absolute inset-0 flex items-center justify-end px-6 rounded-3xl ${isDark ? "bg-red-500/20" : "bg-red-500"} text-white overflow-hidden`}>
        <Archive size={20} className={isDark ? "text-red-500" : "text-white"} />
        <span className={`ml-2 text-sm font-bold ${isDark ? "text-red-500" : "text-white"}`}>Archive</span>
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.5, right: 0 }}
        onDragEnd={(e, info) => {
          if (info.offset.x < -100 && onArchive) {
            onArchive(chat.id);
          }
        }}
        onClick={onClick}
        className={`relative w-full p-3 flex items-center gap-4 cursor-pointer transition-all duration-300 select-none group rounded-3xl ${
          isDark
            ? active
              ? "bg-[#101216] shadow-[inset_0_12px_24px_rgba(0,0,0,0.9),_inset_0_3px_6px_rgba(0,0,0,0.9)] border border-orange-500/20"
              : "bg-[#13151b] shadow-[0_8px_16px_rgba(0,0,0,0.3),_inset_0_1.5px_2px_rgba(255,255,255,0.05),_inset_0_-2px_4px_rgba(0,0,0,0.6)] border border-white/[0.02] hover:scale-[1.02]"
            : active
              ? "bg-[#e2e8f0] shadow-[inset_4px_4px_10px_rgba(165,175,190,0.4),_inset_-2px_-2px_6px_rgba(255,255,255,1)] border border-black/5"
              : "bg-[#eaeff4] shadow-[-6px_-6px_12px_rgba(255,255,255,0.8),_8px_8px_16px_rgba(165,175,190,0.4),_inset_1.5px_1.5px_3px_rgba(255,255,255,1)] border border-white/80 hover:scale-[1.02]"
        }`}
      >
      {/* Avatar */}
      <div
        onClick={(e) => {
           if (onAvatarClick && type !== "channel") {
              e.stopPropagation();
              onAvatarClick(chat);
           }
        }}
        className={`relative shrink-0 w-[52px] h-[52px] ${roundedClass} shadow-inner p-[2px] transition-transform duration-300 ${active ? "scale-95" : ""}`}
      >
        <div
          className={`w-full h-full ${roundedClass} bg-gradient-to-br ${chat.color} flex items-center justify-center text-white font-bold text-xl shadow-sm`}
        >
          {chat.name.charAt(0)}
        </div>
        {chat.online && (
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] rounded-full border-[2.5px] z-10 ${isDark ? "bg-green-400 border-[#13151b]" : "bg-emerald-500 border-[#eaeff4]"}`}
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center pr-2">
        <div className="flex justify-between items-center mb-[2px]">
          <span
            className={`font-bold text-[14.5px] truncate pr-2 ${isDark ? "text-[#e8ecf2]" : "text-slate-800"}`}
          >
            {chat.name}
          </span>
          <span
            className={`text-[10.5px] font-semibold tracking-wide shrink-0 ${isDark ? "text-gray-500" : "text-slate-400"}`}
          >
            {fuzzedTime}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span
            className={`text-[12.5px] truncate pr-4 ${isDark ? (active ? "text-orange-300" : "text-[#7a8190]") : active ? "text-orange-600" : "text-slate-500"} ${chat.unread ? "font-medium" : ""}`}
          >
            {isMockTyping ? (
               <span className={`font-bold tracking-wide italic ${isDark ? "text-orange-500" : "text-orange-600"}`}>
                  typing...
               </span>
            ) : (
               <FormattedText text={chat.message} />
            )}
          </span>
          {chat.unread > 0 && (
             <div
               className={`shrink-0 min-w-[20px] h-[20px] px-1.5 rounded-full flex items-center justify-center shadow-sm ${
                 isDark
                   ? "bg-gradient-to-tr from-orange-500 to-orange-400 text-white shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                   : "bg-gradient-to-tr from-orange-400 to-orange-300 text-orange-950 shadow-[0_2px_4px_rgba(249,115,22,0.5)]"
               }`}
             >
               <span className="text-[10px] font-bold pb-[0.5px] leading-none">
                 {chat.unread}
               </span>
             </div>
           )}
           {(chat as any).hasMentions && (
             <div
               className={`shrink-0 min-w-[20px] h-[20px] px-1.5 rounded-full flex items-center justify-center shadow-sm ${
                 isDark
                   ? "bg-blue-500/90 text-white shadow-[0_0_8px_rgba(59,130,250,0.5)]"
                   : "bg-blue-500 text-white shadow-[0_2px_4px_rgba(29,78,183,0.5)]"
               }`}
             >
               <span className="text-[10px] font-bold pb-[0.5px] leading-none">@</span>
             </div>
           )}
        </div>
      </div>
      </motion.div>
    </div>
  );
};

const ChatPreviewLayer = ({ chat, theme, onClose, onAction, onCall, onMessage, onUpdateChat, onReply, savedMessages = [], onToggleSavedMessage, deliveryReceipts = true, readReceipts = true, setEditingContact }: any) => {
  const isDark = theme === "dark";
  const { stealthMode, scheduledQueue, setActiveCall, setChats, setChannels } = useAppStore();
  const [videoOpen, setVideoOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactProfile | null>(null);
  const [mediaTab, setMediaTab] = useState<'all' | 'photos' | 'audio' | 'links'>('all');
  const [filterBySender, setFilterBySender] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  
  const [showComments, setShowComments] = useState(false);
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [activeReactionPicker, setActiveReactionPicker] = useState<number | string | null>(null);
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  
  const AVAILABLE_EMOJIS = ["👍", "❤️", "😂", "🔥", "😢", "🎉"];

  const handleReactionMessage = (msgId: string | number, emoji: string) => {
     const updatedChat = {
        ...chat,
        history: (chat.history || []).map((m: any) => {
           if (m.id === msgId) {
              const currentReactions = m.reactions || {};
              return {
                 ...m,
                 reactions: {
                    ...currentReactions,
                    [emoji]: (currentReactions[emoji] || 0) + 1
                 }
              };
           }
           return m;
        })
     };
     
     if (onUpdateChat) {
        onUpdateChat(updatedChat);
     }
     setChats(prev => prev.map(c => c.id === chat.id ? updatedChat : c));
     setActiveReactionPicker(null);
  };

  useEffect(() => {
    if (!chat || !chat.history) return;
    const hasDelivered = chat.history.some((m: any) => m.sender === "me" && m.status === "delivered");
    if (!hasDelivered) return;
    const timer = setTimeout(() => {
       const updatedHistory = chat.history.map((m: any) => {
          if (m.sender === "me" && m.status === "delivered") {
             return { ...m, status: "read" };
          }
          return m;
       });
       const updatedChat = { ...chat, history: updatedHistory };
       if (onUpdateChat) {
          onUpdateChat(updatedChat);
       }
       setChats(prev => prev.map(c => c.id === chat.id ? updatedChat : c));
    }, 1500);
    return () => clearTimeout(timer);
  }, [chat, onUpdateChat, setChats]);

  // Deterministic fuzzing by message ID up to ±5 minutes
  const fuzzTime = (timeStr: string, id: number) => {
    if (!stealthMode) return timeStr;
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return timeStr; // fallback for strings like "Yesterday"
    let h = parseInt(match[1]);
    let m = parseInt(match[2]);
    const offset = (id % 11) - 5; // -5 to +5
    m += offset;
    if (m < 0) {
      m += 60;
      h = (h - 1 + 24) % 24;
    } else if (m >= 60) {
      m -= 60;
      h = (h + 1) % 24;
    }
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const filteredHistory =
    chat.history?.filter(
      (msg: any) => {
        // Apply sender filter
        if (filterBySender === 'me' && msg.sender !== 'me') return false;
        if (filterBySender === 'them' && msg.sender === 'me') return false;
        
        // Apply date filters
        if (filterStartDate || filterEndDate) {
          const msgDate = new Date(chat.history?.findIndex((m: any) => m.id === msg.id) * 86400000 + Date.now());
          if (filterStartDate && msgDate < new Date(filterStartDate)) return false;
          if (filterEndDate && msgDate > new Date(filterEndDate)) return false;
        }
        
        // Apply text search
        const matchesSearch = searchQuery ? msg.text?.toLowerCase().includes(searchQuery.toLowerCase()) || !msg.text : true;
        
        return matchesSearch;
      },
    ) || [];

  const mediaItems = (chat.history || []).filter((msg: any) => {
    // Apply sender filter to media items too
    if (filterBySender === 'me' && msg.sender !== 'me') return false;
    if (filterBySender === 'them' && msg.sender === 'me') return false;
    
    // Apply text search to media items
    if (searchQuery && !msg.text?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    if (mediaTab === 'photos') return msg.type === 'image';
    if (mediaTab === 'audio') return msg.type === 'audio';
    if (mediaTab === 'links') return typeof msg.text === 'string' && /https?:\/\//i.test(msg.text);
    return msg.type === 'image' || msg.type === 'audio' || (typeof msg.text === 'string' && /https?:\/\//i.test(msg.text));
  });

  const chatSavedMessages = savedMessages.filter((saved: any) => saved.chatId === chat.id);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 40, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 40, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`absolute inset-0 w-full h-full rounded-[48px] flex flex-col overflow-hidden z-50 ${
          isDark
            ? "bg-[#13151b] shadow-[0_32px_64px_rgba(0,0,0,0.8),_inset_0_1.5px_2px_rgba(255,255,255,0.05),_inset_0_-2px_4px_rgba(0,0,0,0.9)] border border-orange-500/10"
            : "bg-[#eaeff4] shadow-[0_32px_64px_rgba(165,175,190,0.8),_inset_1.5px_1.5px_3px_rgba(255,255,255,1)] border border-white"
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 pb-4 flex items-center gap-4 relative z-10 ${isDark ? "bg-[#1a1d24]/90 border-b border-white/5 backdrop-blur-md" : "bg-[#f4f7f9]/90 border-b border-black/5 backdrop-blur-md"}`}
        >
          {/* Button Back */}
          <div
            onClick={onClose}
            className={`cursor-pointer w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
              isDark
                ? "bg-[#13151b] hover:bg-[#20242e] text-gray-400 shadow-[0_4px_8px_rgba(0,0,0,0.4),_inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/[0.02]"
                : "bg-[#eaeff4] hover:bg-white text-slate-500 shadow-[-2px_-2px_6px_rgba(255,255,255,0.9),_4px_4px_8px_rgba(165,175,190,0.4),_inset_1px_1px_2px_rgba(255,255,255,1)]"
            }`}
          >
            <ChevronRight size={22} className="rotate-180" strokeWidth={2} />
          </div>

          {/* Avatar mini */}
          <div
            onClick={() => {
              const allContacts = useAppStore.getState().contacts;
              const profileContact = allContacts.find(ct => ct.name === chat.name);
              setSelectedContact({
                id: `hash_${chat.id}`,
                name: chat.name,
                color: chat.color,
                lastSeen: chat.online ? 0 : Date.now() - 3600000,
                localFields: profileContact?.localFields
              });
            }}
            className={`w-11 h-11 cursor-pointer rounded-full bg-gradient-to-br flex-shrink-0 ${chat.color} flex items-center justify-center text-white font-bold text-lg shadow-sm relative transition-all active:scale-95`}
          >
            {chat.name.charAt(0)}
            {chat.online && (
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-[12px] h-[12px] rounded-full border-[2px] ${isDark ? "bg-green-400 border-[#1a1d24]" : "bg-emerald-500 border-[#f4f7f9]"}`}
              />
            )}
            <div className={`absolute -top-1 -right-1 rounded-full w-4 h-4 flex items-center justify-center border-[2px] ${isDark ? "border-[#1a1d24] bg-[#ff6b6b]" : "border-[#f4f7f9] bg-rose-500"}`} title="Self-destruct active (1h)">
              <span className="text-[7px] text-white font-bold tracking-tighter">1h</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <span
              className={`font-bold text-[15px] truncate leading-tight flex items-center gap-1.5 ${isDark ? "text-white drop-shadow-sm" : "text-slate-800"}`}
            >
              {chat.name}
              <div title="E2E Encrypted" className="flex items-center justify-center">
                 <Shield size={12} className={isDark ? "text-orange-400" : "text-emerald-500"} />
              </div>
            </span>
            <span
              className={`text-[11px] mt-0.5 font-bold tracking-wider uppercase ${isDark ? "text-orange-400" : "text-orange-600"}`}
            >
              {chat.online ? "Online" : "Offline"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <div
              onClick={() => setShowSearch(!showSearch)}
              title="Search Messages"
              className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 ${isDark ? "hover:bg-white/5 text-gray-400 hover:text-white" : "hover:bg-black/5 text-slate-400 hover:text-slate-800"} ${showSearch ? (isDark ? "bg-white/10 text-white" : "bg-black/10 text-slate-800") : ""}`}
            >
              <Search size={18} />
            </div>
            {!chat.isChannel && (
              <div
                title="Start Audio Call"
                onClick={() => setActiveCall({ number: chat.name || "Unknown Call", startTime: Date.now(), isMuted: false, isSpeaker: false })}
                className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 active:scale-95 ${isDark ? "hover:bg-white/5 text-gray-400 hover:text-white" : "hover:bg-black/5 text-slate-400 hover:text-slate-800"}`}
              >
                <Phone size={18} />
              </div>
            )}
            {!chat.isChannel && (
              <div
                title="Saved messages"
                onClick={() => setShowSavedPanel(true)}
                className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 relative ${isDark ? "hover:bg-white/5 text-gray-400 hover:text-white" : "hover:bg-black/5 text-slate-400 hover:text-slate-800"}`}
              >
                <Bookmark size={18} />
                {chatSavedMessages.length > 0 && (
                  <span className={`absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${isDark ? "bg-orange-500 text-white" : "bg-orange-500 text-white"}`}>
                    {chatSavedMessages.length}
                  </span>
                )}
              </div>
            )}
            {!chat.isChannel && (
              <div
                title="Clear Chat History"
                onClick={() => {
                   setChats(prevChats => prevChats.map(c => c.id === chat.id ? { ...c, history: [] } : c));
                   onClose();
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 active:scale-95 ${isDark ? "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white" : "bg-black/5 hover:bg-black/10 text-slate-400 hover:text-slate-800"}`}
              >
                <Trash2 size={18} />
              </div>
            )}
            {!chat.isChannel && (
              <div
                title="Start Video Call"
                onClick={() => setActiveCall({ number: chat.name || "Unknown Call", startTime: Date.now(), isMuted: false, isSpeaker: false, isVideo: true })}
                className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 active:scale-95 ${isDark ? "hover:bg-white/5 text-gray-400 hover:text-white" : "hover:bg-black/5 text-slate-400 hover:text-slate-800"}`}
              >
                <Video size={20} />
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`px-5 relative z-10 overflow-hidden ${isDark ? "bg-[#1a1d24]/90 border-b border-white/5 backdrop-blur-md" : "bg-[#f4f7f9]/90 border-b border-black/5 backdrop-blur-md"}`}
            >
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
                    type="text"
                    placeholder="Search in chat..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full bg-transparent border-none outline-none text-[13.5px] font-medium ${isDark ? "text-white placeholder:text-gray-500" : "text-slate-700 placeholder:text-slate-400"}`}
                  />
                  {searchQuery && (
                    <div
                      onClick={() => setSearchQuery("")}
                      className={`ml-2 shrink-0 cursor-pointer w-6 h-6 flex items-center justify-center rounded-full ${isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-black/10 text-slate-500"}`}
                    >
                      <X size={14} strokeWidth={2.5} />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Media Tabs & Filters */}
        <div className={`px-5 pt-4 pb-2 flex flex-col gap-2 overflow-x-auto scrollbar-none ${isDark ? "bg-[#1a1d24]/60" : "bg-[#f4f7f9]/60"}`} onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
          {/* Filter buttons row */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${showFilterMenu ? (isDark ? "bg-orange-500 text-white" : "bg-orange-500 text-white") : (isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500")}`}
            >
              {filterBySender || filterStartDate || filterEndDate ? 'Filters ON' : 'Filters'}
            </button>
            {(filterBySender || filterStartDate || filterEndDate) && (
              <button
                onClick={() => { setFilterBySender(""); setFilterStartDate(""); setFilterEndDate(""); }}
                className={`px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${isDark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-500"}`}
              >
                Clear
              </button>
            )}
            <div className={`ml-auto text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-gray-500" : "text-slate-400"}`}>
              {mediaItems.length} items
            </div>
          </div>
          
          {/* Filter menu */}
          {showFilterMenu && (
            <div className={`space-y-2 pb-2 border-b ${isDark ? "border-white/5" : "border-black/5"}`}>
              {/* Sender filter */}
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase ${isDark ? "text-gray-400" : "text-slate-500"}`}>From:</span>
                <button onClick={() => setFilterBySender("")} className={`px-2 py-0.5 rounded-full text-[10px] ${filterBySender === '' ? (isDark ? "bg-green-500 text-white" : "bg-green-500 text-white") : (isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500")}`}>All</button>
                <button onClick={() => setFilterBySender('me')} className={`px-2 py-0.5 rounded-full text-[10px] ${filterBySender === 'me' ? (isDark ? "bg-green-500 text-white" : "bg-green-500 text-white") : (isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500")}`}>Me</button>
                <button onClick={() => setFilterBySender('them')} className={`px-2 py-0.5 rounded-full text-[10px] ${filterBySender === 'them' ? (isDark ? "bg-green-500 text-white" : "bg-green-500 text-white") : (isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500")}`}>Others</button>
              </div>
              
              {/* Date filter */}
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-bold uppercase ${isDark ? "text-gray-400" : "text-slate-500"}`}>From:</span>
                <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className={`text-[10px] ${isDark ? "text-white bg-transparent" : "text-slate-700 bg-transparent"} outline-none`} />
                <span className={`text-[10px] ${isDark ? "text-gray-500" : "text-slate-400"}`}>to</span>
                <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className={`text-[10px] ${isDark ? "text-white bg-transparent" : "text-slate-700 bg-transparent"} outline-none`} />
              </div>
            </div>
          )}
          
          {/* Media Tabs */}
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'Media' },
              { id: 'photos', label: 'Photos' },
              { id: 'audio', label: 'Voice notes' },
              { id: 'links', label: 'Links' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setMediaTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors ${mediaTab === tab.id ? (isDark ? "bg-orange-500 text-white" : "bg-orange-500 text-white shadow-md") : (isDark ? "bg-white/5 text-gray-400 hover:text-white" : "bg-black/5 text-slate-500 hover:text-slate-800")}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {mediaItems.length > 0 && (
          <div className="px-5 pb-3 overflow-x-auto scrollbar-none" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
            <div className="flex gap-3">
              {mediaItems.slice(0, 6).map((msg: any) => (
                <div
                  key={msg.id}
                  className={`w-[120px] h-[84px] rounded-2xl overflow-hidden flex-shrink-0 relative cursor-pointer border ${isDark ? "border-white/10 bg-white/5" : "border-black/5 bg-white"}`}
                  onClick={() => {
                    if (msg.type === 'image' && (msg.attachment || msg.url)) {
                      setActivePhotoUrl(msg.attachment || msg.url);
                      setPhotoOpen(true);
                    }
                  }}
                >
                  {msg.type === 'image' ? (
                    <img src={msg.attachment || msg.url} alt="media" className="w-full h-full object-cover" />
                  ) : msg.type === 'audio' ? (
                    <div className={`w-full h-full flex flex-col items-start justify-between p-3 ${isDark ? "bg-[#1a1d24]" : "bg-slate-50"}`}>
                      <Mic size={18} className={isDark ? "text-orange-400" : "text-orange-600"} />
                      <div className={`text-[11px] font-bold ${isDark ? "text-white" : "text-slate-800"}`}>Voice note</div>
                      <div className={`text-[10px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{msg.duration || '0:00'}</div>
                    </div>
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center p-3 text-center text-[11px] ${isDark ? "bg-[#1a1d24] text-gray-300" : "bg-white text-slate-600"}`}>
                      <span className="break-all line-clamp-3">{msg.text}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div
          className={`flex-1 overflow-y-auto overflow-x-hidden p-6 flex flex-col gap-6 relative z-0 ${isDark ? "scrollbar-dark" : "scrollbar-light"}`}
        >
        <AnimatePresence mode="popLayout">
          {filteredHistory.map((msg: any) => {
            const isMe = msg.sender === "me";
            return (
              <motion.div
                layout
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex flex-col w-full mb-4 group relative ${isMe ? "items-end" : "items-start"}`}
              >
                 <div className={`flex items-center relative gap-2 max-w-[100%] ${isMe ? "justify-end flex-row-reverse" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] md:max-w-[80%] sm:max-w-[85%] ${msg.type ? "p-2" : "p-3.5"} rounded-[20px] text-[14px] shadow-md relative leading-relaxed break-words ${
                        isMe
                          ? isDark
                            ? "bg-orange-600/20 text-orange-50 border border-orange-500/30 rounded-br-sm shadow-[0_8px_16px_rgba(249,115,22,0.1),_inset_0_1px_1px_rgba(255,255,255,0.05)]"
                            : "bg-gradient-to-br from-orange-400 to-orange-500 text-white rounded-br-sm shadow-[0_8px_16px_rgba(249,115,22,0.3),_inset_0_2px_4px_rgba(255,255,255,0.3)]"
                          : isDark
                            ? "bg-[#1a1d24] text-gray-300 border border-white/5 rounded-bl-sm shadow-[0_8px_16px_rgba(0,0,0,0.4),_inset_0_1px_2px_rgba(255,255,255,0.02)]"
                            : "bg-white text-slate-700 border border-black/5 rounded-bl-sm shadow-[0_8px_16px_rgba(165,175,190,0.2)]"
                      }`}
                    >
                      {msg.type === "image" && (
                        <div 
                           className="rounded-[14px] overflow-hidden mb-1 relative border border-white/10 cursor-pointer"
                           onClick={() => { setActivePhotoUrl(msg.attachment || msg.url); setPhotoOpen(true); }}
                        >
                          <img
                            src={msg.attachment || msg.url}
                            alt="Shared"
                            className="w-full h-auto object-cover max-h-[220px]"
                          />
                        </div>
                      )}
                      {msg.type === "video" && (
                        <div
                          className="rounded-[14px] overflow-hidden mb-1 relative border border-white/10 group cursor-pointer"
                          onClick={() => setVideoOpen(true)}
                        >
                          <img
                            src={msg.thumb}
                            alt="Video thumbnail"
                            className="w-[200px] h-[120px] object-cover opacity-80"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play
                                size={20}
                                className="text-white fill-white ml-1"
                              />
                            </div>
                          </div>
                          <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-white tracking-wider">
                            {msg.duration}
                          </div>
                        </div>
                      )}
                      {msg.type === "audio" && (
                        <VoiceWaveform duration={msg.duration} isMe={isMe} isDark={isDark} audioUrl={msg.audioUrl} />
                      )}
                      {msg.type === "image" && (
                        <div className={`mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500"}`}>
                          <span>Photo</span>
                          {msg.attachment && <span className="opacity-70">ready</span>}
                        </div>
                      )}
                      {msg.replyTo && (
                        <div
                          className={`mb-2 px-3 py-2 rounded-xl border-l-2 text-[12px] ${
                            isDark
                              ? "bg-white/5 border-orange-400 text-gray-300"
                              : "bg-black/5 border-orange-500 text-slate-600"
                          }`}
                        >
                          <div className="font-bold text-[10px] uppercase tracking-widest opacity-70 mb-1">
                            Replying to {msg.replyTo.sender === "me" ? "your message" : msg.replyTo.sender}
                          </div>
                          <div className="line-clamp-2">{msg.replyTo.text || (msg.replyTo.type === "audio" ? `Voice note · ${msg.replyTo.duration || ""}` : "Attachment")}</div>
                        </div>
                      )}
                      {msg.text && (
                        <span className={msg.type ? "px-2 pb-1 block" : ""}>
                          <FormattedText text={msg.text} searchTerm={searchQuery} />
                        </span>
                      )}
                      {msg.text && typeof msg.text === "string" && /https?:\/\/[^\s]+/i.test(msg.text) && (
                        <div className={`mt-2 p-2 rounded-2xl border text-[11px] ${isDark ? "bg-white/5 border-white/10 text-gray-300" : "bg-slate-50 border-black/5 text-slate-600"}`}>
                          <div className="font-bold uppercase tracking-widest text-[9px] opacity-70 mb-1">Link Preview</div>
                          <div className="break-all line-clamp-2">{msg.text.match(/https?:\/\/[^\s]+/i)?.[0]}</div>
                        </div>
                      )}
                      {msg.keyboard && (
                        <div className="flex flex-col gap-1.5 mt-3 mb-1 w-full shrink-0">
                          {msg.keyboard.map((row: any[], i: number) => (
                            <div key={i} className="flex gap-1.5 w-full">
                              {row.map((btn: any, j: number) => (
                                <button 
                                  key={j} 
                                  onClick={() => {
                                     if (onAction) onAction(btn.action || btn.text);
                                     setTimeout(() => {
                                        // Normally this would trigger send, but setting text is fine
                                     }, 10);
                                  }}
                                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${isDark ? "bg-[#2a2d36] hover:bg-[#343842] text-white border border-white/5" : "bg-[#f4f7f9] hover:bg-slate-200 text-slate-700 border border-black/5"}`}
                                >
                                  {btn.text}
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-bold tracking-wide opacity-70 ${isMe && !isDark ? "text-orange-100" : ""} ${msg.type ? "px-2" : ""}`}
                      >
                        {msg.silent && <BellOff size={10} className="mr-0.5 opacity-60" />}
                        {fuzzTime(msg.time, msg.id)}
                        {isMe && (
                          !deliveryReceipts ? (
                            <Check size={12} strokeWidth={2.5} />
                          ) : msg.status === "sent" ? (
                            <Check size={12} strokeWidth={2.5} />
                          ) : msg.status === "delivered" ? (
                            <CheckCheck size={12} strokeWidth={2.5} />
                          ) : readReceipts ? (
                            <CheckCheck size={12} strokeWidth={2.5} className={isDark ? "text-blue-400" : "text-blue-500"} />
                          ) : (
                            <CheckCheck size={12} strokeWidth={2.5} />
                          )
                        )}
                      </div>
                      
                      <div className={`mt-2 flex items-center gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                        {!chat.isChannel && (
                          <button
                            onClick={() => onReply?.(msg)}
                            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full transition-colors ${
                              isDark
                                ? "text-gray-400 hover:text-white hover:bg-white/5"
                                : "text-slate-500 hover:text-slate-800 hover:bg-black/5"
                            }`}
                          >
                            Reply
                          </button>
                        )}
                        {!chat.isChannel && (
                          <button
                            onClick={() => onToggleSavedMessage?.(chat, msg)}
                            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full transition-colors flex items-center gap-1 ${
                              isDark
                                ? "text-gray-400 hover:text-white hover:bg-white/5"
                                : "text-slate-500 hover:text-slate-800 hover:bg-black/5"
                            }`}
                          >
                            <Bookmark size={10} />
                            {chatSavedMessages.some((saved: any) => saved.messageId === msg.id) ? "Saved" : "Save"}
                          </button>
                        )}
                      </div>

                      {/* Render Comments for Channels */}
                      {chat.isChannel && (
                         <div 
                            className={`flex items-center gap-1 mt-2 -mb-1 px-1 py-1 rounded-lg cursor-pointer ${isDark ? "hover:bg-white/5 text-gray-400 hover:text-white" : "hover:bg-black/5 text-slate-500 hover:text-slate-800"} transition-colors w-max`}
                            onClick={() => {
                               setActivePostId(msg.id);
                               setShowComments(true);
                            }}
                         >
                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                           </svg>
                           <span className="text-[11px] font-medium tracking-wide">
                              {msg.id === 402 ? "45 Comments" : "Leave a Comment"}
                           </span>
                         </div>
                      )}
                    </div>
                    
                    {/* Reaction trigger */}
                    <div 
                        className={`opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${isDark ? "bg-[#2a2d36] text-gray-400 hover:text-white" : "bg-white text-slate-400 hover:text-slate-800"} w-8 h-8 rounded-full flex items-center justify-center shadow-md z-10 shrink-0 border border-black/5`}
                        onClick={() => setActiveReactionPicker(activeReactionPicker === msg.id ? null : msg.id)}
                    >
                        <Plus size={16} />
                    </div>

                    {/* Picker Popup */}
                    <AnimatePresence>
                    {activeReactionPicker === msg.id && (
                       <motion.div 
                          initial={{ opacity: 0, scale: 0.9, x: isMe ? 10 : -10 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.9, x: isMe ? 10 : -10 }}
                          className={`absolute top-1/2 -translate-y-1/2 ${isMe ? "right-[calc(100%+8px)] mr-0" : "left-[calc(100%+8px)] ml-0"} z-20 flex bg-black/80 backdrop-blur-md rounded-full shadow-xl px-1 py-1`}
                       >
                          {AVAILABLE_EMOJIS.map(emoji => (
                             <div 
                                key={emoji}
                                className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-white/20 rounded-full transition-colors text-lg"
                                onClick={() => handleReactionMessage(msg.id, emoji)}
                             >
                                {emoji}
                             </div>
                          ))}
                       </motion.div>
                    )}
                    </AnimatePresence>
                 </div>

{/* Summary bar for Reactions */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                     <div className="flex gap-1.5 mt-1 z-10 relative">
                        {Object.entries(msg.reactions).map(([emoji, count]) => (
                           <Tooltip key={emoji} content={`${count === 1 ? 'You' : count + ' users'} reacted with ${emoji}`} position="top" theme={isDark ? 'dark' : 'light'}>
                              <div 
                                 className={`rounded-full px-2 py-0.5 text-[12px] shadow-sm flex items-center cursor-help group select-none border transition-colors ${
                                    isDark ? "bg-[#1a1d24] text-gray-300 border-white/5 hover:border-white/20 hover:bg-[#20242e]" : "bg-white text-slate-700 border-black/5 hover:bg-slate-50 hover:border-black/10"
                                 }`}
                                 onClick={() => handleReactionMessage(msg.id, emoji)}
                              >
                                 {emoji}
                                 <span className={`ml-1.5 text-[11px] font-bold ${isDark ? "opacity-60" : "opacity-80"}`}>{String(count)}</span>
                              </div>
                           </Tooltip>
                        ))}
                     </div>
                  )}
                  </motion.div>
            );
          })}
          {scheduledQueue.messages.filter((m: any) => m.chatId === chat.id).map((msg: any) => (
             <motion.div
               layout
               key={msg.id}
               initial={{ opacity: 0, y: 10, scale: 0.95 }}
               animate={{ opacity: 0.7, y: 0, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="flex w-full justify-end"
             >
                <div
                  className={`max-w-[80%] p-3.5 rounded-[20px] text-[14px] shadow-sm border border-dashed relative leading-relaxed overflow-hidden break-words ${
                    isDark
                      ? "bg-[#1a1d24] text-gray-400 border-gray-600 rounded-br-sm"
                      : "bg-gray-50 text-gray-500 border-gray-300 rounded-br-sm"
                  }`}
                >
                  <FormattedText text={msg.text} searchTerm={searchQuery} />
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] font-bold tracking-wide opacity-50">
                     <Clock size={10} className="inline mr-1" />
                     {new Date(msg.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     <span className="cursor-pointer ml-2 hover:text-red-500" onClick={() => scheduledQueue.removeMessage(msg.id)}>✕</span>
                  </div>
                </div>
             </motion.div>
          ))}
        </AnimatePresence>
        </div>

        {/* Input or Channel Footer */}
        <div
          className={`p-5 flex items-center justify-center gap-3 relative z-10 ${isDark ? "bg-[#1a1d24]/90 border-t border-white/5 backdrop-blur-md" : "bg-[#f4f7f9]/90 border-t border-black/5 backdrop-blur-md"}`}
        >
          {chat.isChannel ? (
            <div 
               onClick={() => {
                  setChannels(prev => prev.map(c => c.id === chat.id ? { ...c, isMuted: !chat.isMuted } : c) as any);
                  // Since ChatPreviewLayer only gets chat from parent and doesn't have setActiveChat, it will have to rely on global state or parent updating. Wait, I can pass Mute action to onAction!
                  if (onAction) onAction("MUTE_TOGGLE");
               }}
               className={`w-full py-3 rounded-2xl flex items-center justify-center cursor-pointer transition-colors font-medium text-sm tracking-wide ${isDark ? "bg-[#13151b] hover:bg-[#20242e] text-orange-400 border border-white/5" : "bg-white hover:bg-slate-50 text-orange-600 border border-black/5 shadow-sm"}`}
            >
               {chat.isMuted ? "Unmute Channel" : "Mute Channel"}
            </div>
          ) : (
            <>
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${
                  isDark
                    ? "bg-[#13151b] hover:bg-[#20242e] text-gray-400 shadow-[0_4px_8px_rgba(0,0,0,0.4),_inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/[0.02]"
                    : "bg-[#eaeff4] hover:bg-white text-slate-500 shadow-[-2px_-2px_6px_rgba(255,255,255,0.9),_4px_4px_8px_rgba(165,175,190,0.4),_inset_1px_1px_2px_rgba(255,255,255,1)]"
                }`}
              >
                <Plus size={22} />
              </div>
              <div
                className={`flex-1 h-12 rounded-full px-5 flex items-center ${
                  isDark
                    ? "bg-[#13151b] border border-white/5 shadow-[inset_0_4px_8px_rgba(0,0,0,0.8),_0_2px_4px_rgba(255,255,255,0.02)]"
                    : "bg-[#eaeff4] border border-black/5 shadow-[inset_3px_3px_6px_rgba(165,175,190,0.3),_inset_-2px_-2px_4px_rgba(255,255,255,1)]"
                }`}
              >
                <input
                  type="text"
                  placeholder="Message..."
                  className={`w-full bg-transparent border-none outline-none text-[14.5px] ${isDark ? "text-white placeholder:text-gray-500" : "text-slate-700 placeholder:text-slate-400"}`}
                />
              </div>
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${
                  isDark
                    ? "bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/20 shadow-[0_4px_8px_rgba(249,115,22,0.15)]"
                    : "bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 border border-orange-500/20 shadow-[0_2px_6px_rgba(249,115,22,0.15)]"
                }`}
              >
                <Mic size={20} />
              </div>
            </>
          )}
        </div>
      </motion.div>
      <VideoPlayerOverlay
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        theme={theme}
      />
      <PhotoViewerOverlay
        open={photoOpen}
        url={activePhotoUrl}
        onClose={() => setPhotoOpen(false)}
        theme={theme}
      />
      <ChannelCommentsView
        isOpen={showComments}
        postId={activePostId || 0}
        onClose={() => setShowComments(false)}
        theme={theme}
        postKey=""
        channelChatId={"test_channel"}
      />
      <AnimatePresence>
        {showSavedPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowSavedPanel(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-[760px] max-h-[78%] rounded-t-[32px] overflow-hidden border-t border-x ${isDark ? "bg-[#13151b] border-white/10" : "bg-[#f4f7f9] border-black/5"} shadow-2xl`}
            >
              <div className={`p-4 flex items-center justify-between ${isDark ? "border-b border-white/5" : "border-b border-black/5"}`}>
                <div>
                  <div className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isDark ? "text-orange-400" : "text-orange-600"}`}>Saved Messages</div>
                  <div className={`text-sm mt-1 ${isDark ? "text-gray-300" : "text-slate-600"}`}>{chatSavedMessages.length} items in {chat.name}</div>
                </div>
                <button
                  onClick={() => setShowSavedPanel(false)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${isDark ? "bg-white/5 text-gray-300" : "bg-white text-slate-500 border border-black/5"}`}
                >
                  <X size={16} />
                </button>
              </div>
              <div className={`p-4 overflow-y-auto max-h-[calc(78vh-76px)] ${isDark ? "scrollbar-dark" : "scrollbar-light"}`}>
                {chatSavedMessages.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {chatSavedMessages.slice().reverse().map((saved: any) => (
                      <div key={saved.key} className={`p-4 rounded-2xl border ${isDark ? "bg-[#1a1d24] border-white/5" : "bg-white border-black/5"}`}>
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                            {saved.sourceLabel || chat.name}
                          </div>
                          <button
                            onClick={() => onToggleSavedMessage?.(chat, { id: saved.messageId })}
                            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${isDark ? "bg-white/5 text-gray-300" : "bg-slate-100 text-slate-600"}`}
                          >
                            Unsave
                          </button>
                        </div>
                        <div className={`text-sm ${isDark ? "text-white" : "text-slate-800"}`}>
                          {saved.preview}
                        </div>
                        <div className={`mt-2 text-[10px] font-medium ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                          {saved.time}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`py-12 text-center ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                    No saved messages yet
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ContactProfileModal 
         contact={selectedContact}
         theme={theme}
         onClose={() => setSelectedContact(null)}
         onCall={() => {
             if (onCall && selectedContact) onCall(selectedContact.name, selectedContact.color);
             setSelectedContact(null);
         }}
         onMessage={() => {
             if (onMessage && selectedContact) onMessage(selectedContact.name, selectedContact.color);
             setSelectedContact(null);
         }}
        onDelete={() => {
              toast.info("Contact", { description: `Deleted contact history for: ${selectedContact?.name}` });
              setSelectedContact(null);
          }}
         onEdit={() => {
               if (selectedContact) {
                 setEditingContact(selectedContact);
               }
               setSelectedContact(null);
           }}
          onBlock={() => {
               toast.warning("Contact", { description: `Blocked contact: ${selectedContact?.name}` });
               setSelectedContact(null);
           }}
      />
    </>
  );
};

const SettingsToggle = ({ theme, label, initialActive = false }: any) => {
  const [active, setActive] = useState(initialActive);
  const isDark = theme === "dark";
  return (
    <div
      className={`w-full h-[64px] px-6 rounded-[32px] flex items-center justify-between cursor-pointer transition-all duration-300 select-none mb-4 ${
        isDark
          ? "bg-[#13151b] shadow-[0_6px_12px_rgba(0,0,0,0.3),_inset_0_1.5px_2px_rgba(255,255,255,0.04),_inset_0_-2px_4px_rgba(0,0,0,0.5)] border border-white/[0.02] hover:scale-[1.02] active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)] active:scale-100"
          : "bg-[#eaeff4] shadow-[-4px_-4px_10px_rgba(255,255,255,0.9),_6px_8px_16px_rgba(165,175,190,0.4),_inset_1.5px_1.5px_2px_rgba(255,255,255,1)] border border-white/50 hover:scale-[1.02] active:shadow-[inset_3px_3px_6px_rgba(165,175,190,0.3)] active:scale-100"
      }`}
      onClick={() => setActive(!active)}
    >
      <span
        className={`text-[14.5px] font-semibold tracking-wide ${isDark ? "text-[#e8ecf2]" : "text-slate-700"}`}
      >
        {label}
      </span>

      {/* Toggle Track */}
      <div
        className={`relative w-12 h-[26px] rounded-full transition-colors duration-300 shadow-inner ${
          active
            ? isDark
              ? "bg-orange-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),_0_0_8px_rgba(249,115,22,0.3)]"
              : "bg-orange-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),_0_2px_6px_rgba(249,115,22,0.3)]"
            : isDark
              ? "bg-[#0a0b0e] shadow-[inset_0_3px_6px_rgba(0,0,0,0.9)]"
              : "bg-[#ced6e0] shadow-[inset_2px_2px_5px_rgba(165,175,190,0.6)]"
        }`}
      >
        {/* Toggle Thumb */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full transition-all duration-300 ${
            active ? "left-[calc(100%-23px)]" : "left-[3px]"
          } ${
            isDark
              ? "bg-[#e8ecf2] shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
              : "bg-white shadow-[0_2px_4px_rgba(0,0,0,0.15)]"
          }`}
        />
      </div>
    </div>
  );
};

const VideoPlayerOverlay = ({
  theme = "dark",
  open,
  onClose,
}: {
  theme?: "dark" | "light";
  open: boolean;
  onClose: () => void;
}) => {
  const isDark = theme === "dark";
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`fixed inset-0 m-auto w-[90vw] max-w-[600px] h-[400px] rounded-[32px] overflow-hidden flex flex-col z-[110] shadow-[0_40px_80px_rgba(0,0,0,0.6)] ${
            isDark
              ? "bg-[#13151b] border border-white/10"
              : "bg-[#e2e8f0] border border-white"
          }`}
        >
          {/* Top Bar overlay */}
          <div className="absolute top-0 w-full p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
            <span className="text-white font-bold tracking-widest text-[11px] uppercase drop-shadow">
              Media Player
            </span>
            <div
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center cursor-pointer text-white"
            >
              <X size={16} strokeWidth={2.5} />
            </div>
          </div>

          {/* Main Video Area Mock */}
          <div className="flex-1 bg-black relative flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1425&q=80"
              className="opacity-80 w-full h-full object-cover"
              alt="Video frame"
            />
            <div className="absolute w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95 shadow-2xl border border-white/20">
              <Play size={28} className="text-white fill-current ml-1" />
            </div>
          </div>

          {/* Bottom Bar overlay */}
          <div
            className={`p-4 flex flex-col gap-3 relative z-10 ${isDark ? "bg-[#1a1d24]/90 backdrop-blur" : "bg-[#f4f7f9]/90 backdrop-blur"}`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className={isDark ? "text-gray-400" : "text-slate-500"}>
                0:42
              </span>
              <span className={isDark ? "text-gray-400" : "text-slate-500"}>
                2:30
              </span>
            </div>
            <div
              className={`h-1.5 w-full rounded-full cursor-pointer relative ${isDark ? "bg-black/30" : "bg-black/10"}`}
            >
              <div className="absolute top-0 left-0 h-full w-[35%] rounded-full bg-orange-500" />
              <div className="absolute top-1/2 left-[35%] -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md border border-black/10" />
            </div>
            <div className="flex justify-between items-center mt-2 px-2">
              <Volume2
                size={18}
                className={isDark ? "text-gray-400" : "text-slate-500"}
              />
              <Maximize2
                size={16}
                className={isDark ? "text-gray-400" : "text-slate-500"}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const formatTime = (time: number) => {
  if (isNaN(time)) return "0:00";
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// --- App Composition ---

const NotificationMockup = ({
  theme = "dark",
}: {
  theme?: "dark" | "light";
}) => {
  const isDark = theme === "dark";
  const [isVisible, setIsVisible] = useState(true);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(e, { offset, velocity }) => {
            if (
              offset.x > 100 ||
              offset.x < -100 ||
              velocity.x > 300 ||
              velocity.x < -300
            ) {
              setIsVisible(false);
            }
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ delay: 1, type: "spring", stiffness: 300, damping: 20 }}
          className={`absolute top-28 left-1/2 -translate-x-1/2 w-[340px] p-4 rounded-[24px] flex items-center gap-4 z-50 cursor-pointer ${
            isDark
              ? "bg-[#1a1d24] shadow-[0_20px_40px_rgba(0,0,0,0.6),_inset_0_1.5px_2px_rgba(255,255,255,0.08),_inset_0_-2px_4px_rgba(0,0,0,0.8)] border border-white/[0.04]"
              : "bg-[#eaeff4] shadow-[-6px_-6px_14px_rgba(255,255,255,1),_12px_16px_30px_rgba(165,175,190,0.3),_inset_1.5px_1.5px_3px_rgba(255,255,255,1)] border border-white/80"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-400 to-orange-500 flex items-center justify-center shrink-0 shadow-[0_4px_10px_rgba(249,115,22,0.4)]">
            <Bell size={18} className="text-white" />
          </div>
          <div className="flex-1 flex flex-col justify-center pointer-events-none">
            <span
              className={`text-[13px] font-bold ${isDark ? "text-white" : "text-slate-800"}`}
            >
              New Update Available
            </span>
            <span
              className={`text-[11px] font-medium leading-tight mt-0.5 ${isDark ? "text-gray-400" : "text-slate-500"}`}
            >
              System features have been updated.
            </span>
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer relative z-10 ${isDark ? "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white" : "bg-black/5 text-slate-400 hover:bg-black/10 hover:text-black"} hover:scale-110 active:scale-95 transition-all`}
          >
            <X size={14} strokeWidth={3} />
          </div>

          <div
            className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-24 h-3 bg-orange-500 rounded-full blur-[10px] opacity-60 pointer-events-none ${!isDark ? "opacity-30" : ""}`}
          />
          <div
            className={`absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-12 h-[2px] bg-white rounded-full blur-[1px] opacity-50 pointer-events-none ${!isDark ? "opacity-30" : ""}`}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// New Messenger App
// New Messenger App
// New Messenger App
import { PhotoViewerOverlay } from "./components/PhotoViewer";
import { VoiceWaveform } from "./components/VoiceWaveform";
import { FloatingCallWidget } from "./components/FloatingCallWidget";
import { useAppStore } from './store';
import { cryptoCore } from './lib/cryptoCore';
import { useI18n } from './lib/i18n';
import { toast } from 'sonner';
import { Toaster } from 'sonner';

import { CreateChannelModal } from "./components/CreateChannelModal";
import { CreateBotModal } from "./components/CreateBotModal";
import { ChannelCommentsView } from "./components/ChannelCommentsView";
import { AccountSwitcher } from "./components/AccountSwitcher";
import { FormattedText } from "./components/FormattedText";
import { getICQEmojiPath, ICQ_EMOJI_MAP } from './lib/icqEmojis';
import type { Contact } from './types/contact';

// --- Mention & DND utilities ---
const MENTION_PATTERN = /@(\w+)/g;

const parseMentions = (text: string): { text: string; mentions: { name: string; index: number }[] } => {
  const mentions: { name: string; index: number }[] = [];
  let match;
  const regex = new RegExp(MENTION_PATTERN);
  while ((match = regex.exec(text)) !== null) {
    mentions.push({ name: match[1], index: match.index });
  }
  return { text, mentions };
};

const isDNDEnabled = () => {
  try {
    const dndEnabled = localStorage.getItem("app_dnd_enabled") === "true";
    const dndFrom = localStorage.getItem("app_dnd_from") || "22:00";
    const dndTo = localStorage.getItem("app_dnd_to") || "08:00";
    if (!dndEnabled) return false;
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentMinutes = hours * 60 + minutes;
    const [fromH, fromM] = dndFrom.split(':').map(Number);
    const [toH, toM] = dndTo.split(':').map(Number);
    const fromMinutes = fromH * 60 + fromM;
    const toMinutes = toH * 60 + toM;
    if (fromMinutes <= toMinutes) {
      return currentMinutes >= fromMinutes && currentMinutes <= toMinutes;
    } else {
      return currentMinutes >= fromMinutes || currentMinutes <= toMinutes;
    }
  } catch {
    return false;
  }
};

const isPriorityContact = (contactName: string) => {
  try {
    const priorityStr = localStorage.getItem("app_priority_contacts");
    if (!priorityStr) return false;
    const names = JSON.parse(priorityStr);
    return names.some((n: string) => contactName.toLowerCase().includes(n.toLowerCase()) || n.toLowerCase().includes(contactName.toLowerCase()));
  } catch {
    return false;
  }
};

// --- Sticker Picker ---
const STICKER_PACKS = [
  { id: 'default', name: 'Default', stickers: ['👍', '❤️', '😂', '🔥', '😢', '🎉', '👋', '💀', '👑', '🔻', '😎', '🥳'] },
  { id: 'animals', name: 'Animals', stickers: ['🐱', '🐶', '🐾', '🦋', '🐮', '🐸'] },
  { id: 'nature', name: 'Nature', stickers: ['🌸', '🌿', '🌺', '🍃', '🌻', '🍀'] },
  { id: 'food', name: 'Food', stickers: ['🍕', '🍔', '🍱', '🍷', '☕', '🍯'] },
];
const STICKER_EMOJI = ['😀', '😂', '🤣', '🤔', '😍', '😎', '🤖', '🥺', '😱', '🤯', '🫡', '🥳'];

const UNICODE_TO_ICQ: Record<string, string> = {
  '👍': 'ok', '❤️': 'heart', '😂': 'lol', '😢': 'sad', '🎉': 'party2',
  '👋': 'hi', '👑': 'king', '😎': 'biggrin', '🥳': 'yahoo', '😀': 'smile',
  '🤣': 'rofl', '😍': 'girl_in_love', '🥺': 'sorry2', '😱': 'scare',
  '🤯': 'mega_shock', '🔥': 'hot', '💀': 'vampire',
};

const StickerPicker = ({ theme, onSelect, onClose }: { theme: 'light' | 'dark'; onSelect: (emoji: string) => void; onClose: () => void }) => {
  const { t } = useI18n();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  
  const allPacks = [
    { id: 'icq', name: t('stickers.icq'), stickers: ICQ_EMOJI_MAP.map(e => e.id) },
    ...STICKER_PACKS,
    { id: 'emoji', name: t('stickers.emoji'), stickers: STICKER_EMOJI },
  ];
  const filteredPacks = activeTab === 'all' ? allPacks : allPacks.filter(p => p.id === activeTab);
  const visiblePacks = search ? filteredPacks.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) : filteredPacks;
  
  return (
    <div className="w-full max-w-full flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
        {[{ id: 'all', label: t('stickers.all') }, { id: 'icq', label: t('stickers.icq') }, { id: 'emoji', label: t('stickers.emoji') }, ...STICKER_PACKS.map(p => ({ id: p.id, label: t('stickers.' + p.id) }))].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors shrink-0 ${activeTab === tab.id ? (isDark ? 'bg-orange-500 text-white' : 'bg-orange-500 text-white') : (isDark ? 'bg-white/5 text-gray-400' : 'bg-black/5 text-slate-500')}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="relative">
        <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('stickers.searchPlaceholder')}
          className={`w-full pl-7 pr-4 py-2 rounded-xl text-[12px] outline-none ${isDark ? 'bg-white/5 text-white' : 'bg-black/5 text-slate-800'}`}
        />
      </div>
      
      <div className={`flex flex-col gap-2 max-h-[200px] overflow-y-auto ${isDark ? 'scrollbar-dark' : 'scrollbar-light'}`}>
        {visiblePacks.map(pack => (
          <div key={pack.id} className="flex flex-col gap-1">
            <div className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{pack.name}</div>
            <div className="flex gap-1 flex-wrap">
              {pack.stickers.map((st, idx) => (
                <button
                  key={`${pack.id}-${idx}`}
                  onClick={() => { onSelect(pack.id === 'icq' ? `icq:${st}` : st); onClose(); }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl hover:scale-110 transition-transform ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                >
                  {pack.id === 'icq' ? (
                    <img src={getICQEmojiPath(st, theme)} alt={st} className="w-7 h-7 object-contain" />
                  ) : pack.id === 'default' && UNICODE_TO_ICQ[st] ? (
                    <img src={getICQEmojiPath(UNICODE_TO_ICQ[st], theme)} alt={st} className="w-7 h-7 object-contain" />
                  ) : (
                    st
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import { LiveVoiceRecorder } from "./components/LiveVoiceRecorder";

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
];

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('app_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'dark';
  });
  const { t, setLang } = useI18n();
  const [language, setLanguage] = useState(() => localStorage.getItem('app_language') || 'en');
  const [showLangMenu, setShowLangMenu] = useState(false);

  const { 
    appLockHashedPIN, appLockSalt, chats, setChats, channels, setChannels, bots, setBots,
    scheduledQueue,
    archivedChats, toggleArchive,
    readReceipts, deliveryReceipts, typingIndicators,
    contacts, setContacts
  } = useAppStore();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activeStory, setActiveStory] = useState<{ id: number, name: string, color: string } | null>(null);
  const [replyTarget, setReplyTarget] = useState<any>(null);
  const [savedMessages, setSavedMessages] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem("mess_saved_messages");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showCreateBot, setShowCreateBot] = useState(false);
  const [globalSelectedContact, setGlobalSelectedContact] = useState<ContactProfile | null>(null);
  const [draftTextByChat, setDraftTextByChat] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem("mess_drafts");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("mess_drafts", JSON.stringify(draftTextByChat));
  }, [draftTextByChat]);

  useEffect(() => {
    localStorage.setItem("mess_saved_messages", JSON.stringify(savedMessages));
  }, [savedMessages]);

  const getPrivacyLastSeenLabel = (contact: any) => {
    if (typingIndicators && contact?.online) return "typing...";
    if (contact?.lastSeen === undefined) return undefined;
    if (!contact?.online && contact.lastSeen > 0) {
      return contact.lastSeen < 60000 ? "Active Now" : contact.lastSeen < 3600000 ? `${Math.floor(contact.lastSeen / 60000)}m ago` : contact.lastSeen < 86400000 ? `${Math.floor(contact.lastSeen / 3600000)}h ago` : `${Math.floor(contact.lastSeen / 86400000)}d ago`;
    }
    return contact.online ? "Active Now" : undefined;
  };
  
  useEffect(() => {
    if (chats.length === 0) setChats(MOCK_CHATS);
    if (contacts.length === 0) {
      setContacts([
        { name: "Alice", id: "5a2f...9b1c", color: "from-rose-400 to-red-500", lastSeen: 1000 * 60 * 5 },
        { name: "Bob (Relay)", id: "node_f88b", color: "from-blue-400 to-indigo-500", lastSeen: 1000 * 60 * 60 * 2 },
        { name: "Charlie", id: "3c4d...5e6f", color: "from-amber-400 to-orange-400", lastSeen: 1000 * 60 * 30 },
        { name: "Diana", id: "7g8h...9i0j", color: "from-purple-400 to-fuchsia-400", lastSeen: 1000 * 60 * 60 * 24 },
      ]);
    }
    // Push mock channels as P2PChannels mapping if empty
    if (channels.length === 0) {
      setChannels(MOCK_CHANNELS.map(c => ({
         id: c.id.toString(),
         name: c.name,
         ownerPublicKey: "MOCK_OWNER",
         ownerId: "mock1",
         subscribers: [],
         subscriberCount: 15,
         postCount: c.history.length,
         isPrivate: false,
         isPublic: true,
         createdAt: Date.now(),
         // Keeping mock properties for UI compatibility for now:
         color: c.color,
         message: c.message,
         time: c.time,
         unread: c.unread,
         isChannel: true,
         history: c.history
      })) as any);
    }
  }, []);

  // Check scheduled messages periodically
  useEffect(() => {
    if (!scheduledQueue || scheduledQueue.messages.length === 0) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const messagesToSend = scheduledQueue.messages.filter(msg => msg.scheduledAt <= now);
      
      if (messagesToSend.length > 0) {
        setChats(prevChats => {
           let updatedChats = [...prevChats];
           for (const msg of messagesToSend) {
               const chatIndex = updatedChats.findIndex(c => c.id === msg.chatId);
               if (chatIndex > -1) {
                  const chat = updatedChats[chatIndex];
                  const newHistory = [...(chat.history || []), {
                     id: Date.now() + Math.random(), // Ensure unique ID
                     text: msg.text,
                     sender: "me",
                     status: "delivered"
                  }];
                  updatedChats[chatIndex] = { ...chat, history: newHistory, message: msg.text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
               }
           }
           return updatedChats;
        });

        messagesToSend.forEach(msg => scheduledQueue.removeMessage(msg.id));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [scheduledQueue, setChats]);

  // Handle App Lock authentication logic
  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!appLockHashedPIN || !appLockSalt) return;
    
    const hashed = await cryptoCore.hashAppLockPIN(pinInput, appLockSalt);
    if (hashed.hash === appLockHashedPIN) {
       setIsUnlocked(true);
       setPinError(false);
    } else {
       setPinError(true);
       setPinInput('');
    }
  };

  const [view, setView] = useState<'hub' | 'chats' | 'channels' | 'bots' | 'radar' | 'pulse' | 'calls' | 'settings' | 'contacts' | 'stories' | 'recordings'>('hub');
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceNoteError, setVoiceNoteError] = useState("");
   const [showPreview, setShowPreview] = useState(false);
   const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);
   const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [morseMode, setMorseMode] = useState(false);
  const [silentMode, setSilentMode] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [showAdvancedFilterModal, setShowAdvancedFilterModal] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({ hasMedia: false, hasAudio: false, hasReplies: false, fromBots: false, priority: false });
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  
  const isDark = theme === 'dark';
  const currentChatList = chats;

  const archivedUnreadCount = React.useMemo(() => {
     let count = 0;
     chats.forEach(c => { if (archivedChats.includes(c.id)) count += c.unread || 0; });
     channels.forEach(c => { if (archivedChats.includes(c.id)) count += (c as any).unread || 0; });
     return count;
  }, [chats, channels, archivedChats]);

  // Compute mention flags for each chat (check for @current_user mentions)
  const MENTIONED_USER = "user";
  const mentionCounts = useMemo(() => {
     const counts: Record<string, number> = {};
     const allChats = [...chats, ...channels] as any[];
     allChats.forEach(c => {
       const history = c.history || [];
       let count = 0;
       history.forEach((msg: any) => {
         if (msg.mentions && msg.mentions.some((m: any) => m.name === MENTIONED_USER)) {
           count++;
         } else if (msg.text && new RegExp(`@${MENTIONED_USER}`, 'i').test(msg.text)) {
           count++;
         }
       });
       if (count > 0) {
         counts[c.id] = count;
         // Update the chat with hasMentions flag
         if (c.history) {
           c.hasMentions = true;
         }
       }
     });
     return counts;
  }, [chats, channels]);

  const filteredChats = useMemo(() => currentChatList.filter(chat => {
    const query = chatSearchQuery.toLowerCase().trim();
    const historyText = (chat.history || [])
      .flatMap((m: any) => [m.text, m.replyTo?.text, m.duration, m.sender].filter(Boolean))
      .join(" ")
      .toLowerCase();
    const matchesSearch =
      !query ||
      chat.name.toLowerCase().includes(query) ||
      (chat.message || "").toLowerCase().includes(query) ||
      historyText.includes(query);
    if (!matchesSearch) return false;
    
    // advanced filters
    if (advancedFilters.hasMedia && !(chat.history || []).some((m: any) => m.type === "image" || m.type === "video")) return false;
    if (advancedFilters.hasAudio && !(chat.history || []).some((m: any) => m.type === "audio")) return false;
    if (advancedFilters.hasReplies && !(chat.history || []).some((m: any) => !!m.replyTo)) return false;
    if (advancedFilters.fromBots && chat.type !== 'bot') return false; 
    if (advancedFilters.priority && !chat.isPriority) return false;

    const isArchived = archivedChats.includes(chat.id);
if (activeFolder === 'archived') return isArchived;
    if (isArchived) return false;
    
    if (activeFolder === 'unread') return chat.unread > 0;
    if (activeFolder === 'personal') return chat.name === 'Alice Freeman'; 
    if (activeFolder === 'work') return chat.name === 'Design Team'; 
    return true; 
  }), [currentChatList, chatSearchQuery, activeFolder, archivedChats, advancedFilters]);
  
  const filteredChannels = useMemo(() => channels.filter(channel => {
    const query = chatSearchQuery.toLowerCase().trim();
    const historyText = ((channel as any).history || [])
      .flatMap((m: any) => [m.text, m.replyTo?.text, m.duration, m.sender].filter(Boolean))
      .join(" ")
      .toLowerCase();
    const matchesSearch = !query || channel.name.toLowerCase().includes(query) || (channel as any).message?.toLowerCase().includes(query) || historyText.includes(query);
    if (!matchesSearch) return false;
    const isArchived = archivedChats.includes(channel.id);
    if (activeFolder === 'archived') return isArchived;
    if (isArchived) return false;
    return true;
  }), [channels, chatSearchQuery, activeFolder, archivedChats]);

 const sendVoiceMessage = (audioUrl: string, durationStr: string) => {
     // DND enforcement - block non-priority voice messages during DND
     if (isDNDEnabled() && !isPriorityContact(activeChat?.name || "")) {
       toast("Voice message blocked - DND is active. Priority contacts can bypass.", { duration: 3000 });
       return;
     }

     const newMessage = {
       id: Date.now(),
       sender: "me",
       text: "",
       type: "audio",
       audioUrl,
       duration: durationStr,
       replyTo: replyTarget ? {
         id: replyTarget.id,
         sender: replyTarget.sender,
         text: replyTarget.text,
         type: replyTarget.type,
         duration: replyTarget.duration
       } : undefined,
       time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
       status: "sent",
       silent: silentMode
    };

    setChats(prevChats => prevChats.map(c => {
      if (activeChat && c.id === activeChat.id) {
         return { ...c, history: [...(c.history || []), newMessage] };
      }
      return c;
    }));

    setActiveChat((prev: any) => {
      if (!prev) return prev;
      return { ...prev, history: [...(prev.history || []), newMessage] };
    });
    setReplyTarget(null);
   };

   const sendStickerMessage = (sticker: string) => {
     if (!activeChat || !sticker) return;
     // DND enforcement - block non-priority sticker messages during DND
     if (isDNDEnabled() && !isPriorityContact(activeChat?.name || "")) {
       toast("Sticker blocked - DND is active. Priority contacts can bypass.", { duration: 3000 });
       return;
     }
     
     const newMessage = {
       id: Date.now(),
       sender: "me",
       text: sticker,
       type: "sticker",
       replyTo: replyTarget ? {
         id: replyTarget.id,
         sender: replyTarget.sender,
         text: replyTarget.text,
         type: replyTarget.type,
         duration: replyTarget.duration
       } : undefined,
       time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
       status: "sent",
       silent: silentMode
     };

     setChats(prevChats => prevChats.map(c => {
       if (activeChat.id === c.id) {
          return { ...c, history: [...(c.history || []), newMessage] };
       }
       return c;
     }));

     setActiveChat((prev: any) => {
       if (!prev) return prev;
       return { ...prev, history: [...(prev.history || []), newMessage] };
     });

     setReplyTarget(null);
     setShowStickerPicker(false);
   };

   const handleSendMessage = () => {
     if (!messageText.trim() && !morseMode) return;
     
     const sentText = morseMode && messageText ? encodeMorse(messageText) : messageText.trim();
     if (!sentText) return;

     // DND enforcement - block non-priority messages during DND
     if (isDNDEnabled() && !isPriorityContact(activeChat?.name || "")) {
       toast("Message blocked - DND is active. Priority contacts can bypass.", { duration: 3000 });
       return;
     }

     if (scheduleDateTime) {
      const scheduledTimeMs = new Date(scheduleDateTime).getTime();
      if (scheduledTimeMs > Date.now()) {
        scheduledQueue.addMessage({
          id: `sched_${Date.now()}`,
          chatId: activeChat?.id as string | number,
          text: sentText,
          scheduledAt: scheduledTimeMs
        });
        setMessageText("");
        setScheduleDateTime("");
        return;
      }
    }

    // Parse @mentions in the message text
     const { text: parsedText, mentions } = parseMentions(sentText);

     const newMessage = {
       id: Date.now(),
       sender: "me",
       text: parsedText,
       mentions: mentions.length > 0 ? mentions : undefined,
      replyTo: replyTarget ? {
        id: replyTarget.id,
        sender: replyTarget.sender,
        text: replyTarget.text,
        type: replyTarget.type,
        duration: replyTarget.duration
      } : undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "sent",
      silent: silentMode
    };

    setChats(prevChats => prevChats.map(c => {
      if (activeChat && c.id === activeChat.id) {
         return { ...c, history: [...(c.history || []), newMessage] };
      }
      return c;
    }));

    setActiveChat((prev: any) => {
      if (!prev) return prev;
      return { ...prev, history: [...(prev.history || []), newMessage] };
    });

    setMessageText("");
    setSilentMode(false);
    setReplyTarget(null);
    if (activeChat) {
      setDraftTextByChat(prev => ({ ...prev, [String(activeChat.id)]: "" }));
    }

    const msgId = newMessage.id;
    setTimeout(() => {
      updateMessageStatus(msgId, "delivered");
    }, 1000);
  };

  const toggleSavedMessage = (chatContext: any, msg: any) => {
    if (!chatContext || !msg) return;
    setSavedMessages(prev => {
      const existingIndex = prev.findIndex(item => item.chatId === chatContext.id && item.messageId === msg.id);
      if (existingIndex > -1) {
        return prev.filter((_, index) => index !== existingIndex);
      }
      const preview =
        msg.type === "audio"
          ? `Voice note · ${msg.duration || "0:00"}`
          : msg.type === "image"
            ? "Photo"
            : msg.type === "video"
              ? "Video"
              : msg.text || "Message";
      return [
        ...prev,
        {
          key: `${chatContext.id}_${msg.id}`,
          chatId: chatContext.id,
          chatName: chatContext.name,
          messageId: msg.id,
          sourceLabel: chatContext.name,
          preview: typeof preview === "string" ? preview.slice(0, 180) : "Message",
          time: msg.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ];
    });
  };

  const updateMessageStatus = (msgId: number, status: string) => {
    setChats(prevChats => prevChats.map(c => {
      if (!c.history) return c;
      const updatedHistory = c.history.map((m: any) => m.id === msgId ? { ...m, status } : m);
      return { ...c, history: updatedHistory };
    }));
    setActiveChat((prev: any) => {
      if (!prev) return prev;
      const updatedHistory = prev.history.map((m: any) => m.id === msgId ? { ...m, status } : m);
      return { ...prev, history: updatedHistory };
    });
  };

  useEffect(() => {
    if (!activeChat) return;
    const savedDraft = draftTextByChat[String(activeChat.id)] || "";
    setMessageText(savedDraft);
  }, [activeChat?.id]);

  const store = useAppStore();

  const chatsUnread = store.chats.reduce((sum, c) => sum + (c.unread || 0), 0);
  const channelsUnread = store.channels.reduce((sum, c) => sum + ((c as any).unread || 0), 0);
  const missedCalls = [...MOCK_CALLS].filter((c) => c.type === 'missed').length + (store.activeCall ? 1 : 0);

  const hubBadges: Record<string, number> = {
    chats: chatsUnread,
    channels: channelsUnread,
    calls: missedCalls,
  };

  const hubItems = [
    { id: 'channels', angle: 0, title: t('hub.channels'), subtitle: t('hub.channelsSubtitle'), icon: Hash },
    { id: 'chats', angle: 30, title: t('hub.chats'), subtitle: t('hub.chatsSubtitle'), icon: MessageCircle },
    { id: 'pulse', angle: 90, title: t('hub.metropulse'), subtitle: t('hub.metropulseSubtitle'), icon: Activity },
    { id: 'radar', angle: 150, title: t('hub.radar'), subtitle: t('hub.radarSubtitle'), icon: Target },
    { id: 'contacts', angle: 180, title: t('hub.contacts'), subtitle: t('hub.contactsSubtitle'), icon: Users },
    { id: 'calls', angle: 210, title: t('hub.calls'), subtitle: t('hub.callsSubtitle'), icon: Phone },
    { id: 'recordings', angle: 240, title: t('hub.recordings'), subtitle: t('hub.recordingsSubtitle'), icon: Mic },
    { id: 'bots', angle: 270, title: t('hub.bots'), subtitle: t('hub.botsSubtitle'), icon: Bot },
    { id: 'settings', angle: 330, title: t('hub.settings'), subtitle: t('hub.settingsSubtitle'), icon: Settings },
  ];

  if (appLockHashedPIN && !isUnlocked) {
    return (
      <div className={`w-full h-[100dvh] flex flex-col items-center justify-center font-sans ${isDark ? "bg-[#0d1017] text-white" : "bg-[#eaeff4] text-slate-800"}`}>
         <div className={`p-8 rounded-3xl flex flex-col items-center max-w-sm w-full mx-4 shadow-2xl ${isDark ? "bg-[#11141c] border border-white/10" : "bg-white border border-black/5"}`}>
            <Lock size={48} className={`mb-6 ${isDark ? "text-orange-500" : "text-orange-600"}`} />
            <h2 className="text-2xl font-bold mb-2 text-center">{t('lock.title')}</h2>
            <p className={`text-sm mb-6 text-center ${isDark ? "text-gray-400" : "text-slate-500"}`}>
               {t('lock.description')}
            </p>
            <form onSubmit={handleUnlock} className="w-full">
               <input 
                 type="password" 
                 value={pinInput}
                 onChange={e => setPinInput(e.target.value)}
                 autoFocus
                 className={`w-full text-center tracking-[0.5em] text-2xl font-mono py-4 rounded-xl border mb-4 focus:outline-none transition-colors ${
                    isDark 
                      ? "bg-[#16181d] border-white/10 focus:border-orange-500/50" 
                      : "bg-[#f4f7f9] border-black/10 focus:border-orange-500/50"
                 } ${pinError ? "border-red-500 text-red-500" : ""}`}
                 placeholder="****"
               />
               <button 
                 type="submit"
                 className={`w-full py-4 rounded-xl font-bold text-lg transition-transform hover:scale-[1.02] active:scale-95 ${
                    isDark
                      ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg"
                      : "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg"
                 }`}
               >
                  {t('lock.unlock')}
               </button>
            </form>
         </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" duration={3000} />
      <div className={`w-full h-[100dvh] flex flex-col items-center justify-center font-sans select-none overflow-hidden relative ${isDark ? "bg-[#0d1017] text-white" : "bg-[#eaeff4] text-slate-800"}`}>
      {isDark && (
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />
      )}
      
      {/* Bottom-left Controls: Theme Toggle */}
      <div className="absolute bottom-6 left-6 flex items-center gap-3 z-50">
        {/* Beautiful Sliding Theme Toggle */}
        <div 
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          title={isDark ? t('common.switchToLight') : t('common.switchToDark')}
          className={`w-[72px] h-10 rounded-full flex items-center p-1 cursor-pointer backdrop-blur-md transition-colors ${
            isDark 
              ? "bg-[#11141c]/80 border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.6)] hover:bg-[#11141c]" 
              : "bg-[#e2e8f0]/80 border border-black/5 shadow-[inset_0_2px_10px_rgba(165,175,190,0.3)] hover:bg-[#e2e8f0]"
          }`}
        >
          <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
            <Moon size={14} className={isDark ? "text-transparent" : "text-slate-400/50"} />
            <Sun size={14} className={isDark ? "text-gray-600/50" : "text-transparent"} />
          </div>
          <motion.div
            className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 ${
              isDark 
                ? "bg-gradient-to-br from-[#2a2d36] to-[#1f222a] text-orange-400 border border-white/5 shadow-[0_4px_12px_rgba(0,0,0,0.8),_inset_0_2px_2px_rgba(255,255,255,0.1)]" 
                : "bg-gradient-to-br from-white to-[#f8fafc] text-orange-500 border border-black/5 shadow-[0_4px_12px_rgba(165,175,190,0.4),_inset_0_2px_2px_rgba(255,255,255,1)]"
          }`}
            initial={false}
            animate={{ x: isDark ? 32 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <motion.div
              initial={false}
              animate={{ rotate: isDark ? 360 : 0 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              {isDark ? <Moon size={16} className="drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]" /> : <Sun size={16} className="drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" />}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom-right Controls: Language Selector */}
      <div className="absolute bottom-6 right-6 flex items-center gap-3 z-50">
        {/* Language Selector */}
        <div className="relative group">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all ${
              isDark 
                ? "bg-[#11141c]/80 border border-white/10 hover:bg-white/10" 
                : "bg-[#e2e8f0]/80 border border-black/5 hover:bg-white shadow-md"
            }`}
            title={t('common.selectLanguage')}
          >
            <Globe size={16} className={isDark ? "text-gray-400" : "text-slate-500"} />
          </button>
          <AnimatePresence>
            {showLangMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-full right-0 mb-2 w-40 rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.4)] z-50"
              >
                <div className={isDark ? "bg-[#1a1d24] border border-white/10" : "bg-white border border-black/5"}>
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { setLanguage(lang.code); setLang(lang.code); setShowLangMenu(false); }}
                      className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors ${language === lang.code ? (isDark ? "bg-orange-500/20" : "bg-orange-500/10") : ""}`}
                    >
                      <span className="text-2xl">{lang.flag}</span>
                      <span className={`font-medium ${isDark ? "text-white" : "text-slate-800"}`}>{lang.name}</span>
                      {language === lang.code && <Check size={16} className="ml-auto text-orange-500" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'hub' ? (
          <motion.div 
            key="hub-view"
            className="flex-1 w-full h-[100dvh] bg-transparent flex flex-col items-center justify-center relative z-10"
          >
            <AccountSwitcher theme={theme} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 scale-[0.45] min-[400px]:scale-[0.5] sm:scale-[0.6] md:scale-90 lg:scale-100 flex-1 flex flex-col items-center justify-center"
            >
               <RadialMenu 
                 theme={theme} 
                 items={hubItems} 
                 badges={hubBadges}
                 centerTitle={t('hub.centerTitle')} 
                 centerSubtitle={t('hub.centerSubtitle')} 
                 onCenterClick={() => {}} 
                 onItemClick={(id) => setView(id as any)}
               />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            key="content-view"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3 }}
            className="flex-1 w-full max-w-4xl mx-auto flex flex-col relative z-20 pt-8 pb-24 h-full min-h-0"
          >
            {/* Top Back/Title Bar */}
            <div className="flex items-center gap-4 px-8 py-4 mb-4">
              <div 
                onClick={() => {
                  if (activeChat) setActiveChat(null);
                  else setView('hub');
                }}
                title={t('chat.goBack')}
                className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 ${isDark ? "bg-[#1a1d24] border border-white/10 hover:bg-white/10" : "bg-[#f4f7f9] border border-black/10 hover:bg-white shadow-md"}`}
              >
                <ChevronRight size={24} className="rotate-180" />
              </div>
              <h2 className="text-2xl font-sans tracking-wide capitalize">
                {activeChat ? activeChat.name : t(`hub.${view}` as any)}
              </h2>
            </div>
            
            {/* Content Switcher */}
            <div className="flex-1 w-full overflow-hidden relative px-4 flex flex-col items-center min-h-0">
              {view === 'pulse' && <SystemPulsePlayer theme={theme} />}
              {view === 'radar' && <MeshRadar theme={theme} />}
{view === 'calls' && <Dialpad 
                theme={theme} 
                contacts={contacts}
                showContactPicker={showContactPicker}
                setShowContactPicker={setShowContactPicker}
                setEditingContact={setEditingContact}
                 onCall={(name, color) => {
                    useAppStore.getState().setActiveCall({ number: name, startTime: Date.now(), isMuted: false, isSpeaker: false });
                    setView('calls');
                 }} 
                 onMessage={(name, color) => {
                    setView('chats');
                    const existingChat = chats.find(c => c.name === name && c.type === 'direct');
                    if (existingChat) {
                       setActiveChat(existingChat);
                    } else {
                       const newChat = { id: Date.now(), name, type: "direct", color: color || "from-blue-400 to-indigo-500", online: true, history: [] };
                       setChats([newChat, ...chats]);
                       setActiveChat(newChat);
                    }
                 }} 
               />}
                {view === 'settings' && <SettingsView theme={theme} setTheme={setTheme} />}
                {view === 'recordings' && <RecordingsScreen theme={theme} onBack={() => setView('hub')} />}
                {view === 'contacts' && <ContactsView 
                 theme={theme} 
                 contacts={contacts}
                 setContacts={setContacts}
                 onCall={(name, color) => {
                    useAppStore.getState().setActiveCall({ number: name, startTime: Date.now(), isMuted: false, isSpeaker: false });
                    setView('calls');
                 }}
                onMessage={(name, color) => {
                   setView('chats');
                   const existingChat = chats.find(c => c.name === name && c.type === 'direct');
                   if (existingChat) {
                      setActiveChat(existingChat);
                   } else {
                      const newChat = { id: Date.now(), name, type: "direct", color: color || "from-blue-400 to-indigo-500", online: true, history: [] };
                      setChats([newChat, ...chats]);
                      setActiveChat(newChat);
                   }
                }} 
              />}
              
              {(view === 'chats' || view === 'channels' || view === 'bots' || view === 'stories') && (
                !activeChat ? (
                  <div className={`w-full max-w-[400px] flex-1 flex flex-col overflow-y-auto rounded-[32px] p-6 mb-8 ${isDark ? "bg-[#11141c]/50 border border-white/5 scrollbar-dark" : "bg-[#eaeff4]/50 border border-black/5 shadow-inner scrollbar-light"}`}>
                    <div className="mb-6 relative z-30 flex items-center gap-3 shrink-0">
                      <div className="flex-1">
                          {isDark ? (
                              <DarkSearchBar searchQuery={chatSearchQuery} onSearchChange={setChatSearchQuery} placeholder={view === 'channels' ? t('chat.searchChannelsPlaceholder') : view === 'bots' ? t('chat.searchBotsPlaceholder') : t('chat.searchPlaceholder')} />
                           ) : (
                              <LightSearchBar searchQuery={chatSearchQuery} onSearchChange={setChatSearchQuery} placeholder={view === 'channels' ? t('chat.searchChannelsPlaceholder') : view === 'bots' ? t('chat.searchBotsPlaceholder') : t('chat.searchPlaceholder')} />
                          )}
                      </div>
                      {(view === 'channels' || view === 'bots') ? (
                         <div
                            onClick={() => view === 'channels' ? setShowCreateChannel(true) : setShowCreateBot(true)}
                            title={view === 'channels' ? t('chat.createChannel') : t('chat.createBot')}
                            className={`w-[48px] h-[48px] rounded-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 flex-shrink-0 relative ${isDark ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30" : "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 shadow-sm"}`}
                         >
                            <Plus size={24} />
                         </div>
                      ) : (
                          <div 
                             title={t('chat.archived')}
                             onClick={() => { setView('chats'); setActiveFolder('archived'); }}
                            className={`w-[48px] h-[48px] rounded-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 flex-shrink-0 relative ${isDark ? "bg-[#1a1d24] border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white" : "bg-white border border-black/5 hover:bg-black/5 text-slate-500 hover:text-slate-800 shadow-sm"}`}
                         >
                            <Archive size={20} />
                            {/* Unread Archive Badge */}
                            {archivedUnreadCount > 0 && (
                               <div className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md border-[2px] border-[#eaeff4] dark:border-[#11141c] px-1">
                                  {archivedUnreadCount}
                               </div>
                            )}
                         </div>
                      )}
                    </div>
                    
                    {/* TOP-LEVEL TAB BAR */}
                    <div className={`flex items-center gap-5 mb-6 px-1 border-b pb-3 overflow-x-auto scrollbar-none shrink-0 ${isDark ? "border-white/5" : "border-black/5"}`} onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
                        {[
                          { id: 'stories', label: t('chat.tabs.stories') },
                          { id: 'chats', label: t('chat.tabs.chats') },
                          { id: 'channels', label: t('chat.tabs.channels') },
                          { id: 'bots', label: t('chat.tabs.bots') }
                        ].map((tab) => (
                          <div
                             key={tab.id}
                             onClick={() => setView(tab.id as any)}
                             className={`text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors relative shrink-0 ${view === tab.id ? (isDark ? "text-orange-500" : "text-orange-600") : (isDark ? "text-gray-500 hover:text-gray-300" : "text-slate-400 hover:text-slate-600")}`}
                          >
                             {tab.label}
                             {view === tab.id && (
                                <motion.div layoutId="messengerTab" className={`absolute -bottom-[13px] left-0 right-0 h-[2px] rounded-full ${isDark ? "bg-orange-500" : "bg-orange-600"}`} />
                             )}
                          </div>
                       ))}
                    </div>

                    {view === 'stories' && <AvatarRow theme={theme} onStoryClick={setActiveStory} />}

                     {view === 'chats' && (
                        <div className="flex items-center gap-2 mb-6 -mx-2 px-2 shrink-0">
                          <div
                            className="flex-1 flex gap-2 overflow-x-auto scrollbar-none pb-1"
                            onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}
                          >
                             {['all', 'personal', 'unread', 'work', 'archived'].map(folder => (
                              <div 
                                key={folder}
                                onClick={() => setActiveFolder(folder)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-colors shrink-0 ${
                                   activeFolder === folder 
                                    ? (isDark ? "bg-orange-500 text-white" : "bg-orange-500 text-white shadow-md")
                                    : (isDark ? "bg-[#1a1d24] text-gray-400 hover:text-gray-200 border border-white/5" : "bg-white text-slate-500 hover:text-slate-800 border border-black/5 shadow-sm")
                                }`}
                              >
                                 {t('chat.folders.' + folder as any)}
                               </div>
                           ))}
                         </div>
                         <div onClick={() => setShowAdvancedFilterModal(true)} className={`p-1.5 rounded-full cursor-pointer shrink-0 transition-colors flex items-center justify-center ${advancedFilters.hasMedia || advancedFilters.hasAudio || advancedFilters.hasReplies || advancedFilters.fromBots || advancedFilters.priority ? (isDark ? "bg-orange-500 text-white" : "bg-orange-500 text-white shadow-md") : (isDark ? "bg-[#1a1d24] text-gray-400 hover:text-white border border-white/5" : "bg-white text-slate-500 hover:text-slate-800 border border-black/5 shadow-sm")}`}>
                            <ListFilter size={18} />
                         </div>
                       </div>
                    )}
                    
                    {/* Render Chats if view is chats */}
                    {view === 'chats' && filteredChats.length > 0 && (
                      <>
                         <div className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-4 shrink-0 ${isDark ? "text-orange-500" : "text-orange-600"}`}>{t('chat.sectionConversations')}</div>
                        {filteredChats.map(c => (
                          <ChatListItem 
                             key={c.id} 
                             chat={c} 
                             theme={theme} 
                             type="chat" 
                             active={false} 
                             onClick={() => setActiveChat(c)} 
                             onArchive={() => toggleArchive(c.id)}
                             onAvatarClick={() => {
                               const profileContact = contacts.find(ct => ct.name === c.name);
                               setGlobalSelectedContact({
                                 id: `hash_${c.id}`,
                                 name: c.name,
                                 color: c.color,
                                 lastSeen: c.online ? 0 : Date.now() - 3600000,
                                 online: c.online,
                                 localFields: profileContact?.localFields
                               });
                             }}
                          />
                        ))}
                      </>
                    )}
                    
                    {/* Render Channels if view is channels */}
                    {view === 'channels' && filteredChannels.length > 0 && (
                      <>
                         <div className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-4 shrink-0 ${isDark ? "text-purple-500" : "text-purple-600"}`}>{t('chat.sectionChannels')}</div>
                        {filteredChannels.map(c => (
                          <ChatListItem 
                             key={c.id} 
                             chat={c} 
                             theme={theme} 
                             type="channel" 
                             active={false} 
                             onClick={() => setActiveChat(c)} 
                             onArchive={() => toggleArchive(c.id)} 
                          />
                        ))}
                      </>
                    )}

                    {view === 'bots' && (
                      bots.length > 0 ? (
                        <>
                           <div className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-4 shrink-0 ${isDark ? "text-blue-500" : "text-blue-600"}`}>{t('chat.sectionBots')}</div>
                          {bots.map(b => (
                            <div key={b.id} className={`w-full p-4 rounded-3xl mb-4 flex flex-col gap-2 ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white border border-black/5 shadow-sm"}`}>
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center">
                                    <Bot size={20} />
                                  </div>
                                  <div className="flex-1">
                                     <h4 className="font-bold text-sm tracking-wide">{b.name}</h4>
                                     <p className={`text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>Token: {b.token.substring(0, 15)}...</p>
                                  </div>
                               </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className={`flex flex-col items-center justify-center py-10 opacity-60 ${isDark ? "text-white" : "text-black"}`}>
                          <Bot size={32} className={`mb-4 opacity-50 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                          <span className="text-[13px] text-center px-4">No bots created yet. Click + to create one.</span>
                        </div>
                      )
                    )}
                    
                    {view !== 'bots' && filteredChats.length === 0 && filteredChannels.length === 0 && (
                      <div className={`flex flex-col items-center justify-center py-10 opacity-60 ${isDark ? "text-white" : "text-black"}`}>
                        <Search size={24} className="mb-2" />
                        <span className="text-[13px]">No results found</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full max-w-[800px] h-[90%] relative z-10 animate-fade-in mt-6 max-h-[800px]">
                    <ChatPreviewLayer chat={activeChat} theme={theme} onClose={() => setActiveChat(null)} onUpdateChat={setActiveChat} onAction={(text: string) => text === "MUTE_TOGGLE" ? setActiveChat({ ...activeChat, isMuted: !activeChat.isMuted }) : setMessageText(text)} onCall={(name: string, color?: string) => { useAppStore.getState().setActiveCall({ number: name, startTime: Date.now(), isMuted: false, isSpeaker: false }); setView('calls'); }} onMessage={(name: string, color?: string) => { setView('chats'); const existingChat = chats.find(c => c.name === name && c.type === 'direct'); if (existingChat) { setActiveChat(existingChat); } else { const newChat = { id: Date.now(), name, type: "direct", color: color || "from-blue-400 to-indigo-500", online: true, history: [] }; setChats([newChat, ...chats] as any); setActiveChat(newChat); } }} onReply={(msg: any) => setReplyTarget(msg)} savedMessages={savedMessages} onToggleSavedMessage={toggleSavedMessage} deliveryReceipts={deliveryReceipts} readReceipts={readReceipts} setEditingContact={setEditingContact} />
                    
                    {/* Input Field Overlay */}
                    <div className={`absolute bottom-4 left-4 right-4 rounded-3xl p-3 flex flex-col gap-2 z-50 ${isDark ? "bg-[#1a1d24]/90 border border-white/10 backdrop-blur-xl" : "bg-white/90 border border-black/10 backdrop-blur-xl shadow-xl"}`}>
                      {showSchedulePopup && !activeChat.isChannel && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className={`w-full p-4 rounded-2xl flex flex-col gap-3 ${isDark ? "bg-[#13151b] border border-white/5" : "bg-white border border-black/5 shadow-sm"}`}
                        >
                           <div className="flex justify-between items-center">
                             <span className="text-xs font-bold uppercase tracking-widest text-orange-500">Schedule Send</span>
                             <X size={16} className={`cursor-pointer ${isDark ? "text-gray-400 hover:text-white" : "text-slate-400 hover:text-slate-800"}`} onClick={() => { setShowSchedulePopup(false); setScheduleDateTime(""); }} />
                           </div>
                           <input 
                              type="datetime-local" 
                              value={scheduleDateTime}
                              onChange={(e) => setScheduleDateTime(e.target.value)}
                              className={`w-full outline-none text-sm p-2 rounded-lg ${isDark ? "bg-[#1a1d24] text-white color-scheme-dark" : "bg-slate-50 text-slate-800"}`}
                           />
                           <div className="flex gap-2">
                             <button onClick={() => { setScheduleDateTime(''); setShowSchedulePopup(false); }} className={`flex-1 py-2 text-xs font-bold rounded-lg ${isDark ? "bg-white/5 text-gray-400 hover:bg-white/10" : "bg-black/5 text-slate-500 hover:bg-black/10"}`}>Cancel</button>
                             <button onClick={() => setShowSchedulePopup(false)} disabled={!scheduleDateTime} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${!scheduleDateTime ? "opacity-50 cursor-not-allowed" : ""} ${isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600"}`}>Set Time</button>
                           </div>
                        </motion.div>
                      )}
                      
                      {activeChat.isChannel ? (
                        <div className={`w-full py-2.5 rounded-2xl flex items-center justify-center cursor-pointer transition-colors font-medium text-sm tracking-wide ${isDark ? "bg-[#13151b] hover:bg-[#20242e] text-orange-400 border border-white/5" : "bg-white hover:bg-slate-50 text-orange-600 border border-black/5 shadow-sm"}`} onClick={() => {
                           setActiveChat({ ...activeChat, isMuted: !activeChat.isMuted });
                           setChannels(prev => prev.map(c => c.id === activeChat.id ? { ...c, isMuted: !activeChat.isMuted } : c) as any);
                        }}>
                           {activeChat.isMuted ? "Unmute Channel" : "Mute Channel"}
                        </div>
                      ) : isRecordingVoice ? (
<LiveVoiceRecorder 
                             isDark={isDark} 
                             onCancel={() => setIsRecordingVoice(false)}
                             onReRecord={() => { setShowPreview(false); setPreviewUrl(null); setIsRecordingVoice(true); }}
                             onPermissionDenied={(message) => {
                               setIsRecordingVoice(false);
                               setVoiceNoteError(message);
                             }}
                             holdToRecord
                             onSend={(url, dur) => {
                                setIsRecordingVoice(false);
                                sendVoiceMessage(url, dur);
                                setVoiceNoteError("");
                             }}
                           />
                      ) : (
                        <div className="flex items-center gap-3 w-full">
                         <div title="Attach file" className="relative group">
                              <input 
                                 type="file" 
                                 accept="image/*"
                                 className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                                 onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                       const url = URL.createObjectURL(e.target.files[0]);
                                       const newMessage = { id: Date.now(), sender: "me", text: "", type: "image", attachment: url, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: "sent", silent: silentMode };
                                       setChats(prevChats => prevChats.map(c => c.id === activeChat.id ? { ...c, history: [...(c.history || []), newMessage] } : c));
                                       setActiveChat((prev: any) => ({ ...prev, history: [...(prev.history || []), newMessage] }));
                                    }
                                    e.target.value = '';
                                 }}
                              />
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 relative z-0 ${isDark ? "bg-[#13151b] text-gray-400 group-hover:text-white group-hover:bg-white/5" : "bg-[#f4f7f9] text-slate-500 group-hover:text-slate-800 group-hover:bg-slate-200"}`}><Plus size={20} /></div>
                           </div>
                           
                           <div title="Schedule Message" onClick={() => setShowSchedulePopup(!showSchedulePopup)} className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${scheduleDateTime ? (isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600") : (isDark ? "bg-[#13151b] text-gray-400 hover:text-white hover:bg-white/5" : "bg-[#f4f7f9] text-slate-500 hover:text-slate-800 hover:bg-slate-200")} active:scale-95`}>
                              <Clock size={18} />
                           </div>
                           
                           <div title="Stickers" onClick={() => setShowStickerPicker(!showStickerPicker)} className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${showStickerPicker ? (isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600") : (isDark ? "bg-[#13151b] text-gray-400 hover:text-white hover:bg-white/5" : "bg-[#f4f7f9] text-slate-500 hover:text-slate-800 hover:bg-slate-200")} active:scale-95`}>
                              <Smile size={18} />
                           </div>
                      
                          <div className={`flex-1 min-w-0 h-12 rounded-full px-4 flex items-center relative ${isDark ? "bg-[#13151b] border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]" : "bg-[#f4f7f9] border border-black/5 shadow-[inset_2px_2px_4px_rgba(165,175,190,0.2)]"}`}>
                            <input type="text" value={messageText} onChange={e => { setMessageText(e.target.value); if (activeChat) setDraftTextByChat(prev => ({ ...prev, [String(activeChat.id)]: e.target.value })); }} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={morseMode ? "Type to encode in Morse..." : "Message..."} className={`w-full bg-transparent border-none outline-none text-[14px] ${isDark ? "text-white placeholder:text-gray-500" : "text-slate-700 placeholder:text-slate-400"} ${morseMode ? "font-mono text-amber-500" : ""}`} />
                            <div className="absolute right-2 flex items-center gap-1">
                               <div title="Silent Message" onClick={() => setSilentMode(!silentMode)} className={`px-2 py-1.5 rounded-full flex items-center justify-center cursor-pointer transition-colors ${silentMode ? (isDark ? "text-blue-400" : "text-blue-500") : (isDark ? "text-gray-600 hover:text-gray-400" : "text-slate-400 hover:text-slate-600")}`}>
                                 <BellOff size={14} />
                               </div>
                               <div title="Toggle Morse Encoder" onClick={() => setMorseMode(!morseMode)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${morseMode ? (isDark ? "bg-amber-500/20 text-amber-500" : "bg-amber-100 text-amber-700") : (isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-black/5 text-slate-400")}`}>●●● ─</div>
                            </div>
                          </div>
                          
                          <div
                            title={messageText ? (scheduleDateTime ? "Schedule Send" : "Send Message") : "Hold to record voice note"}
                            onClick={() => messageText ? handleSendMessage() : undefined}
                            onPointerDown={() => {
                              if (!messageText) {
                                setVoiceNoteError("");
                                setIsRecordingVoice(true);
                              }
                            }}
                            onContextMenu={(e) => e.preventDefault()}
                            className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 active:scale-95 select-none ${scheduleDateTime && messageText ? (isDark ? "bg-blue-600 text-white shadow-md" : "bg-blue-500 text-white shadow-md") : (messageText ? (isDark ? "bg-gradient-to-tr from-orange-500 to-orange-400 text-white shadow-[0_0_10px_rgba(249,115,22,0.5)]" : "bg-gradient-to-tr from-orange-400 to-orange-300 text-orange-950 shadow-md") : (isDark ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30" : "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20"))}`}>
                            {messageText ? (scheduleDateTime ? <Clock size={18} /> : <ChevronRight size={20} />) : <Mic size={20} />}
                          </div>
                          {replyTarget && (
                            <div className={`mt-1 px-3 py-2 rounded-2xl border-l-2 flex items-start justify-between gap-3 ${isDark ? "bg-white/5 border-orange-400 text-gray-300" : "bg-black/5 border-orange-500 text-slate-700"}`}>
                              <div className="min-w-0 flex-1">
                                <div className="text-[10px] uppercase tracking-widest font-bold opacity-70">Replying to {replyTarget.sender === "me" ? "your message" : replyTarget.sender}</div>
                                <div className="text-[12px] truncate">{replyTarget.text || (replyTarget.type === "audio" ? `Voice note · ${replyTarget.duration || ""}` : replyTarget.type === "image" ? "Photo attachment" : "Attachment")}</div>
                              </div>
                              <button onClick={() => setReplyTarget(null)} className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? "text-gray-400 hover:text-white" : "text-slate-500 hover:text-slate-800"}`}>Cancel</button>
                            </div>
                          )}
                        </div>
                      )}
                      {voiceNoteError && (
                        <div className={`text-[11px] px-3 py-2 rounded-2xl ${isDark ? "bg-red-500/10 text-red-300 border border-red-500/20" : "bg-red-50 text-red-600 border border-red-200"}`}>
                          {voiceNoteError}
                        </div>
                      )}
                     {morseMode && messageText && !activeChat.isChannel && (
                         <div className="px-5 pt-1 pb-1 font-mono text-[10.5px] text-amber-500/80 tracking-widest break-all">
                           {encodeMorse(messageText)}
                         </div>
                       )}
                       {showStickerPicker && (
                         <div className="animate-fade-in">
                           <StickerPicker theme={theme} onSelect={sendStickerMessage} onClose={() => setShowStickerPicker(false)} />
                         </div>
                       )}
                     </div>
                  </div>
                )
              )}
            </div>
            
            {/* Bottom floating Home action */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center group pointer-events-auto z-50">
               <div 
                 onClick={() => { setActiveChat(null); setView('hub'); }} 
                 title="Return to Hub"
                 className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 ${isDark ? "bg-[#1a1d24] border border-white/10 shadow-[0_12px_24px_rgba(0,0,0,0.8),_inset_0_2px_4px_rgba(255,255,255,0.08)] hover:bg-[#1f222a]" : "bg-gradient-to-b from-[#f4f7f9] to-[#e2e8f0] border border-white/90 shadow-[0_12px_24px_rgba(165,175,190,0.6),_inset_2px_2px_4px_rgba(255,255,255,1)] hover:shadow-xl"}`}
               >
                 <CustomDiamondIcon className={`${isDark ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]" : "text-orange-600 drop-shadow-[0_2px_4px_rgba(249,115,22,0.3)]"} group-hover:scale-110 transition-transform`} />
               </div>
               <span className={`text-[9px] uppercase tracking-widest mt-2 font-bold ${isDark ? "text-gray-500 group-hover:text-orange-400" : "text-slate-400 group-hover:text-orange-600"} transition-colors`}>Hub</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Story Viewer Overlay */}
      <AnimatePresence>
         {activeStory && (
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[200] flex flex-col bg-black"
            >
               <div className="absolute top-0 left-0 w-full p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
                  <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${activeStory.color} flex items-center justify-center text-white font-bold`}>
                        {activeStory.name.charAt(0)}
                     </div>
                     <span className="text-white font-semibold text-sm">{activeStory.name}</span>
                  </div>
                  <div 
                     onClick={() => setActiveStory(null)}
                     className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
                  >
                     <X size={20} />
                  </div>
               </div>
               
               <div className="flex-1 w-full bg-zinc-900 rounded-lg overflow-hidden relative flex items-center justify-center">
                  <span className="text-white/30 text-lg tracking-widest font-mono">STORY CONTENT</span>
                  
                  {/* Eye Icon for Stealth Mode visual hint */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-gray-300 text-xs">
                     <Eye size={14} className={useAppStore.getState().stealthMode ? "opacity-30" : ""} />
                     {useAppStore.getState().stealthMode ? "Viewed Stealthily" : "12 Views"}
                  </div>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      <AnimatePresence>
         {showCreateChannel && <CreateChannelModal theme={theme} onClose={() => setShowCreateChannel(false)} />}
         {showCreateBot && <CreateBotModal theme={theme} onClose={() => setShowCreateBot(false)} />}
         {showAdvancedFilterModal && (
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
               onClick={() => setShowAdvancedFilterModal(false)}
            >
               <motion.div
                 inherit={false}
                 initial={{ y: 20, opacity: 0, scale: 0.95 }}
                 animate={{ y: 0, opacity: 1, scale: 1 }}
                 exit={{ y: 20, opacity: 0, scale: 0.95 }}
                 onClick={(e) => e.stopPropagation()}
                 className={`w-full max-w-[320px] rounded-[32px] p-6 shadow-2xl ${isDark ? "bg-[#11141c] border border-white/10" : "bg-white border border-black/10"}`}
               >
                 <div className="flex items-center justify-between mb-6">
                     <h3 className={`font-bold font-sans text-lg ${isDark ? "text-white" : "text-black"}`}>Advanced Filters</h3>
                    <div onClick={() => setShowAdvancedFilterModal(false)} className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${isDark ? "bg-[#1a1d24] text-gray-400 hover:text-white" : "bg-black/5 text-slate-500 hover:text-slate-800"}`}>
                       <X size={16} />
                    </div>
                 </div>
                 
                 <div className="flex flex-col gap-4">
                    {[
                      { id: 'hasMedia', label: "Has Media", icon: ListFilter },
                      { id: 'hasAudio', label: "Has Voice Notes", icon: Mic },
                      { id: 'hasReplies', label: "Has Replies", icon: MessageCircle },
                      { id: 'fromBots', label: "From Bots", icon: Bot },
                      { id: 'priority', label: "Priority", icon: Hash },
                    ].map(f => (
                       <label key={f.id} className="flex items-center gap-3 cursor-pointer group">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${advancedFilters[f.id as keyof typeof advancedFilters] ? "bg-orange-500 text-white" : (isDark ? "bg-[#1a1d24] text-gray-400 group-hover:text-gray-200" : "bg-slate-50 text-slate-500 group-hover:text-slate-700")}`}>
                             <f.icon size={18} />
                          </div>
                          <span className={`text-sm font-bold flex-1 ${isDark ? "text-gray-300" : "text-slate-700"}`}>{f.label}</span>
                          <div className={`w-[44px] h-[24px] rounded-full p-1 transition-colors flex items-center ${advancedFilters[f.id as keyof typeof advancedFilters] ? "bg-orange-500" : (isDark ? "bg-[#1a1d24]" : "bg-slate-100")}`}>
                              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${advancedFilters[f.id as keyof typeof advancedFilters] ? "translate-x-[20px]" : "translate-x-0"}`} />
                          </div>
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={advancedFilters[f.id as keyof typeof advancedFilters]} 
                            onChange={() => setAdvancedFilters(prev => ({ ...prev, [f.id]: !prev[f.id as keyof typeof advancedFilters] }))} 
                          />
                       </label>
                    ))}
                 </div>
                 
                 <div className="mt-8 flex gap-3">
                    <button 
                       onClick={() => setAdvancedFilters({ hasMedia: false, hasAudio: false, hasReplies: false, fromBots: false, priority: false })}
                       className={`flex-1 py-3 text-xs font-bold rounded-2xl transition-colors ${isDark ? "bg-[#1a1d24] text-gray-400 hover:bg-white/5" : "bg-slate-50 text-slate-500 hover:bg-black/5"}`}
                    >
                       Reset
                    </button>
                    <button 
                       onClick={() => setShowAdvancedFilterModal(false)}
                       className="flex-1 py-3 text-xs font-bold rounded-2xl bg-orange-500 text-white transition-opacity hover:opacity-90 shadow-md"
                    >
                       Apply
                    </button>
                 </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

         <ContactProfileModal 
         contact={globalSelectedContact}
         theme={theme}
         onClose={() => setGlobalSelectedContact(null)}
         onCall={() => {
             if (globalSelectedContact) {
                useAppStore.getState().setActiveCall({ number: globalSelectedContact.name, startTime: Date.now(), isMuted: false, isSpeaker: false });
             }
             setView('calls');
             setGlobalSelectedContact(null);
          }}
          onMessage={() => {
             setView('chats');
             if (globalSelectedContact) {
                const existingChat = chats.find(c => c.name === globalSelectedContact.name && c.type === 'direct');
                if (existingChat) {
                   setActiveChat(existingChat);
                } else {
                   const newChat = { id: Date.now(), name: globalSelectedContact.name, type: "direct", color: globalSelectedContact.color || "from-blue-400 to-indigo-500", online: true, history: [] };
                   setChats([newChat, ...chats]);
                   setActiveChat(newChat);
                }
             }
             setGlobalSelectedContact(null);
          }}
          onDelete={() => {
             if (activeChat && activeChat.name === globalSelectedContact?.name) setActiveChat(null);
             setChats(chats.filter(c => c.name !== globalSelectedContact?.name) as any);
             setGlobalSelectedContact(null);
          }}
        onEdit={() => {
                if (globalSelectedContact) {
                  setEditingContact(globalSelectedContact);
                }
                setGlobalSelectedContact(null);
            }}
           onBlock={() => {
             if (activeChat && activeChat.name === globalSelectedContact?.name) setActiveChat(null);
             setChats(chats.filter(c => c.name !== globalSelectedContact?.name));
             setGlobalSelectedContact(null);
          }}
        />
       
       {/* Edit Contact Modal (global) */}
       <AnimatePresence>
         {editingContact && (
           <ContactCreateEditModal
             contact={editingContact}
             isDark={isDark}
             onClose={() => setEditingContact(null)}
              onSave={(name, id, color, localFields) => {
                setContacts(contacts.map(c =>
                  c.id === editingContact.id ? { ...c, name, id, color: color || c.color, localFields } : c
                ));
                setEditingContact(null);
              }}
           />
         )}
       </AnimatePresence>
       
     {view !== 'calls' && <FloatingCallWidget theme={theme} />}
      </div>
      </>
    );
  }
