import { Bot, Plus, Power, Trash2 } from 'lucide-react';
import { SettingsRow, SettingsGroup, SettingsSectionTitle } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { toast } from 'sonner';
import type { BotConfig } from '../../store';

interface BotsSectionProps {
  isDark: boolean;
  bots: BotConfig[];
  setBots: (updater: BotConfig[] | ((prev: BotConfig[]) => BotConfig[])) => void;
  onBack: () => void;
  t: (key: string) => string;
}

export const BotsSection = ({ isDark, bots, setBots, onBack, t }: BotsSectionProps) => {
  const handleAddBot = () => {
    const name = prompt(t('settings.enterBotName'));
    if (!name?.trim()) return;
    const newBot: BotConfig = {
      id: `bot_${Date.now()}`,
      name: name.trim(),
      token: '',
      publicKey: '',
      ownerId: 'current-user',
      commands: [],
      permissions: {
        readMessages: true,
        sendMessages: true,
        editMessages: false,
        deleteMessages: false,
        inlineKeyboard: true,
        readUserData: false,
        accessGroups: false,
        accessFiles: false,
      },
      isRunning: false,
    };
    setBots(prev => [...prev, newBot]);
    toast.success(t('settings.botAdded'));
  };

  const handleToggleBot = (botId: string) => {
    setBots(prev => prev.map(b => b.id === botId ? { ...b, isRunning: !b.isRunning } : b));
  };

  const handleRemoveBot = (botId: string, botName: string) => {
    if (confirm(t('settings.confirmRemoveBot'))) {
      setBots(prev => prev.filter(b => b.id !== botId));
      toast.success(`${botName} ${t('settings.removed')}`);
    }
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
              onClick={() => handleToggleBot(bot.id)}
            />
          ))}
        </SettingsGroup>
      )}

      <SettingsGroup isDark={isDark}>
        <SettingsRow
          icon={<Plus size={16} />}
          iconBg={isDark ? "bg-blue-500/10" : "bg-blue-100"}
          iconColor={isDark ? "text-blue-400" : "text-blue-600"}
          title={t('settings.addBot')}
          subtitle={t('settings.addBotSubtitle')}
          isDark={isDark}
          onClick={handleAddBot}
        />
      </SettingsGroup>
    </SubView>
  );
};
