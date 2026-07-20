import { useRef, useEffect, useCallback } from "react";

export interface MessageActions {
  handleSendMessage: () => void;
  sendVoiceMessage: (url: string, duration: string) => void;
  sendStickerMessage: (sticker: string) => void;
  handlePreviewCall: (name: string, color?: string, type?: string) => void;
  handlePreviewMessage: (name: string, color?: string) => void;
}

export function useRefMessageActions(actions: MessageActions) {
  const handleSendMessageRef = useRef(actions.handleSendMessage);
  const sendVoiceMessageRef = useRef(actions.sendVoiceMessage);
  const sendStickerMessageRef = useRef(actions.sendStickerMessage);
  const handlePreviewCallRef = useRef(actions.handlePreviewCall);
  const handlePreviewMessageRef = useRef(actions.handlePreviewMessage);

  useEffect(() => { handleSendMessageRef.current = actions.handleSendMessage }, [actions.handleSendMessage]);
  useEffect(() => { sendVoiceMessageRef.current = actions.sendVoiceMessage }, [actions.sendVoiceMessage]);
  useEffect(() => { sendStickerMessageRef.current = actions.sendStickerMessage }, [actions.sendStickerMessage]);
  useEffect(() => { handlePreviewCallRef.current = actions.handlePreviewCall }, [actions.handlePreviewCall]);
  useEffect(() => { handlePreviewMessageRef.current = actions.handlePreviewMessage }, [actions.handlePreviewMessage]);

  return {
    handleSendMessageRef: useCallback(() => handleSendMessageRef.current(), [handleSendMessageRef]) as () => void,
    sendVoiceMessageRef: useCallback((url: string, duration: string) => sendVoiceMessageRef.current(url, duration), [sendVoiceMessageRef]) as (url: string, duration: string) => void,
    sendStickerMessageRef: useCallback((sticker: string) => sendStickerMessageRef.current(sticker), [sendStickerMessageRef]) as (sticker: string) => void,
    handlePreviewCallRef: useCallback((name: string, color?: string, type?: string) => handlePreviewCallRef.current(name, color, type), [handlePreviewCallRef]) as (name: string, color?: string, type?: string) => void,
    handlePreviewMessageRef: useCallback((name: string, color?: string) => handlePreviewMessageRef.current(name, color), [handlePreviewMessageRef]) as (name: string, color?: string) => void,
  };
}
