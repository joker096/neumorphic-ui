import { Sheet } from './ui/Sheet';
import { Phone, PhoneMissed, PhoneIncoming, PhoneOutgoing, Clock, Trash2 } from 'lucide-react';
import { useAppStore } from '../store';
import { useState, useEffect } from 'react';

interface CallHistoryViewProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

interface CallLogEntry {
  id: string;
  peerName: string;
  type: 'incoming' | 'outgoing' | 'missed';
  timestamp: number;
  duration: number;
}

export function CallHistoryView({ isOpen, onClose, isDark }: CallHistoryViewProps) {
  const [callLog, setCallLog] = useState<CallLogEntry[]>([]);
  const { recordings } = useAppStore();

  useEffect(() => {
    const stored = localStorage.getItem('mess-anger-call-log');
    if (stored) {
      try { setCallLog(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, [isOpen]);

  const clearLog = () => {
    setCallLog([]);
    localStorage.removeItem('mess-anger-call-log');
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return seconds > 0 ? `${m}:${s.toString().padStart(2, '0')}` : '';
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'incoming': return <PhoneIncoming size={16} className="text-green-500" />;
      case 'outgoing': return <PhoneOutgoing size={16} className="text-blue-500" />;
      case 'missed': return <PhoneMissed size={16} className="text-red-500" />;
      default: return <Phone size={16} />;
    }
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} detent="large">
      <div className="flex items-center justify-between pt-4 mb-4">
        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
          Call History
        </h2>
        {callLog.length > 0 && (
          <button
            onClick={clearLog}
            className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full ${
              isDark ? 'text-red-400 hover:bg-red-500/20' : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <Trash2 size={12} />
            Clear All
          </button>
        )}
      </div>

      {callLog.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-16 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
          <Phone size={32} className="mb-4 opacity-50" />
          <span className="text-sm">No call history</span>
        </div>
      ) : (
        <div className="space-y-1">
          {callLog.slice(0, 50).map((entry) => (
            <div
              key={entry.id}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
              }`}
            >
              {getIcon(entry.type)}
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {entry.peerName}
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'} flex items-center gap-2`}>
                  <Clock size={10} />
                  {new Date(entry.timestamp).toLocaleString()}
                  {entry.duration > 0 && <span>({formatDuration(entry.duration)})</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}
