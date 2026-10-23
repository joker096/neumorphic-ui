/**
 * Local vote on a poll message: the option is toggled for the current user and
 * the delta travels as a `chat-poll-vote` frame.
 */

import { applyVote, hasVoted, LOCAL_VOTER, type VoteOp } from '../../lib/polls';
import { sendPollVote } from '../../lib/p2p/pollSync';

interface UsePollVoteArgs {
  chat: any;
  onUpdateChat?: (chat: any) => void;
  setChatsStore: (updater: any[] | ((prev: any[]) => any[])) => void;
}

export function usePollVote({ chat, onUpdateChat, setChatsStore }: UsePollVoteArgs) {
  const handlePollVote = (msgId: string | number, optionId: string) => {
    const target = (chat.history || []).find((m: any) => m.id === msgId);
    if (!target?.poll || target.poll.closed) return;

    const op: VoteOp = hasVoted(target.poll, optionId) ? 'remove' : 'add';
    // Applied to each container's own history: the display chat and the store
    // list can drift by a frame, and voting must not clobber either.
    const patch = (history: any[]) =>
      history.map((m: any) => (m.id === msgId ? { ...m, poll: applyVote(m.poll, optionId, LOCAL_VOTER, op) } : m));

    if (onUpdateChat) onUpdateChat({ ...chat, history: patch(chat.history || []) });
    setChatsStore(prev => prev.map((c: any) => (c.id === chat.id ? { ...c, history: patch(c.history || []) } : c)));
    sendPollVote(chat, msgId, optionId, op);
  };

  return { handlePollVote };
}
