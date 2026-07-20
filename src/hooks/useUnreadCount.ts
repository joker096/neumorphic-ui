import { useMemo } from "react";
import { useAppStore } from "../store";

export function useUnreadCount(chats: any[], channels: any[]) {
  const companyUnread = useAppStore(state => state.companyChannels?.reduce((sum: number, c: any) => sum + (c.unread || 0), 0) || 0);
  const chatsUnread = useMemo(() => chats.reduce((sum: number, c: any) => sum + (c.unread || 0), 0), [chats]);
  return { chatsUnread, companyUnread };
}
