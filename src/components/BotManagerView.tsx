import { useState } from 'react';
import { Sheet } from './ui/Sheet';
import { useAppStore } from '../store';
import { Bot, Plus, Power, Settings, Trash2, Terminal, MessageSquare } from 'lucide-react';

interface BotManagerViewProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export function BotManagerView({ isOpen, onClose, isDark }: BotManagerViewProps) {
  const { bots, setBots } = useAppStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newToken, setNewToken] = useState('');
  const [newCommands, setNewCommands] = useState('');

  const createBot = () => {
    if (!newName.trim()) return;
    const bot = {
      id: `bot_${Date.now()}`,
      name: newName.trim(),
      token: newToken.trim() || crypto.randomUUID().slice(0, 16),
      publicKey: crypto.randomUUID().replace(/-/g, '').slice(0, 32),
      ownerId: 'current-user',
      commands: newCommands.split('\n').filter(Boolean).map(cmd => ({
        command: cmd.trim(),
        description: `Execute ${cmd.trim()}`,
      })),
      permissions: { read: true, write: false, admin: false },
      isRunning: false,
    };
    setBots([...bots, bot]);
    setNewName('');
    setNewToken('');
    setNewCommands('');
    setShowCreate(false);
  };

  const toggleBot = (botId: string) => {
    setBots(bots.map(b => b.id === botId ? { ...b, isRunning: !b.isRunning } : b));
  };

  const deleteBot = (botId: string) => {
    setBots(bots.filter(b => b.id !== botId));
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} detent="large">
      <div className="pt-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            Bot Manager
          </h2>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
              isDark ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
            }`}
          >
            <Plus size={16} />
            New Bot
          </button>
        </div>

        {showCreate && (
          <div className={`mb-6 p-4 rounded-2xl space-y-3 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Bot name"
              className={`w-full px-4 py-3 rounded-xl text-sm outline-none ${
                isDark ? 'bg-[#1C1C1E] text-white border border-white/10' : 'bg-white text-slate-800 border border-black/10'
              }`}
            />
            <input
              type="text"
              value={newToken}
              onChange={(e) => setNewToken(e.target.value)}
              placeholder="Token (auto-generated if empty)"
              className={`w-full px-4 py-3 rounded-xl text-sm outline-none ${
                isDark ? 'bg-[#1C1C1E] text-white border border-white/10' : 'bg-white text-slate-800 border border-black/10'
              }`}
            />
            <textarea
              value={newCommands}
              onChange={(e) => setNewCommands(e.target.value)}
              placeholder="Commands (one per line):&#10;/start&#10;/help&#10;/info"
              rows={3}
              className={`w-full px-4 py-3 rounded-xl text-sm outline-none resize-none ${
                isDark ? 'bg-[#1C1C1E] text-white border border-white/10' : 'bg-white text-slate-800 border border-black/10'
              }`}
            />
            <button
              onClick={createBot}
              className="w-full py-3 rounded-xl text-sm font-bold bg-blue-500 text-white hover:bg-blue-600 transition-all active:scale-95"
            >
              Create Bot
            </button>
          </div>
        )}

        {bots.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-16 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
            <Bot size={40} className="mb-4 opacity-50" />
            <span className="text-sm">No bots yet. Create one to get started.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {bots.map((bot) => (
              <div
                key={bot.id}
                className={`p-4 rounded-2xl space-y-3 ${
                  isDark ? 'bg-[#1C1C1E] border border-white/5' : 'bg-white border border-black/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    bot.isRunning ? 'bg-green-500/20 text-green-400' : isDark ? 'bg-white/10 text-gray-400' : 'bg-black/5 text-slate-500'
                  }`}>
                    <Bot size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{bot.name}</div>
                    <div className={`text-xs font-mono ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                      {bot.commands.length} commands · {bot.token.slice(0, 8)}...
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleBot(bot.id)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                        bot.isRunning
                          ? 'bg-green-500/20 text-green-400'
                          : isDark ? 'bg-white/10 text-gray-400' : 'bg-black/5 text-slate-500'
                      }`}
                    >
                      <Power size={16} />
                    </button>
                    <button
                      onClick={() => deleteBot(bot.id)}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {bot.commands.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {bot.commands.map((cmd, i) => (
                      <div
                        key={i}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                          isDark ? 'bg-white/5 text-gray-400' : 'bg-black/5 text-slate-500'
                        }`}
                      >
                        {cmd.command}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}
