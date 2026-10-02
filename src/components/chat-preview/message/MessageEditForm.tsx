import { useState } from "react";

type Translate = (key: string, options?: any) => string;

interface MessageEditFormProps {
  initialText: string;
  originalText: string;
  t: Translate;
  onCommit: (text: string) => void;
  onCancel: () => void;
}

/** Inline message editor. Owns the draft; the parent only decides when it is mounted. */
export function MessageEditForm({ initialText, originalText, t, onCommit, onCancel }: MessageEditFormProps) {
  const [draftText, setDraftText] = useState(initialText);
  const cannotSave = !draftText.trim() || draftText.trim() === originalText;

  return (
    <div className="pb-1 flex flex-col gap-1.5 min-w-[220px]">
      <textarea
        value={draftText}
        onChange={(e) => setDraftText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onCommit(draftText.trim()); }
        }}
        autoFocus
        rows={2}
        className="glass-input w-full resize-none rounded-lg px-2 py-1.5 text-[14px] leading-relaxed outline-none"
        aria-label={t("chat.editMessage", "Edit message")}
      />
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => onCommit(draftText.trim())}
          disabled={cannotSave}
          className="min-h-11 px-3 rounded-lg text-xs font-bold bg-[var(--accent)] text-[var(--button-primary-text)] hover:brightness-110 active:scale-95 transition-all"
        >
          {t("chat.save", "Save")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 px-3 rounded-lg text-xs font-bold bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:brightness-110 active:scale-95 transition-all"
        >
          {t("chat.cancel", "Cancel")}
        </button>
      </div>
    </div>
  );
}
