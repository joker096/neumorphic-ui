import React from "react";
import { createPortal } from "react-dom";
import { Plus, Send, X } from "lucide-react";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { useI18n } from "../../lib/i18n";
import { MAX_POLL_OPTIONS } from "../../hooks/chatPreviewSends/sendPoll";

interface PollComposerModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (question: string, optionTexts: string[], multiple: boolean) => void;
}

const MIN_OPTIONS = 2;

/**
 * Poll composer. Question plus two-to-five options, optional multi-choice.
 *
 * `sendPoll` is the only consumer of the ballot: the modal keeps no copy after
 * submit, so a failed send cannot leave a half-filled poll behind.
 */
export function PollComposerModal({ open, onClose, onSubmit }: PollComposerModalProps) {
  const { t } = useI18n();
  const [question, setQuestion] = React.useState("");
  const [options, setOptions] = React.useState<string[]>(["", ""]);
  const [multiple, setMultiple] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setQuestion("");
    setOptions(["", ""]);
    setMultiple(false);
  }, [open]);

  useEscapeKey(() => onClose(), open);

  if (!open) return null;

  const filled = options.map((o) => o.trim()).filter(Boolean);
  const canSubmit = question.trim() !== "" && filled.length >= MIN_OPTIONS;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit(question, filled, multiple);
    onClose();
  };

  const setOptionAt = (index: number, value: string) =>
    setOptions((prev) => prev.map((text, i) => (i === index ? value : text)));

  return createPortal(
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("chat.createPoll")}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-modal)]"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-[var(--text-primary)]">{t("chat.createPoll")}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="min-w-11 min-h-11 -mr-2 flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--msg-bg-panel-hover)] active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
          {t("chat.pollQuestion")}
        </label>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          aria-label={t("chat.pollQuestion")}
          placeholder={t("chat.pollQuestionPlaceholder")}
          className="mb-3 w-full min-h-11 rounded-xl bg-[var(--bg-tertiary)] px-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:ring-2 focus:ring-[var(--accent)]/50"
        />

        <div className="flex flex-col gap-2">
          {options.map((text, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <input
                value={text}
                onChange={(e) => setOptionAt(index, e.target.value)}
                aria-label={t("chat.pollOption", { n: index + 1 })}
                placeholder={t("chat.pollOption", { n: index + 1 })}
                className="min-h-11 min-w-0 flex-1 rounded-xl bg-[var(--bg-tertiary)] px-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:ring-2 focus:ring-[var(--accent)]/50"
              />
              {options.length > MIN_OPTIONS && (
                <button
                  type="button"
                  onClick={() => setOptions((prev) => prev.filter((_, i) => i !== index))}
                  aria-label={t("chat.pollRemoveOption")}
                  className="min-w-11 min-h-11 flex items-center justify-center rounded-xl text-[var(--danger)] hover:bg-[var(--danger-soft)] active:scale-95"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        {options.length < MAX_POLL_OPTIONS && (
          <button
            type="button"
            onClick={() => setOptions((prev) => [...prev, ""])}
            className="mt-2 flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--msg-bg-panel-hover)] active:scale-[0.98]"
          >
            <Plus size={16} />
            {t("chat.pollAddOption")}
          </button>
        )}

        <button
          type="button"
          role="switch"
          aria-checked={multiple}
          aria-label={t("chat.pollMultiple")}
          onClick={() => setMultiple((v) => !v)}
          className="mt-3 flex min-h-11 w-full items-center justify-between gap-2 text-sm text-[var(--text-primary)]"
        >
          <span>{t("chat.pollMultiple")}</span>
          <span
            aria-hidden="true"
            className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${
              multiple ? "bg-[var(--accent)]" : "bg-[var(--text-tertiary)]/40"
            }`}
          >
            <span
              className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                multiple ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </span>
        </button>

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-bold text-[var(--ink-on-saturate)] shadow-[var(--shadow-btn-primary)] transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={16} />
          {t("chat.createPoll")}
        </button>
      </div>
    </div>,
    document.body,
  );
}
