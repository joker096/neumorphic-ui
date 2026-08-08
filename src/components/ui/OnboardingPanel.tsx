import React from "react";
import { MessageSquarePlus, UserPlus, QrCode } from "lucide-react";

type OnboardingPanelProps = {
  isDark?: boolean;
  t: (key: string) => string;
  onStartChat?: () => void;
  onInvite?: () => void;
};

export const OnboardingPanel = ({ isDark = false, t, onStartChat, onInvite }: OnboardingPanelProps) => (
   <div className="flex flex-col items-center justify-center py-12 px-6 text-center flex-1">
     <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isDark ? "bg-orange-500/10" : "bg-orange-500/8"}`}>
       <MessageSquarePlus size={36} className={isDark ? "text-orange-400" : "text-orange-600"} />
     </div>
     <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>
       {t("onboarding.welcome") || "Welcome to Mess&Anger"}
     </h3>
     <p className={`text-sm max-w-xs mb-8 leading-relaxed ${isDark ? "text-gray-400" : "text-slate-500"}`}>
       {t("onboarding.description") || "Secure, decentralized messaging. Start a conversation or connect with friends."}
     </p>

     <div className={`flex items-center gap-2 mb-8 ${isDark ? "text-gray-500" : "text-slate-500"}`}>
       <div className="flex items-center gap-1.5 text-[11px]">
         <UserPlus size={13} />
         <span>{t("onboarding.step1") || "Add a contact"}</span>
       </div>
       <div className={`w-8 h-px ${isDark ? "bg-gray-600" : "bg-slate-400"}`} />
       <div className="flex items-center gap-1.5 text-[11px]">
         <MessageSquarePlus size={13} />
         <span>{t("onboarding.step2") || "Start chatting"}</span>
       </div>
     </div>

     <div className="flex flex-col gap-3 w-full max-w-[260px]">
        {onStartChat && (
          <button
            onClick={onStartChat}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              isDark
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-[var(--text-primary)] shadow-lg"
                : "bg-gradient-to-r from-orange-500 to-amber-500 text-[var(--text-primary)] shadow-md"
            }`}
          >
            <UserPlus size={16} />
            {t("onboarding.startChat") || "Add a Contact"}
          </button>
        )}
        {onInvite && (
          <button
            onClick={onInvite}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              isDark
                ? "bg-[var(--bg-tertiary)] text-gray-200 border border-[var(--border-color)] hover:bg-white/5"
                : "bg-white text-slate-700 border border-[var(--border-color)] hover:bg-black/5 shadow-sm"
            }`}
          >
           <QrCode size={16} />
           {t("onboarding.invite") || "Invite friends"}
         </button>
       )}
     </div>
   </div>
);





