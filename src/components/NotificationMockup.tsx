import { useI18n } from '../lib/i18n';
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, X } from "lucide-react";

export const NotificationMockup = ({
  theme = "dark",
}: {
  theme?: "dark" | "light";
}) => {
  const isDark = theme === "dark";
  const { t } = useI18n();
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
              {t('notifications.updateTitle')}
            </span>
            <span
              className={`text-[11px] font-medium leading-tight mt-0.5 ${isDark ? "text-gray-400" : "text-slate-500"}`}
            >
              {t('notifications.updateBody')}
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
