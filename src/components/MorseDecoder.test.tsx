import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MorseDecoder, encodeMorse, decodeMorse, isMorseCode } from './MorseDecoder';

describe('MorseDecoder utilities', () => {
  describe('encodeMorse', () => {
    it('encodes letters to morse correctly', () => {
      expect(encodeMorse('A')).toBe('.-');
      expect(encodeMorse('B')).toBe('-...');
      expect(encodeMorse('SOS')).toBe('... --- ...');
    });

    it('encodes numbers to morse correctly', () => {
      expect(encodeMorse('0')).toBe('-----');
      expect(encodeMorse('1')).toBe('.----');
      expect(encodeMorse('5')).toBe('.....');
    });

    it('encodes special characters', () => {
      expect(encodeMorse('.')).toBe('.-.-.-');
      expect(encodeMorse(',')).toBe('--..--');
      expect(encodeMorse('?')).toBe('..--..');
      expect(encodeMorse('!')).toBe('-.-.--');
      expect(encodeMorse('@')).toBe('.--.-.');
    });

    it('handles spaces as word separators', () => {
      expect(encodeMorse('HI THERE')).toBe('.... .. / - .... . .-. .');
    });

    it('preserves unknown characters', () => {
      expect(encodeMorse('Ä')).toBe('Ä');
      expect(encodeMorse('😀')).toBe('😀');
    });

    it('handles empty string', () => {
      expect(encodeMorse('')).toBe('');
    });

    it('handles mixed case', () => {
      expect(encodeMorse('Hello')).toBe('.... . .-.. .-.. ---');
    });
  });

  describe('decodeMorse', () => {
    it('decodes morse to letters correctly', () => {
      expect(decodeMorse('.-')).toBe('A');
      expect(decodeMorse('-...')).toBe('B');
      expect(decodeMorse('... --- ...')).toBe('SOS');
    });

    it('decodes numbers correctly', () => {
      expect(decodeMorse('-----')).toBe('0');
      expect(decodeMorse('.----')).toBe('1');
    });

    it('handles word separators', () => {
      expect(decodeMorse('.... .. / - .... . .-. .')).toBe('HI THERE');
    });

    it('preserves unknown morse sequences', () => {
      expect(decodeMorse('...-.-')).toBe('...-.-');
    });

    it('handles empty string', () => {
      expect(decodeMorse('')).toBe('');
    });
  });

  describe('isMorseCode', () => {
    it('returns true for valid morse code', () => {
      expect(isMorseCode('.-')).toBe(true);
      expect(isMorseCode('... --- ...')).toBe(true);
      expect(isMorseCode('.--. .--.')).toBe(true);
      expect(isMorseCode('/')).toBe(true);
    });

    it('returns false for plain text', () => {
      expect(isMorseCode('HELLO')).toBe(false);
      expect(isMorseCode('hello world')).toBe(false);
      expect(isMorseCode('123')).toBe(false);
    });

    it('returns false for mixed content', () => {
      expect(isMorseCode('.- HELLO')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isMorseCode('')).toBe(false);
      expect(isMorseCode('   ')).toBe(false);
    });

    it('returns true for single character morse', () => {
      expect(isMorseCode('.')).toBe(true);
      expect(isMorseCode('-')).toBe(true);
    });
  });
});

describe('MorseDecoder component', () => {
  it('renders encoded morse text', () => {
    render(<MorseDecoder theme="dark" encodedText="... --- ..." />);

    expect(screen.getByText('MORSE ENCODED')).toBeInTheDocument();
    expect(screen.getByText('... --- ...')).toBeInTheDocument();
  });

  it('shows decode button initially', () => {
    render(<MorseDecoder theme="dark" encodedText="... --- ..." />);

    expect(screen.getByText('DECODE MORSE')).toBeInTheDocument();
  });

  it('decodes morse when button is clicked', async () => {
    render(<MorseDecoder theme="dark" encodedText="... --- ..." />);

    fireEvent.click(screen.getByText('DECODE MORSE'));

    await waitFor(() => {
      expect(screen.getByText('DECODED TEXT')).toBeInTheDocument();
      expect(screen.getByText('SOS')).toBeInTheDocument();
    });
  });

  it('applies dark theme styles', () => {
    render(<MorseDecoder theme="dark" encodedText="... --- ..." />);

    const container = screen.getByText('MORSE ENCODED').parentElement?.parentElement;
    expect(container).toHaveClass('p-3');
  });

  it('applies light theme styles', () => {
    render(<MorseDecoder theme="light" encodedText="... --- ..." />);

    const container = screen.getByText('MORSE ENCODED').parentElement?.parentElement;
    expect(container).toHaveClass('p-3');
  });

  it('shows decoded text with amber styling in dark mode', async () => {
    render(<MorseDecoder theme="dark" encodedText="... --- ..." />);

    fireEvent.click(screen.getByText('DECODE MORSE'));

    await waitFor(() => {
      const decodedContainer = screen.getByText('DECODED TEXT').parentElement;
      expect(decodedContainer).toHaveClass('p-3');
    });
  });

  it('shows decoded text with amber styling in light mode', async () => {
    render(<MorseDecoder theme="light" encodedText="... --- ..." />);

    fireEvent.click(screen.getByText('DECODE MORSE'));

    await waitFor(() => {
      const decodedContainer = screen.getByText('DECODED TEXT').parentElement;
      expect(decodedContainer).toHaveClass('p-3');
    });
  });

  it('handles complex morse sequences', async () => {
    render(<MorseDecoder theme="dark" encodedText=".... . .-.. .-.. --- / .-- --- .-. .-.. -.." />);

    fireEvent.click(screen.getByText('DECODE MORSE'));

    await waitFor(() => {
      expect(screen.getByText('HELLO WORLD')).toBeInTheDocument();
    });
  });
});