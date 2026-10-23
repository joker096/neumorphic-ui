import { describe, it, expect } from 'vitest';
import { buildChatExport, buildChatExportFileName, type ChatExportLabels } from './chatExport';

const labels: ChatExportLabels = {
  selfName: 'Ann', title: 'Export chat', photo: 'Photo', video: 'Video',
  voice: 'Voice note', file: 'File', article: 'Article', location: 'Location',
  sticker: 'Sticker', poll: 'Poll', forwardedFrom: 'Forwarded from',
};

const at = (d: number) => new Date(2026, 9, d, 12, 0, 0).getTime();

describe('buildChatExport', () => {
  it('renders a header, one separator per day, and the self name', () => {
    const text = buildChatExport({
      name: 'Alice',
      history: [
        { id: 1, sender: 'Alice', text: 'hi', time: '10:00', ts: at(2) },
        { id: 2, sender: 'me', text: 'yo', time: '10:01', ts: at(2) },
        { id: 3, sender: 'me', text: 'later', time: '09:00', ts: at(3) },
      ],
    }, { labels });
    expect(text.startsWith('Export chat: Alice')).toBe(true);
    expect(text).toContain('Alice, 10:00\nhi');
    expect(text).toContain('Ann, 10:01\nyo');
    expect(text.match(/02\.10\.2026/g)).toHaveLength(1);
    expect(text).toContain('03.10.2026');
  });

  it('labels attachments by kind and keeps the caption', () => {
    const text = buildChatExport({
      name: 'A',
      history: [
        { id: 1, sender: 'me', attachment: { type: 'image' }, text: 'look' },
        { id: 2, sender: 'me', attachment: { type: 'video' } },
        { id: 3, sender: 'me', voiceId: 'v1' },
        { id: 4, sender: 'me', attachment: { type: 'application/pdf' }, text: 'doc' },
      ],
    }, { labels });
    expect(text).toContain('[Photo] look');
    expect(text).toContain('[Video]');
    expect(text).toContain('[Voice note]');
    expect(text).toContain('[File] doc');
  });

  it('renders poll options with vote counts', () => {
    const text = buildChatExport({
      name: 'A',
      history: [{
        id: 1, sender: 'me', text: 'Tea?',
        poll: { question: 'Tea?', options: [
          { text: 'Yes', voters: ['me', 'Bob'] },
          { text: 'No', voters: [] },
        ] },
      }],
    }, { labels });
    expect(text).toContain('[Poll] Tea?');
    expect(text).toContain('  • Yes (2)');
    expect(text).toContain('  • No (0)');
  });

  it('marks forwarded messages and tolerates a missing chat', () => {
    const text = buildChatExport(null, { labels });
    expect(text).toBe('Export chat:\n');
    const fwd = buildChatExport({
      name: 'A',
      history: [{ id: 1, sender: 'me', text: 'x', forwardedFrom: 'Bob' }],
    }, { labels });
    expect(fwd).toContain('[Forwarded from: Bob]');
  });

  it('survives junk entries without throwing', () => {
    const text = buildChatExport({ name: 'A', history: [null, {}, { sender: 'me' }] }, { labels });
    expect(text).toContain('Export chat: A');
  });
});

describe('buildChatExportFileName', () => {
  it('strips filesystem characters and stamps the date', () => {
    expect(buildChatExportFileName('Work / 2026: Q1', new Date(2026, 9, 23)))
      .toBe('Work-2026-Q1-2026-10-23.txt');
  });

  it('falls back to "chat" for an empty name', () => {
    expect(buildChatExportFileName('', new Date(2026, 9, 23))).toBe('chat-2026-10-23.txt');
  });
});
