import { CrmLeadSuggestionBar } from "../crm/CrmLeadSuggestionBar";

/** Animated dot of the typing indicator. */
const TYPING_DOT_CLASS = 'w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] animate-bounce';

interface TypingBubbleProps {}

const TypingBubble = () => (
  <div className="px-4 sm:px-6 pb-1 flex justify-start">
    <div
      className={`flex items-center gap-1.5 px-3 py-2.5 rounded-2xl rounded-bl-md bg-[var(--bg-tertiary)] border border-[var(--border-color)]/60 shadow-[var(--shadow-banner)]`}
      aria-live="polite"
    >
      <span
        className={TYPING_DOT_CLASS}
        style={{ animationDelay: "0ms" }}
      />
      <span
        className={TYPING_DOT_CLASS}
        style={{ animationDelay: "150ms" }}
      />
      <span
        className={TYPING_DOT_CLASS}
        style={{ animationDelay: "300ms" }}
      />
    </div>
  </div>
);

interface ChatPreviewStatusBannersProps {
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
      {isTyping && !isChannel && <TypingBubble />}

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