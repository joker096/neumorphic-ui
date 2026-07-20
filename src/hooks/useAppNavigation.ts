import { useCallback, useMemo } from "react";
import { useAppStore } from "../store";
import type { Dispatch, SetStateAction } from "react";

type View = 'hub' | 'chats' | 'channels' | 'bots' | 'radar' | 'pulse' | 'calls' | 'settings' | 'contacts' | 'stories' | 'recordings' | 'company';

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
    setActiveChat(null);
    setView(target as View);
    setSubView(null);
  }, [setActiveChat, setView, setSubView]);

  const handlePreviewCall = useCallback((name: string, color?: string, callType: 'audio' | 'video' = 'audio') => {
    const existingCall = useAppStore.getState().activeCall;
    if (existingCall && existingCall.callType === callType && existingCall.status !== 'ended') {
      setActiveCall(existingCall);
      setView("calls");
      return;
    }
    const mockCall = {
      callId: `preview_${Date.now()}`,
      direction: 'outgoing' as const,
      status: 'connecting' as const,
      callType: callType as 'audio' | 'video',
      remotePeer: { peerId: 'preview', displayName: name },
      localStream: null,
      screenStream: null,
      isMuted: false,
      isSpeaker: false,
      isVideoEnabled: callType === 'video',
      isVideo: callType === 'video',
      isRecording: false,
      startTime: Date.now(),
      participants: [],
    };
    useAppStore.getState().setActiveCall(mockCall);
    setView("calls");
  }, [setActiveCall, setView]);

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
