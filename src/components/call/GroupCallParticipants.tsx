import React from 'react';
import { MicOff, Mic } from 'lucide-react';
import { useI18n } from '../../lib/i18n';

interface GroupCallParticipantsProps {
  participants: Array<{
    peerId: string;
    displayName?: string;
    stream?: MediaStream;
    isMuted?: boolean;
  }>;
  onMuteToggle?: (peerId: string) => void;
}

export const GroupCallParticipants: React.FC<GroupCallParticipantsProps> = ({
  participants,
  onMuteToggle,
}) => {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
      {participants.map((participant) => (
        <div
          key={participant.peerId}
          className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden"
        >
          {participant.stream ? (
            <video
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              ref={(el) => {
                if (el && participant.stream) {
                  el.srcObject = participant.stream;
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-2xl font-bold text-[var(--text-primary)]">
                  {(participant.displayName || '?').charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-primary)] text-xs font-medium truncate">
                {participant.displayName || t('call.unknownCaller')}
              </span>
              {participant.isMuted && (
                <div className="flex items-center gap-1 text-red-400">
                  <MicOff size={12} />
                </div>
              )}
            </div>
          </div>

          {onMuteToggle && (
            <button
              type="button"
              onClick={() => onMuteToggle(participant.peerId)}
              className="absolute top-2 right-2 min-w-[44px] min-h-[44px] rounded-full bg-black/50 flex items-center justify-center text-white/70 hover:text-[var(--text-primary)]"
              aria-label={participant.isMuted ? t('chat.unmuteMicrophone') : t('chat.muteMicrophone')}
              title={participant.isMuted ? t('chat.unmuteMicrophone') : t('chat.muteMicrophone')}
            >
              {participant.isMuted ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

