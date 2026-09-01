import { useEffect, useState } from "react";
import { p2pNetwork } from "../lib/p2p/network";
import { useAppStore } from "../store";

export function useChatPreviewTyping(
  chatId: string | number | undefined,
  chatName: string | undefined,
  isOnline: boolean | undefined,
  chatType: string | undefined,
) {
  const [simTyping, setSimTyping] = useState(false);
  const [realTyping, setRealTyping] = useState(false);
  const showTyping = useAppStore((state) => state.typingIndicators);

  useEffect(() => {
    if (!isOnline || chatType === "channel") return;
    let timer: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      const delay = 8000 + Math.random() * 30000;
      timer = setTimeout(() => {
        setSimTyping(true);
        setTimeout(() => setSimTyping(false), 2500 + Math.random() * 3000);
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => clearTimeout(timer);
  }, [chatId, isOnline, chatType]);

  useEffect(() => {
    if (!showTyping || !chatName) return;
    const unsub = p2pNetwork.onTypingIndicator((name, isTyping) => {
      if (name === chatName) setRealTyping(isTyping);
    });
    return unsub;
  }, [chatName, showTyping]);

  if (!showTyping) return false;
  return simTyping || realTyping;
}
