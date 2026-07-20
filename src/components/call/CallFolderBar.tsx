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
      onClick={() => onFolderChange('all')}
      whileTap={{ scale: 0.95 }}
      className={`text-[10px] font-bold uppercase cursor-pointer transition-colors px-2.5 py-1.5 rounded-lg shrink-0 whitespace-nowrap ${
        activeFolder === 'all'
          ? (isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600")
          : (isDark ? "text-gray-500 hover:text-gray-300" : "text-slate-400 hover:text-slate-600")
      }`}
    >
      {t('chat.all')}
    </motion.button>
    <motion.button
      onClick={() => onFolderChange('missed')}
      whileTap={{ scale: 0.95 }}
      className={`text-[10px] font-bold uppercase cursor-pointer transition-colors px-2.5 py-1.5 rounded-lg shrink-0 whitespace-nowrap ${
        activeFolder === 'missed'
          ? (isDark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600")
          : (isDark ? "text-gray-500 hover:text-gray-300" : "text-slate-400 hover:text-slate-600")
      }`}
    >
      {t('chat.missed')}
    </motion.button>
    {callFolders.map(folder => (
      <div key={folder.id}
        onClick={() => onFolderChange(folder.id)}
        className={`text-[10px] font-bold uppercase cursor-pointer transition-colors px-2.5 py-1.5 rounded-lg shrink-0 whitespace-nowrap flex items-center gap-1 group`}
      >
        <span className={activeFolder === folder.id ? (isDark ? "text-orange-400" : "text-orange-600") : ""}>{folder.name}</span>
        <button onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity">
          <X size={10} />
        </button>
      </div>
    ))}
    <motion.button
      onClick={onShowCreateFolder}
      whileTap={{ scale: 0.95 }}
      className={`text-[10px] font-bold uppercase cursor-pointer transition-colors px-2.5 py-1.5 rounded-lg shrink-0 whitespace-nowrap flex items-center gap-1 ${
        isDark ? "text-gray-500 hover:text-gray-300" : "text-slate-400 hover:text-slate-600"
      }`}
    >
      <Plus size={10} /> {t('chat.newFolder')}
    </motion.button>
  </div>
);
