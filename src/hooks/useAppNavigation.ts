import { useCallback, useMemo } from "react";
import { useAppStore } from "../store";
import type { Dispatch, SetStateAction } from "react";
import { callManager } from "../lib/call/CallManager";

type View = 'hub' | 'chats' | 'channels' | 'bots' | 'radar' | 'pulse' | 'calls' | 'settings' | 'profile' | 'contacts' | 'stories' | 'recordings' | 'company' | 'workplace' | 'bot' | 'miniApp';

// Auto-dismiss preview (demo) calls that never connect to a real peer.
let previewCallTimer: ReturnType<typeof setTimeout> | null = null;

export function useAppNavigation(
  view: View,
  chats: any[],
  activeChat: any,
  setView: Dispatch<SetStateAction<View>>,
  setSubView: Dispatch<SetStateAction<string | null>>,
  setActiveChat: Dispatch<SetStateAction<any>>,
  setChats: Dispatch<SetStateAction<any[]>>,
  setActiveCall: (call: any) => void,
) {

  const handleNavigate = useCallback((target: string) => {
    setView(target as View);
    setSubView(null);
  }, [setView, setSubView]);

  const handlePreviewCall = useCallback((name: string, color?: string, callType: 'audio' | 'video' = 'audio') => {
    const existingCall = useAppStore.getState().activeCall;
    if (existingCall && existingCall.callType === callType && existingCall.status !== 'ended') {
      setActiveCall(existingCall);
      return;
    }
    // Route through CallManager so the full CallScreen (driven by `useCall`) renders.
    callManager.startPreviewCall('preview', name, callType).catch(() => {});
    if (previewCallTimer) clearTimeout(previewCallTimer);
    previewCallTimer = setTimeout(() => {
      const cur = useAppStore.getState().activeCall as any;
      if (cur && cur.isPreview && cur.status === 'connecting') {
        callManager.endCall().catch(() => {});
      }
    }, 30000);
  }, [setActiveCall]);

  const handlePreviewMessage = useCallback((name: string, color?: string) => {
    setView("chats");
    const existingChat = chats.find((chat) => chat.name === name && chat.type === "direct");
    if (existingChat) {
      setActiveChat(existingChat);
      return;
    }

    const newChat = {
      id: Date.now(),
      name,
      type: "direct" as const,
      color: color || "from-blue-400 to-indigo-500",
      online: true,
      history: [],
    };
    setChats((prev: any[]) => [newChat, ...prev] as any);
    setActiveChat(newChat);
  }, [chats, setView, setActiveChat, setChats]);

  const isChatListRoute = useMemo(() =>
    ["chats", "channels", "bots", "stories"].includes(view),
    [view],
  );

  return {
    handleNavigate,
    handlePreviewCall,
    handlePreviewMessage,
    isChatListRoute,
  };
}
