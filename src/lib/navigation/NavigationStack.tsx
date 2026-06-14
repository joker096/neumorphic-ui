import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';

export interface NavRoute {
  name: string;
  params?: Record<string, any>;
}

export function useNavigationStack(initialRoute: NavRoute) {
  const [stack, setStack] = useState<NavRoute[]>([initialRoute]);

  const push = useCallback((route: NavRoute) => {
    setStack(prev => [...prev, route]);
  }, []);

  const pop = useCallback(() => {
    setStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const popToRoot = useCallback(() => {
    setStack(prev => [prev[0]]);
  }, []);

  const replace = useCallback((route: NavRoute) => {
    setStack(prev => [...prev.slice(0, -1), route]);
  }, []);

  const current = useMemo(() => stack[stack.length - 1], [stack]);
  const canGoBack = stack.length > 1;

  return { stack, current, push, pop, popToRoot, replace, canGoBack };
}

export function NavPageTransition({ children, isActive }: { children: React.ReactNode; isActive: boolean }) {
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key="page"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          className="w-full h-full"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
