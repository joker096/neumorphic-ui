import { useCallback, useEffect, useState } from "react";
import { toast } from "../../ui/Toast";

type Translate = (key: string, options?: any) => string;

/**
 * Tracks whether a self-destructing message has reached its deadline. Render-side
 * guarantee: expired content is never shown, even if the central sweep
 * (useSelfDestructSweep) is late - it also erases the stored message.
 */
export function useSelfDestructExpiry(selfDestructAt?: number): boolean {
  const [expired, setExpired] = useState(
    () => typeof selfDestructAt === "number" && Date.now() >= selfDestructAt,
  );

  useEffect(() => {
    if (typeof selfDestructAt !== "number") {
      setExpired(false);
      return;
    }
    const check = () => setExpired(Date.now() >= selfDestructAt);
    const remaining = selfDestructAt - Date.now();
    if (remaining <= 0) {
      setExpired(true);
      return;
    }
    const timer = window.setTimeout(check, Math.min(remaining + 50, 2_147_483_647));
    return () => window.clearTimeout(timer);
  }, [selfDestructAt]);

  return expired;
}

interface UseMessageTranslationOptions {
  translate: { detectLang: (text: string) => Promise<string>; translate: (text: string, from: string, to: string) => Promise<string> };
  text: string;
  lang: string;
  t: Translate;
}

/** On-demand translation of a message into the current UI language. */
export function useMessageTranslation({ translate, text, lang, t }: UseMessageTranslationOptions) {
  const [translation, setTranslation] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  const onTranslate = useCallback(async () => {
    setTranslating(true);
    try {
      const from = await translate.detectLang(text);
      // Translate into the UI language, not a hardcoded target.
      setTranslation(await translate.translate(text, from, lang));
    } catch {
      toast(t("chat.translateNotConfigured", "\u041f\u0435\u0440\u0435\u0432\u043e\u0434 \u043d\u0435 \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0451\u043d"));
    } finally {
      setTranslating(false);
    }
  }, [translate, text, lang, t]);

  return { translation, translating, onTranslate };
}

/** Morse decode toggle state for a message that contains Morse code. */
export function useMorseToggle(): readonly [boolean, () => void] {
  const [decoded, setDecoded] = useState(false);
  const toggle = useCallback(() => setDecoded((v) => !v), []);
  return [decoded, toggle] as const;
}
