import React from 'react';
import { MicOff, Mic } from 'lucide-react';

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
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
      {participants.map((participant) => (
        <div
          key={participant.peerId}
          className="relative aspect-video bg-gray-800 rounded-2xl overflow-hidden"
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
                <span className="text-2xl font-bold text-white">
                  {(participant.displayName || '?').charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex items-center justify-between">
              <span className="text-white text-xs font-medium truncate">
                {participant.displayName || 'Unknown'}
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
              onClick={() => onMuteToggle(participant.peerId)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white/70 hover:text-white"
            >
              {participant.isMuted ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
