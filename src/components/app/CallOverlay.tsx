import { lazy, Suspense, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useCall } from "../../hooks/useCall";
import { useAppStore } from "../../store";
import { callManager } from "../../lib/call/CallManager";
import { useI18n } from "../../lib/i18n";
import type { CallEventType } from "../../lib/call/types";

const LazyCallScreen = lazy(() => import("../call/CallScreen").then((m) => ({ default: m.CallScreen })));
const LazyIncomingCallSheet = lazy(() => import("../call/IncomingCallSheet").then((m) => ({ default: m.IncomingCallSheet })));

export const CallOverlay = () => {
  const callMinimized = useAppStore((s) => s.callMinimized);
  const setCallMinimized = useAppStore((s) => s.setCallMinimized);
  const setActiveCall = useAppStore((s) => s.setActiveCall);
  const incomingCall = useAppStore((s) => s.incomingCall);
  const { t } = useI18n();
  const {
    call, endCall, toggleMute, toggleVideo,
    toggleScreenShare, toggleRecording, toggleSpeaker, flipCamera, changeCallType,
  } = useCall();

  useEffect(() => {
    return callManager.subscribe((event: { type: CallEventType; data?: any }) => {
      if (event.type === 'call:quality') {
        const level = event.data?.level as number | undefined;
        if (level === 1) toast.error(t('call.networkQualityPoor'));
        else if (level === 2) toast.warning(t('call.networkQualityFair'));
        else if (level === 3) toast.success(t('call.networkQualityGood'));
        return;
      }
      if (event.type !== 'call:error') return;
      const reason = event.data?.reason as string | undefined;
      if (reason === 'permission') toast.error(t('call.permissionDenied'));
      else if (reason === 'no-device') toast.error(t('call.noDevice'));
      else if (reason === 'device-busy') toast.error(t('call.deviceBusy'));
      else toast.error(t('call.startFailed'));
    });
  }, [t]);

  return (
    <Suspense fallback={null}>
      <AnimatePresence>
        {call && !callMinimized && (
          <LazyCallScreen
            call={call}
            onEnd={endCall}
            toggleMute={toggleMute}
            toggleVideo={toggleVideo}
            toggleScreenShare={toggleScreenShare}
            toggleRecording={toggleRecording}
            toggleSpeaker={toggleSpeaker}
            flipCamera={flipCamera}
            changeCallType={changeCallType}
            setActiveCall={setActiveCall}
            onMinimize={() => setCallMinimized(true)}
          />
        )}
        {incomingCall && (
          <LazyIncomingCallSheet
            callerName={incomingCall.displayName}
            callType={incomingCall.callType}
            onAccept={() => {
              void callManager.answerIncoming().catch(() => {});
            }}
            onReject={() => {
              callManager.rejectIncoming();
            }}
            onAcceptVideo={() => {
              void callManager.answerIncoming('video').catch(() => {});
            }}
          />
        )}
      </AnimatePresence>
    </Suspense>
  );
};
