import React from "react";
import { useI18n } from "../../lib/i18n";

interface ChatInputVoiceErrorProps {
  voiceNoteError: string;
  isDark: boolean;
}

export function ChatInputVoiceError({ voiceNoteError, isDark }: ChatInputVoiceErrorProps) {
  const { t } = useI18n();
  if (!voiceNoteError) return null;
  return (
    <div className={`mx-1 sm:mx-2 md:mx-3 text-[11px] px-2 sm:px-3 py-2 rounded-xl ${
      isDark ? "bg-red-500/10 text-red-300 border border-red-500/20" : "bg-red-50 text-red-600 border border-red-200"
    }`}>
      {voiceNoteError}
    </div>
  );
}