import { motion } from "motion/react";
import { Plus, X } from "lucide-react";

interface CallFolderBarProps {
  activeFolder: string;
  callFolders: { id: string; name: string }[];
  isDark: boolean;
  t: (key: string) => string;
  onFolderChange: (id: string) => void;
  onDeleteFolder: (id: string) => void;
  onShowCreateFolder: () => void;
}

export const CallFolderBar = ({ activeFolder, callFolders, isDark, t, onFolderChange, onDeleteFolder, onShowCreateFolder }: CallFolderBarProps) => (
  <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 shrink-0">
    <motion.button
      type="button"
      onClick={() => onFolderChange('all')}
      whileTap={{ scale: 0.95 }}
      aria-pressed={activeFolder === 'all'}
      aria-label={t('chat.all')}
      className={`text-[10px] font-bold uppercase cursor-pointer transition-colors px-2.5 py-1.5 rounded-lg shrink-0 whitespace-nowrap ${
        activeFolder === 'all'
          ? (isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600")
          : (isDark ? "text-gray-500 hover:text-gray-300" : "text-slate-400 hover:text-slate-600")
      }`}
    >
      {t('chat.all')}
    </motion.button>
    <motion.button
      type="button"
      onClick={() => onFolderChange('missed')}
      whileTap={{ scale: 0.95 }}
      aria-pressed={activeFolder === 'missed'}
      aria-label={t('chat.missed')}
      className={`text-[10px] font-bold uppercase cursor-pointer transition-colors px-2.5 py-1.5 rounded-lg shrink-0 whitespace-nowrap ${
        activeFolder === 'missed'
          ? (isDark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600")
          : (isDark ? "text-gray-500 hover:text-gray-300" : "text-slate-400 hover:text-slate-600")
      }`}
    >
      {t('chat.missed')}
    </motion.button>
    {callFolders.map(folder => (
      <div key={folder.id} className="shrink-0 flex items-center gap-1 group">
        <motion.button
          type="button"
          onClick={() => onFolderChange(folder.id)}
          whileTap={{ scale: 0.95 }}
          className={`text-[10px] font-bold uppercase cursor-pointer transition-colors px-2.5 py-1.5 rounded-lg whitespace-nowrap flex items-center gap-1 ${
            activeFolder === folder.id ? (isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600") : (isDark ? "text-gray-500 hover:text-gray-300" : "text-slate-400 hover:text-slate-600")
          }`}
          aria-pressed={activeFolder === folder.id}
          aria-label={folder.name}
        >
          <span>{folder.name}</span>
        </motion.button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
          className="min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={`${t('common.delete')} ${folder.name}`}
          title={`${t('common.delete')} ${folder.name}`}
        >
          <X size={10} />
        </button>
      </div>
    ))}
    <motion.button
      type="button"
      onClick={onShowCreateFolder}
      whileTap={{ scale: 0.95 }}
      aria-label={t('chat.newFolder')}
      className={`text-[10px] font-bold uppercase cursor-pointer transition-colors px-2.5 py-1.5 rounded-lg shrink-0 whitespace-nowrap flex items-center gap-1 ${
        isDark ? "text-gray-500 hover:text-gray-300" : "text-slate-400 hover:text-slate-600"
      }`}
    >
      <Plus size={10} /> {t('chat.newFolder')}
    </motion.button>
  </div>
);
