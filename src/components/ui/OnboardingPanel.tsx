import React from "react";
import { MessageSquarePlus, UserPlus, Download } from "lucide-react";

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
    <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
      {t("onboarding.welcome") || "Welcome to Mess&Anger"}
    </h3>
    <p className={`text-sm max-w-xs mb-8 leading-relaxed ${isDark ? "text-gray-400" : "text-slate-500"}`}>
      {t("onboarding.description") || "Secure, decentralized messaging. Start a conversation or connect with friends."}
    </p>
    <div className="flex flex-col gap-3 w-full max-w-[260px]">
      {onStartChat && (
        <button
          onClick={onStartChat}
          className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${
            isDark
              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg"
              : "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
          }`}
        >
          <MessageSquarePlus size={16} />
          {t("onboarding.startChat") || "Start a chat"}
        </button>
      )}
      {onInvite && (
        <button
          onClick={onInvite}
          className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${
            isDark
              ? "bg-[#1a1d24] text-gray-200 border border-white/5 hover:bg-white/5"
              : "bg-white text-slate-700 border border-black/5 hover:bg-black/5 shadow-sm"
          }`}
        >
          <UserPlus size={16} />
          {t("onboarding.invite") || "Invite friends"}
        </button>
      )}
    </div>
  </div>
);
