import { useCallback, useState } from "react";

export type AppView =
  | 'chats' | 'channels' | 'bots' | 'settings' | 'profile' | 'contacts'
  | 'stories' | 'company' | 'calls' | 'workplace' | 'bot' | 'miniApp';

/**
 * Root navigation state: current view/sub-view, the recorded origin for
 * cross-view drill-downs and the chat open/close callbacks. Everything the
 * "where do I come back to" logic needs lives here, so `App` only wires the
 * result into the shell.
 */
export const useAppViewNavigation = ({
  contacts,
  chatReturnContext,
  setChatReturnContext,
  setActiveChat,
}: {
  contacts: any[];
  chatReturnContext: { view: string; subView: string | null } | null;
  setChatReturnContext: (ctx: { view: string; subView: string | null } | null) => void;
  setActiveChat: (chat: any) => void;
}) => {
  const [view, setView] = useState<AppView>('chats');
  const [subView, setSubView] = useState<string | null>(null);

  // Cross-view drill-downs (CRM→premium, list→bot, bot→miniApp) remember their
  // origin so the in-app Back button always returns to the previous screen.
  const [navOrigin, setNavOrigin] = useState<{ view: string; subView: string | null } | null>(null);

  // Resolve whether a chat belongs to a company (so back returns to CRM).
  const isCompanyChat = useCallback((chat: any) => {
    if (!chat) return false;
    if ((chat as any).company) return true;
    const match = contacts.find((ct: any) => ct.name === chat.name || ct.id === chat.id);
    return !!(match && match.company);
  }, [contacts]);

  // Open a chat, recording where the back button should return to.
  const openChat = useCallback((chat: any, opts?: { returnTo?: { view: string; subView?: string | null }; forceView?: string }) => {
    const route = (["chats", "channels", "bots"] as string[]).includes(view) ? view : "chats";
    if (opts?.returnTo) {
      setChatReturnContext({ view: opts.returnTo.view, subView: opts.returnTo.subView ?? null });
    } else if (isCompanyChat(chat)) {
      setChatReturnContext({ view: "company", subView: null });
    } else {
      setChatReturnContext({ view: route, subView });
    }
    setView((opts?.forceView as any) || route);
    setActiveChat(chat);
  }, [isCompanyChat, view, subView, setChatReturnContext, setView, setActiveChat]);

  // Back/close from a chat: return to the recorded context.
  const closeChat = useCallback(() => {
    if (chatReturnContext) {
      setView(chatReturnContext.view as any);
      setSubView(chatReturnContext.subView);
    }
    setActiveChat(null);
  }, [chatReturnContext, setView, setSubView, setActiveChat]);

  const pushView = useCallback((v: string, sv: string | null = null) => {
    setNavOrigin({ view, subView });
    setView(v as any);
    setSubView(sv);
  }, [view, subView, setView, setSubView]);

  const goBack = useCallback(() => {
    if (navOrigin) {
      setView(navOrigin.view as any);
      setSubView(navOrigin.subView);
      setNavOrigin(null);
    } else {
      setView("chats");
      setSubView(null);
    }
  }, [navOrigin, setView, setSubView]);

  // Single house upsell target for every premium gate (side list, CRM, profile, locked stickers).
  const openPremium = useCallback(() => {
    pushView("settings", "premium");
  }, [pushView]);

  return {
    view, setView, subView, setSubView, setNavOrigin,
    openChat, closeChat, pushView, goBack, openPremium,
  };
};
