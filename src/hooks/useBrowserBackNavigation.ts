import { useEffect, useRef } from 'react';

interface UseBrowserBackNavigationParams {
  view: string;
  subView: string | null;
  activeChatId: string | number | null;
  chats: any[];
  channels: any[];
  setView: (view: any) => void;
  setSubView: (subView: any) => void;
  setActiveChat: (chat: any) => void;
}

// Browser/hardware Back support (Telegram-like step-back: chat → list → chats)
export const useBrowserBackNavigation = ({
  view,
  subView,
  activeChatId,
  chats,
  channels,
  setView,
  setSubView,
  setActiveChat,
}: UseBrowserBackNavigationParams): void => {
  const chatsRef = useRef(chats);
  chatsRef.current = chats;
  const channelsRef = useRef(channels);
  channelsRef.current = channels;
  const lastPushed = useRef("");
  const skipNextPush = useRef(false);

  useEffect(() => {
    window.history.replaceState(
      { view, activeChatId, subView },
      "",
    );
    const onPop = (e: PopStateEvent) => {
      const s = e.state as { view?: string; activeChatId?: string | number; subView?: string | null } | null;
      if (!s) return;
      skipNextPush.current = true;
      setView((s.view as any) ?? "chats");
      setSubView(s.subView ?? null);
      const id = s.activeChatId;
      const found = id != null
        ? [...chatsRef.current, ...channelsRef.current].find((c: any) => c.id === id)
        : null;
      setActiveChat(found ?? null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (skipNextPush.current) {
      skipNextPush.current = false;
      return;
    }
    const key = `${view}|${activeChatId}|${subView}`;
    if (key === lastPushed.current) return;
    lastPushed.current = key;
    window.history.pushState({ view, activeChatId, subView }, "");
  }, [view, activeChatId, subView]);
};
