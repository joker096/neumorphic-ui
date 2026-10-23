/**
 * Poll model and vote arithmetic.
 *
 * A poll is a regular chat message (`type: 'poll'`) carrying this payload, so
 * list previews, search and notifications keep working on `msg.text`. Votes are
 * stored as voter names per option: the local user is `LOCAL_VOTER`, peers send
 * their display name. Keeping voters (instead of counters) makes the wire
 * delta idempotent — a duplicated `add` cannot inflate the result — and lets the
 * bubble mark the voter's own choice without a second field.
 */

export const LOCAL_VOTER = "me";

export interface PollOption {
  id: string;
  text: string;
  /** Voter names; `"me"` for the local user, display names for peers. */
  voters: string[];
}

export interface PollPayload {
  question: string;
  options: PollOption[];
  /** Single-choice when false: a voter may hold exactly one option. */
  multiple: boolean;
  closed?: boolean;
}

export type VoteOp = "add" | "remove";

export function hasVoted(poll: PollPayload, optionId: string, voter = LOCAL_VOTER): boolean {
  return (poll.options || []).some((o) => o.id === optionId && o.voters.includes(voter));
}

export function totalVotes(poll: PollPayload): number {
  return (poll.options || []).reduce((sum, o) => sum + o.voters.length, 0);
}

/**
 * Applies one vote delta. `add` appends the voter once (a repeated frame is a
 * no-op), `remove` drops them. Single-choice polls also drop the voter from
 * every other option, which is what makes re-voting a switch rather than a
 * second vote.
 */
export function applyVote(
  poll: PollPayload,
  optionId: string,
  voter: string,
  op: VoteOp,
): PollPayload {
  const name = String(voter ?? "");
  if (!name) return poll;
  const options = (poll.options || []).map((option) => {
    const others = op === "add" && !poll.multiple;
    if (option.id === optionId) {
      const voters = op === "add"
        ? [...option.voters.filter((v) => v !== name), name]
        : option.voters.filter((v) => v !== name);
      return { ...option, voters };
    }
    if (others) return { ...option, voters: option.voters.filter((v) => v !== name) };
    return option;
  });
  return { ...poll, options };
}

/** Builds a fresh poll; option ids are stable within the message. */
export function createPoll(question: string, optionTexts: string[], multiple: boolean): PollPayload {
  return {
    question: String(question ?? "").trim(),
    multiple,
    options: optionTexts
      .map((text) => String(text ?? "").trim())
      .filter(Boolean)
      .map((text, index) => ({ id: `opt_${index + 1}`, text, voters: [] })),
  };
}
