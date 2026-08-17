import React from "react";
import { Megaphone, MessageSquarePlus, UserPlus, QrCode, Plus, Users } from "lucide-react";

type OnboardingPanelVariant = "contacts" | "channels";

type OnboardingPanelProps = {
  isDark?: boolean;
  variant?: OnboardingPanelVariant;
  t: (key: string) => string;
  onStartChat?: () => void;
  onInvite?: () => void;
};

export const OnboardingPanel = ({ isDark = false, variant = "contacts", t, onStartChat, onInvite }: OnboardingPanelProps) => {
  const isChannels = variant === "channels";
  return (
   <div className="flex flex-col items-center justify-center py-12 px-6 text-center flex-1">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-[var(--accent-soft)]`}>
        {isChannels
          ? <Megaphone size={36} className="text-[var(--accent)]" />
          : <MessageSquarePlus size={36} className="text-[var(--accent)]" />}
     </div>
      <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>
        {t("onboarding.welcome") || "Welcome to Mess&Anger"}
      </h3>
       <p className={`text-sm max-w-xs mb-8 leading-relaxed text-[var(--text-secondary)]`}>
        {isChannels
          ? (t("onboarding.channelDescription") || "No channels yet? Create your own channel to share news and updates with subscribers.")
          : (t("onboarding.description") || "Secure, decentralized messaging. Start a conversation or connect with friends.")}
      </p>

      <div className={`flex items-center gap-2 mb-8 text-[var(--text-tertiary)]`}>
        <div className="flex items-center gap-1.5 text-[11px]">
          {isChannels ? <Megaphone size={13} /> : <UserPlus size={13} />}
          <span>{isChannels
            ? (t("onboarding.channelStep1") || "Create a channel")
            : (t("onboarding.step1") || "Add a contact")}</span>
        </div>
        <div className={`w-8 h-px bg-[var(--border-color)]`} />
        <div className="flex items-center gap-1.5 text-[11px]">
          {isChannels ? <Users size={13} /> : <MessageSquarePlus size={13} />}
          <span>{isChannels
            ? (t("onboarding.channelStep2") || "Add subscribers")
            : (t("onboarding.step2") || "Start chatting")}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-[260px]">
          {onStartChat && (
          <button
            type="button"
            onClick={onStartChat}
            className={`w-full min-h-[48px] py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 ${
              isDark
                ? "bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-[var(--text-primary)] shadow-lg hover:brightness-110"
                : "bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-[var(--text-primary)] shadow-md hover:brightness-105"
            }`}
          >
            {isChannels ? <Plus size={16} /> : <UserPlus size={16} />}
            {isChannels
              ? (t("createChannel.title") || "Create Channel")
              : (t("onboarding.startChat") || "Add a Contact")}
          </button>
        )}
        {onInvite && (
          <button
            type="button"
            onClick={onInvite}
            className={`w-full min-h-[48px] py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
              isDark
                ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-white/5"
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
};





