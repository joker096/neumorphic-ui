import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  action?: { label: string; onClick: () => void };
}

type Listener = (toast: ToastItem) => void;

const listeners = new Set<Listener>();
let nextId = 1;

export function toast(message: string, type: ToastType = 'info', action?: ToastItem['action']) {
  const item: ToastItem = { id: nextId++, message, type, action };
  listeners.forEach(l => l(item));
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

const TONE: Record<ToastType, string> = {
  success: 'text-emerald-400',
  error: 'text-rose-400',
  warning: 'text-amber-400',
  info: 'text-primary',
};

export function ToastViewport(_props: { isDark?: boolean }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler: Listener = (t) => {
      setItems(prev => [...prev, t]);
      const ttl = t.action ? 5000 : 3200;
      setTimeout(() => setItems(prev => prev.filter(i => i.id !== t.id)), ttl);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  const dismiss = useCallback((id: number) => setItems(prev => prev.filter(i => i.id !== id)), []);

  return (
    <div className="fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2 px-4 pointer-events-none sm:bottom-6">
      <AnimatePresence>
        {items.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            className="pointer-events-auto w-full max-w-sm flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg border bg-popover border-border"
            role="status"
            aria-live="polite"
          >
            <span className={`shrink-0 ${TONE[item.type]}`}>{ICONS[item.type]}</span>
            <span className="flex-1 text-sm font-medium text-foreground">{item.message}</span>
            {item.action && (
              <button
                onClick={() => { item.action!.onClick(); dismiss(item.id); }}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg min-h-[32px] text-primary hover:bg-accent/10 transition-colors"
              >
                {item.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss"
              className="shrink-0 p-1 rounded-lg min-h-[32px] min-w-[32px] transition-colors text-muted-foreground hover:bg-muted"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
