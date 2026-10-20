import React from "react";
import { encodeMorse } from "../MorseDecoder";

interface MorsePreviewProps {
  msgText: string;
}

export function MorsePreview({ msgText }: MorsePreviewProps) {
  if (!msgText) return null;
  return (
    <div className="mx-2 sm:mx-3 px-3 sm:px-5 pt-1 pb-1 font-mono text-xs text-[var(--amber)]/80 tracking-widest break-all">
      {encodeMorse(msgText)}
    </div>
  );
}