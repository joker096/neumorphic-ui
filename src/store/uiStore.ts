import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ContactProfile } from '../components/ContactProfileModal';

export interface UIState {
  showCreateChannel: boolean;
  setShowCreateChannel: (show: boolean) => void;
  showCreateBot: boolean;
  setShowCreateBot: (show: boolean) => void;
  globalSelectedContact: ContactProfile | null;
  setGlobalSelectedContact: (contact: ContactProfile | null) => void;
  showContactPicker: boolean;
  setShowContactPicker: (show: boolean) => void;
  editingContact: ContactProfile | null;
  setEditingContact: (contact: ContactProfile | null) => void;
  showAdvancedFilterModal: boolean;
  setShowAdvancedFilterModal: (show: boolean) => void;
  advancedFilters: { hasMedia: boolean; hasAudio: boolean; hasReplies: boolean; fromBots: boolean; priority: boolean };
  setAdvancedFilters: (filters: { hasMedia: boolean; hasAudio: boolean; hasReplies: boolean; fromBots: boolean; priority: boolean }) => void;
}

export const useUiStore = create<UIState>()(
  persist(
    (set) => ({
      showCreateChannel: false,
      setShowCreateChannel: (show) => set({ showCreateChannel: show }),
      showCreateBot: false,
      setShowCreateBot: (show) => set({ showCreateBot: show }),
      globalSelectedContact: null,
      setGlobalSelectedContact: (contact) => set({ globalSelectedContact: contact }),
      showContactPicker: false,
      setShowContactPicker: (show) => set({ showContactPicker: show }),
      editingContact: null,
      setEditingContact: (contact) => set({ editingContact: contact }),
      showAdvancedFilterModal: false,
      setShowAdvancedFilterModal: (show) => set({ showAdvancedFilterModal: show }),
      advancedFilters: { hasMedia: false, hasAudio: false, hasReplies: false, fromBots: false, priority: false },
      setAdvancedFilters: (filters) => set({ advancedFilters: filters }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        advancedFilters: state.advancedFilters,
      }),
    }
  )
);
