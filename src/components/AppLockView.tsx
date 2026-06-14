import { Lock } from "lucide-react";

interface AppLockViewProps {
  isDark: boolean;
  pinInput: string;
  pinError: boolean;
  onPinChange: (v: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  t: (key: string) => string;
}

export const AppLockView = ({ isDark, pinInput, pinError, onPinChange, onSubmit, t }: AppLockViewProps) => {
  return (
    <div className={`w-full h-[100dvh] flex flex-col items-center justify-center font-sans ${isDark ? "bg-[#0d1017] text-white" : "bg-[#eaeff4] text-slate-800"}`}>
      <div className={`p-8 rounded-3xl flex flex-col items-center max-w-sm w-full mx-4 shadow-2xl ${isDark ? "bg-[#11141c] border border-white/10" : "bg-white border border-black/5"}`}>
        <Lock size={48} className={`mb-6 ${isDark ? "text-orange-500" : "text-orange-600"}`} />
        <h2 className="text-2xl font-bold mb-2 text-center">{t('lock.title')}</h2>
        <p className={`text-sm mb-6 text-center ${isDark ? "text-gray-400" : "text-slate-500"}`}>
          {t('lock.description')}
        </p>
        <form onSubmit={onSubmit} className="w-full">
          <input
            type="password"
            value={pinInput}
            onChange={e => onPinChange(e.target.value)}
            autoFocus
            className={`w-full text-center tracking-[0.5em] text-2xl font-mono py-4 rounded-xl border mb-4 focus:outline-none transition-colors ${
              isDark
                ? "bg-[#16181d] border-white/10 focus:border-orange-500/50"
                : "bg-[#f4f7f9] border-black/10 focus:border-orange-500/50"
            } ${pinError ? "border-red-500 text-red-500" : ""}`}
            placeholder="****"
          />
          <button
            type="submit"
            className={`w-full py-4 rounded-xl font-bold text-lg transition-transform hover:scale-[1.02] active:scale-95 ${
              isDark
                ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg"
                : "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg"
            }`}
          >
            {t('lock.unlock')}
          </button>
        </form>
      </div>
    </div>
  );
};
