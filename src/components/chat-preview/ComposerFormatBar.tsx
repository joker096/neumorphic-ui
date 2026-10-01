import React from "react";
import { Bold, Italic, Code, EyeOff, Strikethrough } from "lucide-react";
import type { FormatWrapKey } from "./composerInput";

export interface ComposerFormatBarProps {
  onFormat: (key: FormatWrapKey) => void;
  t: (key: string, opts?: any) => string;
}

const BUTTONS: { key: FormatWrapKey; icon: React.FC<{ size?: number }>; labelKey: string; fallback: string }[] = [
  { key: "bold", icon: Bold, labelKey: "chat.format.bold", fallback: "Bold" },
  { key: "italic", icon: Italic, labelKey: "chat.format.italic", fallback: "Italic" },
  { key: "strike", icon: Strikethrough, labelKey: "chat.format.strike", fallback: "Strikethrough" },
  { key: "spoiler", icon: EyeOff, labelKey: "chat.format.spoiler", fallback: "Spoiler" },
  { key: "code", icon: Code, labelKey: "chat.format.code", fallback: "Monospace" },
];

/**
 * Formatting row above the composer.
 *
 * Every button wraps the textarea selection in a delimiter that
 * `FormattedText` already parses — the panel invents no markup of its own, so
 * a receiver on an older build still sees the literal characters rather than a
 * silently dropped style.
 *
 * Rendered only while there is text to format; a five-button row over an empty
 * composer is chrome, not function.
 */
export function ComposerFormatBar({ onFormat, t }: ComposerFormatBarProps) {
  return (
    <div className="flex items-center gap-0.5 px-1 pb-0.5" role="group" aria-label={t("chat.format.title", "Formatting")}>
      {BUTTONS.map(({ key, icon: Icon, labelKey, fallback }) => (
        <button
          key={key}
          type="button"
          aria-label={t(labelKey, fallback)}
          title={t(labelKey, fallback)}
          onClick={() => onFormat(key)}
          className="icon-button active:scale-95"
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}
