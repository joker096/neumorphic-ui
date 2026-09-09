import { describe, it, expect } from 'vitest';
import {
  APP_HOME_URL,
  MESSENGER_WEB_BASE,
  INVITE_SHORT_BASE,
  EMBED_WIDGET_URL,
  channelInviteLink,
  groupInviteUrl,
  storyShareLink,
} from './app';

describe('app url config', () => {
  it('defines the base surfaces', () => {
    expect(APP_HOME_URL).toBe('https://mess.cvr.name');
    expect(MESSENGER_WEB_BASE).toBe('https://messanger.app');
    expect(INVITE_SHORT_BASE).toBe('https://ma.to');
    expect(EMBED_WIDGET_URL).toBe('https://messanger.app/embed.js');
  });

  it('builds channel invite links', () => {
    expect(channelInviteLink('alice', 'chat-1')).toBe('https://messanger.app/channel/@alice');
    expect(channelInviteLink(undefined, 'chat-1')).toBe('https://messanger.app/channel/chat-1');
    expect(channelInviteLink('', 'chat-1')).toBe('https://messanger.app/channel/chat-1');
  });

  it('builds group invite urls', () => {
    expect(groupInviteUrl('tok')).toBe('https://ma.to/tok');
  });

  it('builds story share deep links on the app home', () => {
    expect(storyShareLink(1, 11)).toBe('https://mess.cvr.name#nexus://story/1/11');
    expect(storyShareLink('abc', 22)).toBe('https://mess.cvr.name#nexus://story/abc/22');
  });
});