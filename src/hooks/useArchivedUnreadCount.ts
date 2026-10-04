import { useMemo } from "react";

/** Unread badge total for archived chats + channels (sidebar footer). */
export const useArchivedUnreadCount = (
  chats: any[],
  channels: any[],
  archivedChats: (string | number)[],
) => useMemo(() => {
  let count = 0;
  chats.forEach(c => { if (archivedChats.includes(c.id)) count += c.unread || 0; });
  channels.forEach(c => { if (archivedChats.includes(c.id)) count += (c as any).unread || 0; });
  return count;
}, [chats, channels, archivedChats]);
