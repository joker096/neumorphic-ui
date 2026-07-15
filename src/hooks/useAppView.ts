import { useState, useCallback } from 'react';

export type AppView = 'hub' | 'chats' | 'channels' | 'bots' | 'radar' | 'pulse' | 'calls' | 'settings' | 'contacts' | 'stories' | 'recordings' | 'company';

export function useAppView() {
  const [view, setView] = useState<AppView>('chats');
  const [subView, setSubView] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [activeChat, setActiveChat] = useState<any>(null);

  const handleNavigate = useCallback((target: string) => {
    setActiveChat(null);
    setView(target as AppView);
    setSubView(null);
  }, []);

  return {
    view, setView,
    subView, setSubView,
    activeFolder, setActiveFolder,
    activeChat, setActiveChat,
    handleNavigate,
  };
}
