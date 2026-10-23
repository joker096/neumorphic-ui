import { useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '../constants/storage';

/**
 * Ephemeral state owned by the composition root: which overlay is open and what
 * the composer currently holds. None of it belongs to a slice — the moment it has
 * to survive a reload or be read outside `App` it moves to the store instead
 * (saved messages are the exception: they are user data and persist).
 */
export function useAppLocalUiState() {
  const [activeStory, setActiveStory] = useState<{ id: number | string; name: string; color: string } | null>(null);
  const [showStoryComposer, setShowStoryComposer] = useState(false);
  const [activeBotId, setActiveBotId] = useState<string | null>(null);
  const [miniAppBotId, setMiniAppBotId] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<any>(null);
  const [savedMessages, setSavedMessages] = useLocalStorage<any[]>(STORAGE_KEYS.SAVED_MESSAGES, []);

  const [messageText, setMessageText] = useState("");
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceNoteError, setVoiceNoteError] = useState("");
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [morseMode, setMorseMode] = useState(false);
  const [silentMode, setSilentMode] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  return {
    activeStory, setActiveStory,
    showStoryComposer, setShowStoryComposer,
    activeBotId, setActiveBotId,
    miniAppBotId, setMiniAppBotId,
    replyTarget, setReplyTarget,
    savedMessages, setSavedMessages,
    messageText, setMessageText,
    isRecordingVoice, setIsRecordingVoice,
    voiceNoteError, setVoiceNoteError,
    showSchedulePopup, setShowSchedulePopup,
    scheduleDateTime, setScheduleDateTime,
    morseMode, setMorseMode,
    silentMode, setSilentMode,
    showStickerPicker, setShowStickerPicker,
  };
}
