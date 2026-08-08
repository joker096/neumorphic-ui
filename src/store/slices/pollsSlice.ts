import type { PollMessage } from '../types';

export interface PollSlice {
  polls: PollMessage[];
  addPoll: (poll: PollMessage) => void;
  removePoll: (id: number) => void;
  voteOnPoll: (pollId: number, optionIndex: number, userId: string) => void;
}

export const createPollSlice = (set: any, get: any): PollSlice => ({
  polls: [],
  addPoll: (poll) => set((state: any) => ({ polls: [...state.polls, poll] })),
  removePoll: (id) => set((state: any) => ({ polls: state.polls.filter((p: any) => p.id !== id) })),
  voteOnPoll: (pollId, optionIndex, userId) => set((state: any) => ({
    polls: state.polls.map((p: any) => {
      if (p.id !== pollId) return p;
      const updatedOptions = p.options.map((opt: any, idx: number) => {
        if (idx === optionIndex) return { ...opt, votes: [...opt.votes, userId] };
        return opt;
      });
      return { ...p, options: updatedOptions };
    })
  })),
});
