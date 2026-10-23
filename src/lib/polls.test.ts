import { describe, it, expect } from 'vitest';
import { createPoll, applyVote, hasVoted, totalVotes, LOCAL_VOTER } from './polls';

describe('polls', () => {
  it('builds stable option ids and trims the input', () => {
    const poll = createPoll('  Lunch?  ', [' Sushi ', '', 'Pizza'], false);
    expect(poll.question).toBe('Lunch?');
    expect(poll.options.map((o) => o.id)).toEqual(['opt_1', 'opt_2']);
    expect(poll.options.map((o) => o.text)).toEqual(['Sushi', 'Pizza']);
    expect(totalVotes(poll)).toBe(0);
  });

  it('counts a repeated add once', () => {
    const poll = createPoll('Q', ['A', 'B'], false);
    const once = applyVote(poll, 'opt_1', LOCAL_VOTER, 'add');
    const twice = applyVote(once, 'opt_1', LOCAL_VOTER, 'add');
    expect(totalVotes(twice)).toBe(1);
    expect(hasVoted(twice, 'opt_1')).toBe(true);
  });

  it('moves a single-choice vote instead of stacking it', () => {
    const poll = createPoll('Q', ['A', 'B'], false);
    const first = applyVote(poll, 'opt_1', LOCAL_VOTER, 'add');
    const second = applyVote(first, 'opt_2', LOCAL_VOTER, 'add');
    expect(hasVoted(second, 'opt_1')).toBe(false);
    expect(hasVoted(second, 'opt_2')).toBe(true);
    expect(totalVotes(second)).toBe(1);
  });

  it('keeps both answers on a multiple-choice poll', () => {
    const poll = createPoll('Q', ['A', 'B'], true);
    const both = applyVote(applyVote(poll, 'opt_1', 'Ann', 'add'), 'opt_2', 'Ann', 'add');
    expect(totalVotes(both)).toBe(2);
  });

  it('removes a vote and ignores an empty voter', () => {
    const poll = applyVote(createPoll('Q', ['A', 'B'], false), 'opt_1', 'Ann', 'add');
    expect(totalVotes(applyVote(poll, 'opt_1', 'Ann', 'remove'))).toBe(0);
    expect(applyVote(poll, 'opt_1', '', 'add')).toBe(poll);
  });
});
