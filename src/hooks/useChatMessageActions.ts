import { useCallback, useState } from 'react'
import { useAppStore } from '../store'
import { useI18n } from '../lib/i18n'
import { toast } from '../components/ui/Toast'

interface UseChatMessageActionsArgs {
  chatId: string | number
  onForward?: (msg: any) => void
  onDelete?: (msg: any) => void
}

/**
 * Encapsulates message forward / delete / multi-select logic for the chat
 * preview layer. Extracted from ChatPreviewLayer to keep that component lean.
 */
export function useChatMessageActions({ chatId, onForward, onDelete }: UseChatMessageActionsArgs) {
  const { t } = useI18n()
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set())

  const handleForwardMessage = useCallback(
    (msg: any) => {
      if (onForward) {
        onForward(msg)
        return
      }
      const chats = useAppStore.getState().chats as any[]
      const target =
        chats.find((c) => c.id !== chatId && c.type === 'saved') ||
        chats.find((c) => c.id !== chatId)
      if (!target) {
        toast(t('chat.forwardUnavailable', 'Forward not available'))
        return
      }
      useAppStore.setState({
        chats: chats.map((c) =>
          c.id === target.id
            ? {
                ...c,
                messages: [
                  ...(c.messages || []),
                  { ...msg, id: `${msg.id}-fwd-${Date.now()}`, sender: 'me', forwarded: true, time: 'now' },
                ],
              }
            : c,
        ),
      })
      toast(t('chat.forwarded', 'Forwarded'))
    },
    [chatId, onForward, t],
  )

  const handleDeleteMessage = useCallback(
    (msg: any) => {
      if (onDelete) {
        onDelete(msg)
        return
      }
      const chats = useAppStore.getState().chats as any[]
      useAppStore.setState({
        chats: chats.map((c) =>
          c.id === chatId
            ? { ...c, messages: (c.messages || []).filter((m: any) => m.id !== msg.id) }
            : c,
        ),
      })
      toast(t('chat.deleted', 'Deleted'))
    },
    [chatId, onDelete, t],
  )

  const handleEnterSelection = useCallback((msg: any) => {
    setSelectionMode(true)
    setSelectedIds(new Set([msg.id]))
  }, [])

  const handleToggleSelect = useCallback((id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSelectAll = useCallback(
    (messages: any[]) => {
      setSelectedIds(new Set(messages.map((m: any) => m.id)))
    },
    [],
  )

  const handleCancelSelection = useCallback(() => {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }, [])

  const handleForwardSelected = useCallback(
    (messages: any[]) => {
      const chats = useAppStore.getState().chats as any[]
      const msgs = messages.filter((m: any) => selectedIds.has(m.id))
      const target =
        chats.find((c) => c.id !== chatId && c.type === 'saved') ||
        chats.find((c) => c.id !== chatId)
      if (target && msgs.length) {
        useAppStore.setState({
          chats: chats.map((c) =>
            c.id === target.id
              ? {
                  ...c,
                  messages: [
                    ...(c.messages || []),
                    ...msgs.map((m: any) => ({
                      ...m,
                      id: `${m.id}-fwd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                      sender: 'me',
                      forwarded: true,
                      time: 'now',
                    })),
                  ],
                }
              : c,
          ),
        })
        toast(t('chat.forwarded', 'Forwarded'))
      } else {
        toast(t('chat.forwardUnavailable', 'Forward not available'))
      }
      handleCancelSelection()
    },
    [chatId, selectedIds, t, handleCancelSelection],
  )

  const handleDeleteSelected = useCallback(
    (messages: any[]) => {
      const chats = useAppStore.getState().chats as any[]
      useAppStore.setState({
        chats: chats.map((c) =>
          c.id === chatId
            ? { ...c, messages: (c.messages || []).filter((m: any) => !selectedIds.has(m.id)) }
            : c,
        ),
      })
      toast(t('chat.deleted', 'Deleted'))
      handleCancelSelection()
    },
    [chatId, selectedIds, t, handleCancelSelection],
  )

  return {
    selectionMode,
    selectedIds,
    handleForwardMessage,
    handleDeleteMessage,
    handleEnterSelection,
    handleToggleSelect,
    handleSelectAll,
    handleCancelSelection,
    handleForwardSelected,
    handleDeleteSelected,
  }
}
