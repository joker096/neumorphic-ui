import { useState } from 'react';
import { Bot, Plus, Trash2 } from 'lucide-react';
import { SettingsRow, SettingsGroup, ToggleSwitch } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { toast } from 'sonner';
import { ConfirmModal } from './ConfirmModal';
import { CreateBotModal } from '../CreateBotModal';
import { BotEditModal } from './BotEditModal';
import type { BotConfig } from '../../store';
import { saveBot, deleteBot } from '../../lib';

interface BotsSectionProps {
  isDark?: boolean;
  bots: BotConfig[];
  setBots: (updater: BotConfig[] | ((prev: BotConfig[]) => BotConfig[])) => void;
  onBack: () => void;
  t: (key: string) => string;
}

export const BotsSection = ({ isDark = false, bots, setBots, onBack, t }: BotsSectionProps) => {
  const [showCreateBotModal, setShowCreateBotModal] = useState(false);
  const [editBotId, setEditBotId] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removeBotId, setRemoveBotId] = useState<string | null>(null);
  const [removeBotName, setRemoveBotName] = useState('');

  const editBot = editBotId ? bots.find(b => b.id === editBotId) : undefined;

  const handleSaveBot = (updated: BotConfig) => {
    setBots(prev => prev.map(b => b.id === updated.id ? updated : b));
    // persist to idb bots_list so localBot.getBotProfile/getMiniApp can resolve it
    void saveBot(updated);
    toast.success(t('settings.botEdited'));
    setEditBotId(null);
  };

  const handleToggleBot = (botId: string) => {
    const bot = bots.find(b => b.id === botId);
    if (!bot) return;
    const next = { ...bot, isRunning: !bot.isRunning };
    setBots(prev => prev.map(b => b.id === botId ? next : b));
    void saveBot(next);
  };

  const handleRemoveBot = (botId: string, botName: string) => {
    setRemoveBotId(botId);
    setRemoveBotName(botName);
    setShowRemoveConfirm(true);
  };

  const handleConfirmRemove = () => {
    if (removeBotId) {
      setBots(prev => prev.filter(b => b.id !== removeBotId));
      void deleteBot(removeBotId);
      toast.success(`${removeBotName} ${t('settings.removed')}`);
    }
    setShowRemoveConfirm(false);
    setRemoveBotId(null);
    setRemoveBotName('');
  };

  return (
    <SubView title={t('settings.bots')} isDark={isDark} onBack={onBack}>
      {bots.length === 0 ? (
        <div className={`text-center py-8 text-sm ${isDark ? "text-gray-500" : "text-slate-400"}`}>
          <Bot size={32} className="mx-auto mb-3 opacity-40" />
          {t('settings.noBots')}
        </div>
      ) : (
        <SettingsGroup isDark={isDark} className="mb-6">
          {bots.map(bot => (
            <SettingsRow
              key={bot.id}
              icon={<Bot size={16} />}
              iconBg={bot.isRunning ? (isDark ? "bg-emerald-500/10" : "bg-emerald-100") : (isDark ? "bg-gray-500/10" : "bg-gray-100")}
              iconColor={bot.isRunning ? (isDark ? "text-emerald-400" : "text-emerald-600") : (isDark ? "text-gray-400" : "text-gray-500")}
              title={bot.name}
              subtitle={bot.isRunning ? t('settings.botRunning') : t('settings.botStopped')}
              isDark={isDark}
              rightElement={
                <div className="flex items-center" onClick={e => e.stopPropagation()}>
                  <ToggleSwitch
                    isOn={bot.isRunning}
                    onToggle={() => handleToggleBot(bot.id)}
                    isDark={isDark}
                    ariaLabel={bot.name}
                  />
                  <button
                    onClick={() => handleRemoveBot(bot.id, bot.name)}
                    className="flex items-center justify-center w-9 h-9 min-w-11 min-h-11 -mr-2 rounded-lg hover:text-red-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    title={t('settings.removeBot')}
                    aria-label={t('settings.removeBot')}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              }
              onClick={() => setEditBotId(bot.id)}
            />
          ))}
        </SettingsGroup>
      )}

      <SettingsGroup isDark={isDark}>
        <SettingsRow
          icon={<Plus size={16} />}
          iconBg="t-accent-bg"
          iconColor="t-accent"
          title={t('settings.addBot')}
          subtitle={t('settings.addBotSubtitle')}
          isDark={isDark}
          onClick={() => setShowCreateBotModal(true)}
        />
      </SettingsGroup>

      <ConfirmModal
        isOpen={showRemoveConfirm}
        title={t('settings.confirmRemoveBot')}
        confirmLabel={t('settings.remove')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        onConfirm={handleConfirmRemove}
        onCancel={() => { setShowRemoveConfirm(false); setRemoveBotId(null); setRemoveBotName(''); }}
      />

      {showCreateBotModal && (
        <CreateBotModal
          theme={isDark ? 'dark' : 'light'}
          onCreated={() => toast.success(t('settings.botAdded'))}
          onClose={() => setShowCreateBotModal(false)}
        />
      )}

      {editBot && (
        <BotEditModal
          bot={editBot}
          theme={isDark ? 'dark' : 'light'}
          onSave={handleSaveBot}
          onClose={() => setEditBotId(null)}
        />
      )}
    </SubView>
  );
};
