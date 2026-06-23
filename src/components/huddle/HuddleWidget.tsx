import React from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { callManager } from '../../lib/call/CallManager';
import type { CallEventType } from '../../lib/call/types';

interface HuddleWidgetProps {
  chatId: string;
  chatName?: string;
}

export const HuddleWidget: React.FC<HuddleWidgetProps> = ({ chatId, chatName }) => {
  const [isInHuddle, setIsInHuddle] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [participants, setParticipants] = React.useState<string[]>([]);
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    const unsub = callManager.subscribe((event: { type: CallEventType; data?: any }) => {
      switch (event.type) {
        case 'call:peer-joined':
          setParticipants((prev) => [...prev, event.data?.peerId || '']);
          break;
        case 'call:peer-left':
          setParticipants((prev) => prev.filter((p) => p !== event.data?.peerId));
          break;
        case 'call:ended':
          setIsInHuddle(false);
          setParticipants([]);
          break;
        default:
          break;
      }
    });
    return unsub;
  }, []);

  const handleJoin = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      await callManager.startCall(chatId, chatName || 'Huddle', 'audio');
      setIsInHuddle(true);
      setIsActive(true);
    } catch (err) {
      console.error('Failed to join huddle:', err);
    }
  };

  const handleLeave = async () => {
    await callManager.endCall();
    setIsInHuddle(false);
    setIsActive(false);
    setParticipants([]);
  };

  const handleToggleMute = async () => {
    const muted = await callManager.toggleMute();
    setIsMuted(muted);
  };

  if (!isActive) {
    return (
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Mic size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Huddle</p>
              <p className="text-white/50 text-xs">Voice chat</p>
            </div>
          </div>
          <button
            onClick={handleJoin}
            className="px-4 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium"
          >
            Join
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
            <Mic size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">Huddle Active</p>
            <p className="text-white/50 text-xs">{participants.length + 1} participants</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleMute}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isMuted
                ? 'bg-red-500 text-white'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button
            onClick={handleLeave}
            className="px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
};
