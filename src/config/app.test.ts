import { describe, it, expect } from 'vitest';
import {
  EMBED_WIDGET_URL,
  channelInviteLink,
  crmInviteLink,
  groupInviteUrl,
  storyShareLink,
} from './app';

describe('app url config', () => {
  it('has no public hosting or widget default', () => {
    expect(EMBED_WIDGET_URL).toBe('');
  });

  it('builds domain-free channel invite links', () => {
    expect(channelInviteLink('alice', 'chat-1')).toBe('nexus://channel/%40alice');
    expect(channelInviteLink(undefined, 'chat-1')).toBe('nexus://channel/chat-1');
    expect(channelInviteLink('', 'chat-1')).toBe('nexus://channel/chat-1');
  });

  it('builds domain-free group and CRM invitations', () => {
    expect(groupInviteUrl('tok')).toBe('nexus://group/invite/tok');
    expect(crmInviteLink('INV/123')).toBe('nexus://company/invite/INV%2F123');
  });

  it('builds native story deep links', () => {
    expect(storyShareLink(1, 11)).toBe('nexus://story/1/11');
    expect(storyShareLink('abc', 22)).toBe('nexus://story/abc/22');
  });
});
