import { describe, it, expect } from 'vitest';
import { getFileExtension, getFileKind } from './fileType';

describe('getFileExtension', () => {
  it('returns the lowercase extension without the dot', () => {
    expect(getFileExtension('Report.PDF')).toBe('pdf');
    expect(getFileExtension('archive.tar.gz')).toBe('gz');
  });

  it('returns an empty string without a usable extension', () => {
    expect(getFileExtension(undefined)).toBe('');
    expect(getFileExtension('README')).toBe('');
    expect(getFileExtension('trailing.')).toBe('');
  });
});

describe('getFileKind', () => {
  it('classifies common document and media extensions', () => {
    expect(getFileKind('a.pdf')).toBe('pdf');
    expect(getFileKind('a.docx')).toBe('doc');
    expect(getFileKind('a.xlsx')).toBe('sheet');
    expect(getFileKind('a.csv')).toBe('sheet');
    expect(getFileKind('a.mp3')).toBe('audio');
    expect(getFileKind('a.mp4')).toBe('video');
    expect(getFileKind('a.zip')).toBe('archive');
    expect(getFileKind('a.ts')).toBe('code');
    expect(getFileKind('a.png')).toBe('image');
  });

  it('falls back to the MIME type when the extension is unknown', () => {
    expect(getFileKind('blob', 'application/pdf')).toBe('pdf');
    expect(getFileKind('blob', 'image/webp')).toBe('image');
    expect(getFileKind('blob', 'video/quicktime')).toBe('video');
  });

  it('returns other when nothing matches', () => {
    expect(getFileKind('mystery', 'application/octet-stream')).toBe('other');
    expect(getFileKind()).toBe('other');
  });
});
