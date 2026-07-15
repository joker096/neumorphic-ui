import { useEffect, useState } from "react";
import { useAppStore } from "../store";
import { seedMockData } from "../utils/mockSeeding";

export const useScheduledMessages = (setChats: (chats: any[] | ((prev: any[]) => any[])) => void) => {
  const scheduledQueue = useAppStore((s) => s.scheduledQueue);

  useEffect(() => {
    if (!scheduledQueue || scheduledQueue.messages.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const messagesToSend = scheduledQueue.messages.filter((msg: any) => msg.scheduledAt <= now);

      if (messagesToSend.length > 0) {
        setChats((prev: any) => {
          const updated = [...prev];
          messagesToSend.forEach((msg: any) => {
            const idx = updated.findIndex((c: any) => c.id === msg.chatId);
            if (idx > -1) {
              const chat = { ...updated[idx] };
              chat.history = [...(chat.history || []), {
                id: Date.now() + Math.random(),
                text: msg.text,
                sender: 'me',
                status: 'delivered',
              }];
              updated[idx] = { ...chat, message: msg.text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            }
          });
          return updated;
        });

        messagesToSend.forEach((msg: any) => scheduledQueue.removeMessage(msg.id));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [scheduledQueue, setChats]);
};

export const useDataSeeding = () => {
  useEffect(() => {
    const chats = useAppStore.getState().chats;
    const contacts = useAppStore.getState().contacts;
    const channels = useAppStore.getState().channels;
    if (chats.length === 0) {
      seedMockData(
        useAppStore.getState().setChats,
        useAppStore.getState().setContacts,
        useAppStore.getState().setChannels,
        chats, contacts, channels
      );
    }
  }, []);
};
