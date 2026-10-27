import { useUiStore } from "../../store/uiStore";

/** Store-backed global search open state (Ctrl/Cmd+K handled app-wide). */
export function useGlobalSearchToggle(): [boolean, (open: boolean) => void] {
  const open = useUiStore((s) => s.globalSearchOpen);
  const setOpen = useUiStore((s) => s.setGlobalSearchOpen);
  return [open, setOpen];
}
