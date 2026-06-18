import { AnimatePresence, motion } from "motion/react";
import { Battery, Moon, Shield, X, Volume2, VolumeX } from "lucide-react";
import React, { ComponentType, SVGProps, useState } from "react";
import { useI18n } from "../../lib/i18n";
import { useAppStore } from "../../store";
import { CustomDiamondIcon } from "./CustomDiamondIcon";

type RadialItem = {
  id: string;
  angle: number;
  title: string;
  subtitle: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

type RadialMenuProps = {
  theme: "light" | "dark";
  items: RadialItem[];
  badges?: Record<string, number>;
  centerTitle: string;
  centerSubtitle: string;
  onCenterClick?: () => void;
  onItemClick?: (id: string) => void;
};

type HubToggleIconProps = {
  active: boolean;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  color: "purple" | "blue" | "green";
  isDark: boolean;
  title: string;
};

const HubToggleIcon = ({ active, onClick, icon: Icon, color, isDark, title }: HubToggleIconProps) => {
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
    activeBorder = isDark ? "border-green-500/40" : "border-emerald-500/60";
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

export const RadialMenu = ({ theme, items, badges, centerTitle, centerSubtitle, onCenterClick, onItemClick }: RadialMenuProps) => {
  const isDark = theme === "dark";
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const store = useAppStore();
  const volume = Math.round(store.soundVolume * 100);
  const dnd = store.radialDnd;
  const proxy = store.radialProxy;
  const energy = store.radialEnergy;
  const containerRef = React.useRef<HTMLDivElement>(null);

  const cx = 400;
  const cy = 350;
  const hubR = 110;
  const arcR = 175;
  const bubbleR = 255;
  const textR = 340;
  const volR = hubR + 35;
  const arcStrokeColor = isDark ? "#374151" : "#cbd5e1";
  const dotFill = isDark ? "#13151b" : "#eaeff4";
  const dotStroke = isDark ? "#f97316" : "#14b8a6";
  const textTitleColor = isDark ? "text-gray-300" : "text-slate-800";

  const handleVolumeInteraction = (event: React.PointerEvent<SVGPathElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 550 / rect.height;

    const svgX = (event.clientX - rect.left) * scaleX;
    const svgY = (event.clientY - rect.top) * scaleY;

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

        {items.map((item, index) => {
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
                  delay: isOpen ? 0.2 + index * 0.05 : 0,
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
                  delay: isOpen ? 0.1 + index * 0.05 : 0,
                }}
                style={{ transformOrigin: `${arcX}px ${arcY}px` }}
              />
            </g>
          );
        })}

        <path
          d={`M ${cx - volR} ${cy} A ${volR} ${volR} 0 0 0 ${cx + volR} ${cy}`}
          fill="none"
          stroke={isDark ? "#2d3340" : "#cbd5e1"}
          strokeWidth="4"
          strokeDasharray="6 6"
          strokeLinecap="round"
          className="transition-all duration-300"
        />

        {volume > 0 && (
          <path
            d={`M ${cx - volR} ${cy} A ${volR} ${volR} 0 0 0 ${cx + volR * Math.cos(Math.PI - (volume / 100) * Math.PI)} ${
              cy + volR * Math.sin(Math.PI - (volume / 100) * Math.PI)
            }`}
            fill="none"
            stroke={isDark ? "#f59e0b" : "#0d9488"}
            strokeWidth="4"
            strokeDasharray="6 6"
            strokeLinecap="round"
            className="transition-all duration-75"
          />
        )}
      </svg>

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
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            handleVolumeInteraction(event);
          }}
          onPointerMove={(event) => {
            if (event.buttons > 0) handleVolumeInteraction(event);
          }}
          onPointerUp={(event) => {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }}
        />
      </svg>

      <div
        className={`absolute flex items-center justify-center w-9 h-9 rounded-full transition-all cursor-pointer z-20 ${
          isDark ? "text-gray-500 hover:bg-red-500/20 hover:text-red-400" : "text-slate-400 hover:bg-red-500/15 hover:text-red-600"
        }`}
        style={{ left: cx - volR - 41, top: cy - 18 }}
        title={t("hub.volumeMin")}
        onClick={(event: any) => {
          event.stopPropagation();
          store.setSoundVolume(0);
        }}
      >
        <VolumeX size={18} />
      </div>
      <div
        className={`absolute flex items-center justify-center w-9 h-9 rounded-full transition-all cursor-pointer z-20 ${
          isDark ? "text-gray-500 hover:bg-emerald-500/20 hover:text-emerald-400" : "text-slate-400 hover:bg-emerald-500/15 hover:text-emerald-600"
        }`}
        style={{ left: cx + volR + 13, top: cy - 18 }}
        title={t("hub.volumeMax")}
        onClick={(event: any) => {
          event.stopPropagation();
          store.setSoundVolume(1);
        }}
      >
        <Volume2 size={18} />
      </div>
      <div
        className={`absolute text-[10px] uppercase tracking-widest font-bold z-10 pointer-events-none ${
          isDark ? "text-amber-500/80 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" : "text-teal-600/90"
        }`}
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
          boxShadow: isDark ? "0 0 12px rgba(245,158,11,0.6)" : "0 4px 6px rgba(13,148,136,0.3)",
        }}
      />

      <AnimatePresence>
        {items.map((item, index) => {
          const rad = (item.angle * Math.PI) / 180;
          const bX = cx + bubbleR * Math.cos(rad);
          const bY = cy - bubbleR * Math.sin(rad);
          const textX = cx + textR * Math.cos(rad);
          const offsetX = item.angle === 180 ? -10 : item.angle === 0 ? 10 : 0;
          const textY = cy - textR * Math.sin(rad);
          const Icon = item.icon;

          return (
            <React.Fragment key={`html-${item.id}`}>
              <motion.div
                onClick={() => onItemClick && onItemClick(item.id.toString())}
                title={`${item.title} - ${item.subtitle}`}
                initial={{
                  left: cx,
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
                  delay: isOpen ? index * 0.05 : 0,
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
                  <div className="absolute -top-1 -right-2 w-[22px] h-[22px] bg-gradient-to-tr from-orange-500 to-orange-400 rounded-full shadow-[0_0_12px_rgba(249,115,22,0.7),_inset_0_2px_3px_rgba(255,255,255,0.4)] border border-white/20 flex items-center justify-center">
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
                  delay: isOpen ? 0.2 + index * 0.05 : 0,
                }}
                className={`absolute w-[180px] text-center pointer-events-none flex flex-col items-center z-10 drop-shadow-md`}
              >
                <span className={`text-[12px] font-bold uppercase tracking-widest ${textTitleColor}`}>{item.title}</span>
                <span className={`text-[10px] mt-1 font-medium tracking-wide ${isDark ? "text-gray-500" : "text-slate-500"}`}>{item.subtitle}</span>
              </motion.div>
            </React.Fragment>
          );
        })}
      </AnimatePresence>

      <div
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "Close Menu" : "Open Hub Menu"}
        className={`absolute rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 active:scale-[0.96] z-30 group ${
          isDark
            ? `bg-[#13151b] border border-white/5 ${
                isOpen
                  ? "shadow-[inset_0_12px_24px_rgba(0,0,0,0.9),_inset_0_4px_8px_rgba(0,0,0,0.9)] bg-[#101216]"
                  : "shadow-[0_20px_40px_rgba(0,0,0,0.6),_inset_0_2px_4px_rgba(255,255,255,0.1),_inset_0_-4px_8px_rgba(0,0,0,0.9)] hover:shadow-[0_24px_48px_rgba(249,115,22,0.15),_inset_0_2px_4px_rgba(255,255,255,0.15),_inset_0_-4px_8px_rgba(0,0,0,0.9)]"
              }`
            : `bg-[#eaeff4] border border-white/80 ${
                isOpen
                  ? "shadow-[-4px_-4px_10px_rgba(255,255,255,0.9),_6px_8px_16px_rgba(165,175,190,0.55),_inset_6px_6px_14px_rgba(165,175,190,0.4)] bg-[#e2e8f0]"
                  : "shadow-[-16px_-16px_36px_rgba(255,255,255,0.9),_20px_24px_50px_rgba(165,175,190,0.6),_inset_3px_3px_5px_rgba(255,255,255,1)] hover:shadow-[-20px_-20px_45px_rgba(255,255,255,1),_24px_28px_60px_rgba(165,175,190,0.6),_inset_3px_3px_5px_rgba(255,255,255,1)]"
              }`
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
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsOpen(!isOpen);
                    if (onCenterClick) {
                      onCenterClick();
                    }
                  }}
                >
                  <CustomDiamondIcon
                    className={`${
                      isDark
                        ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]"
                        : "text-orange-600 drop-shadow-[0_2px_4px_rgba(249,115,22,0.3)]"
                    }`}
                  />
                </div>
              </div>

              <div className={`text-[10px] font-bold tracking-[0.1em] text-center px-2 uppercase leading-tight ${isDark ? "text-white" : "text-slate-800"}`}>
                {centerTitle}
              </div>
              <span className={`text-[9px] mt-0.5 font-bold tracking-[0.1em] uppercase truncate max-w-[120px] ${isDark ? "text-orange-400" : "text-teal-600"}`}>
                {centerSubtitle}
              </span>

              <div className="flex gap-2.5 mt-3 z-40 bg-transparent scale-90">
                <HubToggleIcon
                  active={dnd}
                  onClick={(event: any) => {
                    event.stopPropagation();
                    store.setRadialDnd(!dnd);
                  }}
                  icon={Moon}
                  color="purple"
                  isDark={isDark}
                  title={dnd ? t("hub.dndActive") : t("hub.dnd")}
                />
                <HubToggleIcon
                  active={proxy}
                  onClick={(event: any) => {
                    event.stopPropagation();
                    store.setRadialProxy(!proxy);
                  }}
                  icon={Shield}
                  color="blue"
                  isDark={isDark}
                  title={proxy ? t("hub.proxyActive") : t("hub.proxy")}
                />
                <HubToggleIcon
                  active={energy}
                  onClick={(event: any) => {
                    event.stopPropagation();
                    store.setRadialEnergy(!energy);
                  }}
                  icon={Battery}
                  color="green"
                  isDark={isDark}
                  title={energy ? t("hub.energyActive") : t("hub.energy")}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
