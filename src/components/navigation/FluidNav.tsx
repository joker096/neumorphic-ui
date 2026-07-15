import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"

interface NavItem {
  id: string
  label: string
}

interface FluidNavProps {
  items: NavItem[]
  activeView: string
  onNavigate: (id: string) => void
  t: (key: string) => string
}

const menuSpring = {
  type: "spring" as const,
  damping: 28,
  stiffness: 220,
  mass: 0.8,
}

const stagger = (i: number) => ({
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1 + i * 0.06,
      duration: 0.6,
      ease: [0.32, 0.72, 0, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] as const },
  },
})

export function FluidNav({ items, activeView, onNavigate, t }: FluidNavProps) {
  const [open, setOpen] = useState(false)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false)
  }, [])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
      window.addEventListener("keydown", handleKeyDown)
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, handleKeyDown])

  const handleNav = (id: string) => {
    onNavigate(id)
    setOpen(false)
  }

  return (
    <>
      {/* Floating Island Nav Pill */}
      <motion.nav
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[60]"
      >
        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] shadow-[var(--glass-shadow)]">
          {/* Logo / Brand */}
          <span className="text-sm font-bold tracking-tight text-[var(--text-primary)] px-1">
            ▲
          </span>

          <div className="hidden sm:flex items-center gap-1">
            {items.map((item) => {
              const isActive = activeView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`relative px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.12em] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    isActive
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-[var(--bg-tertiary)]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{t(item.label)}</span>
                </button>
              )
            })}
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="relative w-10 h-10 flex flex-col items-center justify-center gap-[3.5px] rounded-full hover:bg-[var(--bg-tertiary)] transition-colors duration-300"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            <motion.span
              animate={open ? { rotate: 45, y: 5.5 } : { rotate: 0, y: 0 }}
              transition={menuSpring}
              className="block w-4 h-[1.5px] rounded-full bg-[var(--text-primary)]"
            />
            <motion.span
              animate={open ? { opacity: 0, x: -6 } : { opacity: 1, x: 0 }}
              transition={menuSpring}
              className="block w-4 h-[1.5px] rounded-full bg-[var(--text-primary)]"
            />
            <motion.span
              animate={open ? { rotate: -45, y: -5.5 } : { rotate: 0, y: 0 }}
              transition={menuSpring}
              className="block w-4 h-[1.5px] rounded-full bg-[var(--text-primary)]"
            />
          </button>
        </div>
      </motion.nav>

      {/* Fullscreen Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-[55] flex flex-col items-center justify-center"
            style={{
              background: "var(--bg-primary)",
              backdropFilter: "blur(48px)",
              WebkitBackdropFilter: "blur(48px)",
            }}
          >
            {/* Ambient glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[60vw] h-[40vh] bg-[var(--accent)]/8 rounded-full blur-[120px] pointer-events-none" />

            <nav className="relative z-10 flex flex-col items-center gap-2">
              {items.map((item, i) => {
                const isActive = activeView === item.id
                return (
                  <motion.div
                    key={item.id}
                    variants={stagger(i)}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <button
                      onClick={() => handleNav(item.id)}
                      className={`relative group text-center transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                        isActive
                          ? "text-[var(--text-primary)]"
                          : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <span className="text-[clamp(2rem,6vw,4.5rem)] font-bold tracking-[-0.03em] leading-[1.1]">
                        {t(item.label)}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="nav-underline"
                          className="h-[2px] bg-[var(--accent)] rounded-full mx-auto mt-1"
                          style={{ width: "60%" }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </button>
                  </motion.div>
                )
              })}
            </nav>

            {/* Bottom close hint */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              className="absolute bottom-12 text-[10px] uppercase tracking-[0.2em] font-medium text-[var(--text-tertiary)]"
            >
              Press Esc to close
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
