import { useState } from "react";

/**
 * Controlled/uncontrolled mirroring for the composer draft fields.
 *
 * The chat preview accepts every draft field either as a prop (the caller owns
 * the state — an external composer) or undefined, in which case this hook owns
 * it. The public names keep the `e…`/`set…Fn2` spelling the caller destructures.
 */
interface ChatPreviewDraftProps {
  messageText?: string;
  setMessageText?: (text: string) => void;
  morseMode?: boolean;
  setMorseMode?: (mode: boolean) => void;
  silentMode?: boolean;
  setSilentMode?: (mode: boolean) => void;
  showStickerPicker?: boolean;
  setShowStickerPicker?: (show: boolean) => void;
  isRecordingVoice?: boolean;
  setIsRecordingVoice?: (recording: boolean) => void;
  voiceNoteError?: string;
  setVoiceNoteError?: (error: string) => void;
  scheduleDateTime?: string;
  setScheduleDateTime?: (value: string) => void;
  showSchedulePopup?: boolean;
  setShowSchedulePopup?: (show: boolean) => void;
  replyTarget?: any;
  setReplyTargetProp?: (target: any) => void;
}

export function useChatPreviewDraft(props: ChatPreviewDraftProps) {
  const {
    messageText,
    setMessageText,
    morseMode,
    setMorseMode,
    silentMode,
    setSilentMode,
    showStickerPicker,
    setShowStickerPicker,
    isRecordingVoice,
    setIsRecordingVoice,
    voiceNoteError,
    setVoiceNoteError,
    scheduleDateTime,
    setScheduleDateTime,
    showSchedulePopup,
    setShowSchedulePopup,
    replyTarget,
    setReplyTargetProp,
  } = props;

  const [localMessageText, setLocalMessageText] = useState("");
  const [localMorseMode, setLocalMorseMode] = useState(false);
  const [localSilentMode, setLocalSilentMode] = useState(false);
  const [localShowStickerPicker, setLocalShowStickerPicker] = useState(false);
  const [localIsRecordingVoice, setLocalIsRecordingVoice] = useState(false);
  const [localVoiceNoteError, setLocalVoiceNoteError] = useState("");
  const [localScheduleDateTime, setLocalScheduleDateTime] = useState("");
  const [localShowSchedulePopup, setLocalShowSchedulePopup] = useState(false);
  const [localReplyTarget, setLocalReplyTarget] = useState<any>(null);

  const eMsgText = messageText ?? localMessageText;
  const eMorseMode = morseMode ?? localMorseMode;
  const eSilentMode = silentMode ?? localSilentMode;
  const eShowStickerPicker = showStickerPicker ?? localShowStickerPicker;
  const eIsRecordingVoice = isRecordingVoice ?? localIsRecordingVoice;
  const eVoiceNoteError = voiceNoteError ?? localVoiceNoteError;
  const eScheduleDateTime = scheduleDateTime ?? localScheduleDateTime;
  const eShowSchedulePopup = showSchedulePopup ?? localShowSchedulePopup;
  const eReplyTarget = replyTarget ?? localReplyTarget;
  const setMsgTextFn = setMessageText ?? ((v: string) => { setLocalMessageText(v); });
  const setMorseModeFn2 = setMorseMode ?? ((v: boolean) => { setLocalMorseMode(v); });
  const setSilentModeFn2 = setSilentMode ?? ((v: boolean) => { setLocalSilentMode(v); });
  const setShowStickerPickerFn2 = setShowStickerPicker ?? ((v: boolean) => { setLocalShowStickerPicker(v); });
  const setIsRecordingVoiceFn2 = setIsRecordingVoice ?? ((v: boolean) => { setLocalIsRecordingVoice(v); });
  const setVoiceNoteErrFn2 = setVoiceNoteError ?? ((v: string) => { setLocalVoiceNoteError(v); });
  const setScheduleDtFn2 = setScheduleDateTime ?? ((v: string) => { setLocalScheduleDateTime(v); });
  const setShowSchedulePopupFn2 = setShowSchedulePopup ?? ((v: boolean) => { setLocalShowSchedulePopup(v); });
  const setReplyTargetFn2 = setReplyTargetProp ?? ((t: any) => { setLocalReplyTarget(t); });

  // A send clears the draft, but silent mode is cleared through this escape
  // hatch rather than through `setSilentModeFn2`: when the caller owns the flag
  // it must stay the caller's decision, exactly as before the split.
  const resetSilentDraft = () => { setLocalSilentMode(false); };

  return {
    eMsgText, setMsgTextFn,
    eMorseMode, setMorseModeFn2,
    eSilentMode, setSilentModeFn2,
    eShowStickerPicker, setShowStickerPickerFn2,
    eIsRecordingVoice, setIsRecordingVoiceFn2,
    eVoiceNoteError, setVoiceNoteErrFn2,
    eScheduleDateTime, setScheduleDtFn2,
    eShowSchedulePopup, setShowSchedulePopupFn2,
    eReplyTarget, setReplyTargetFn2,
    resetSilentDraft,
  };
}

export type ChatPreviewDraft = ReturnType<typeof useChatPreviewDraft>;