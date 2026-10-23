import { useCallback, useState } from 'react'
import { useAppStore } from '../store'
import { useI18n } from '../lib/i18n'
import { releaseMessageMedia } from '../lib/messageMedia'
import { sendChatDelete } from '../lib/p2p/deleteSync'
import { toast } from '../components/ui/Toast'

interface UseChatMessageActionsArgs {
  chatId: string | number
  /** Receives a single message or a batch; the host decides the target chat. */
  onForward?: (payload: any) => void
  onDelete?: (msg: any) => void
  onUpdateChat?: (chat: any) => void
}

/**
 * Who the deletion applies to. `all` retracts the message on the peer too
 * (only ever possible for our own bubbles), `me` removes it locally and leaves
 * the other side untouched.
 */
export type DeleteScope = 'all' | 'me'

/**
 * Encapsulates message forward / delete / multi-select logic for the chat
 * preview layer. Extracted from ChatPreviewLayer to keep that component lean.
 */
export function useChatMessageActions({ chatId, onForward, onDelete, onUpdateChat }: UseChatMessageActionsArgs) {
  const { t } = useI18n()
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set())

  const handleForwardMessage = useCallback(
    (msg: any) => {
      onForward?.(msg)
    },
    [onForward],
  )

  const handleDeleteMessage = useCallback(
    (msg: any, scope: DeleteScope = 'all') => {
      // Own bubbles disappear on the peer too: a retraction that only cleans the
      // sender's device is worse than no retraction, because the sender believes
      // the message is gone. Best-effort — no bound peer means local-only.
      if (msg?.sender === 'me' && scope === 'all') {
        const chat = (useAppStore.getState().chats as any[]).find((c) => c.id === chatId)
        if (chat) sendChatDelete(chat, msg.id)
      }
      if (onDelete) {
        // A delegated host owns the whole removal, media included — releasing here
        // would be a guess about what it does with the message.
        onDelete(msg);
        return;
      }
      // Drop the bytes/URLs the bubble owned before the store no longer knows about it.
      void releaseMessageMedia([msg]);
      const chats = useAppStore.getState().chats as any[]
      const nextChats = chats.map((c) =>
        c.id === chatId
          ? {
              ...c,
              history: (c.history || []).filter((m: any) => m.id !== msg.id),
            }
          : c,
      )
      useAppStore.setState({ chats: nextChats })
      const updatedChat = nextChats.find((c) => c.id === chatId)
      if (updatedChat && onUpdateChat) onUpdateChat(updatedChat)
      toast(t('chat.deleted', 'Deleted'))
    },
    [chatId, onDelete, t, onUpdateChat],
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
      const msgs = messages.filter((m: any) => selectedIds.has(m.id))
      if (msgs.length) onForward?.(msgs)
      handleCancelSelection()
    },
    [onForward, selectedIds, handleCancelSelection],
  )

  const handleDeleteSelected = useCallback(
    (_messages: any[], scope: DeleteScope = 'all') => {
      const chats = useAppStore.getState().chats as any[]
      // Read the doomed bubbles from the same source the removal below filters,
      // so the erased set can never drift from the removed set.
      const target = chats.find((c) => c.id === chatId)
      const doomed = (target?.history ?? []).filter((m: any) => selectedIds.has(m.id))
      // Bulk delete has the same contract as the single one: our own bubbles go
      // away for the peer as well, otherwise a "cleared" chat still shows them
      // on the other device with no way to fix it afterwards.
      if (scope === 'all' && target && (!target.type || target.type === 'direct')) {
        doomed.filter((m: any) => m.sender === 'me').forEach((m: any) => sendChatDelete(target, m.id))
      }
      void releaseMessageMedia(doomed)
      const nextChats = chats.map((c) =>
        c.id === chatId
          ? {
              ...c,
              history: (c.history || []).filter((m: any) => !selectedIds.has(m.id)),
            }
          : c,
      )
      useAppStore.setState({ chats: nextChats })
      const updatedChat = nextChats.find((c) => c.id === chatId)
      if (updatedChat && onUpdateChat) onUpdateChat(updatedChat)
      toast(t('chat.deleted', 'Deleted'))
      handleCancelSelection()
    },
    [chatId, selectedIds, t, handleCancelSelection, onUpdateChat],
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
