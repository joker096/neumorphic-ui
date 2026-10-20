import React from "react";
import { useI18n } from "../../lib/i18n";

interface ChatInputVoiceErrorProps {
  voiceNoteError: string;
}

export function ChatInputVoiceError({ voiceNoteError }: ChatInputVoiceErrorProps) {
  const { t } = useI18n();
  if (!voiceNoteError) return null;
  return (
    <div className="mx-1 sm:mx-2 md:mx-3 text-xs px-2 sm:px-3 py-2 rounded-xl bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/30">
      {voiceNoteError}
    </div>
  );
}