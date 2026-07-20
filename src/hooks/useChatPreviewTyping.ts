import { useEffect, useState } from "react";

export function useChatPreviewTyping(chatId: string | number | undefined, isOnline: boolean | undefined, chatType: string | undefined) {
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!isOnline || chatType === "channel") return;
    let timer: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      const delay = 8000 + Math.random() * 30000;
      timer = setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2500 + Math.random() * 3000);
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => clearTimeout(timer);
  }, [chatId, isOnline, chatType]);

  return isTyping;
}
