import { CrmLeadSuggestionBar } from "../crm/CrmLeadSuggestionBar";

interface TypingBubbleProps {
  isDark: boolean;
}

const TypingBubble = ({ isDark }: TypingBubbleProps) => (
  <div className="px-4 sm:px-6 pb-1 flex justify-start">
    <div
      className={`flex items-center gap-1.5 px-3 py-2.5 rounded-2xl rounded-bl-md ${
        isDark
          ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]/60"
          : "bg-white/70 border border-[var(--border-color)]/60"
      } shadow-[0_2px_4px_rgba(0,0,0,0.12)]`}
      aria-live="polite"
    >
      <span
        className={`w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] animate-bounce`}
        style={{ animationDelay: "0ms" }}
      />
      <span
        className={`w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] animate-bounce`}
        style={{ animationDelay: "150ms" }}
      />
      <span
        className={`w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] animate-bounce`}
        style={{ animationDelay: "300ms" }}
      />
    </div>
  </div>
);

interface ChatPreviewStatusBannersProps {
  isDark: boolean;
  isTyping: boolean;
  isChannel?: boolean;
  t: (key: string, arg?: any) => string;
  /** `useChatPreviewInteractions` return surface. */
  interactions: any;
}

/**
 * Transient status rows between the message list and the composer: the peer
 * typing indicator and the unknown-contact → CRM lead suggestion bar.
 */
export const ChatPreviewStatusBanners = ({
  isDark,
  isTyping,
  isChannel,
  t,
  interactions,
}: ChatPreviewStatusBannersProps) => {
  const {
    leadSuggestion,
    leadSuggestionVisible,
    addLeadSuggestion,
    dismissLeadSuggestion,
  } = interactions;

  return (
    <>
      {isTyping && !isChannel && <TypingBubble isDark={isDark} />}

      {leadSuggestionVisible && leadSuggestion && (
        <CrmLeadSuggestionBar
          hint={t("crm.suggestLeadHint", { detail: leadSuggestion.detail })}
          actionLabel={t("crm.suggestLead", "Add")}
          dismissLabel={t("crm.dismissSuggestion", "Dismiss")}
          onAdd={addLeadSuggestion}
          onDismiss={dismissLeadSuggestion}
        />
      )}
    </>
  );
};