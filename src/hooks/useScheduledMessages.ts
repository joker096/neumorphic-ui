import { useEffect, useRef } from "react";
import { useAppStore } from "../store";
import type { ScheduledMessage } from "../store/types";

export function useScheduledMessages() {
  const scheduledQueue = useAppStore(s => s.scheduledQueue);
  const setChats = useAppStore(s => s.setChats);

  useEffect(() => {
    if (!scheduledQueue || scheduledQueue.messages.length === 0) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const messagesToSend = scheduledQueue.messages.filter((msg: ScheduledMessage) => msg.scheduledAt <= now);
      
      if (messagesToSend.length > 0) {
        setChats(prevChats => {
          let updatedChats = [...prevChats];
          for (const msg of messagesToSend) {
            const chatIndex = updatedChats.findIndex((c: any) => c.id === msg.chatId);
            if (chatIndex > -1) {
              const chat = updatedChats[chatIndex];
              const newHistory = [...(chat.history || []), {
                id: Date.now() + Math.random(),
                text: msg.text,
                sender: "me",
                status: "delivered"
              }];
              updatedChats[chatIndex] = { ...chat, history: newHistory, message: msg.text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            }
          }
          return updatedChats;
        });

        messagesToSend.forEach((msg: ScheduledMessage) => scheduledQueue.removeMessage(msg.id));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [scheduledQueue, setChats]);
}
