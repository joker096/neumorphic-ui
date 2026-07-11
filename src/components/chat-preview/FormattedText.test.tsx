import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { FormattedText } from './FormattedText';

describe('FormattedText', () => {
  it('renders plain text', () => {
    const { container } = render(<FormattedText text="Hello world" />);
    expect(container.textContent).toBe('Hello world');
  });

  it('renders bold text with ** markers', () => {
    render(<FormattedText text="This is **bold** text" />);
    const bold = document.querySelector('strong');
    expect(bold).toBeInTheDocument();
    expect(bold).toHaveTextContent('bold');
  });

  it('renders italic text with __ markers', () => {
    render(<FormattedText text="This is __italic__ text" />);
    const italic = document.querySelector('em');
    expect(italic).toBeInTheDocument();
    expect(italic).toHaveTextContent('italic');
  });

  it('renders inline code with backticks', () => {
    render(<FormattedText text="Use `const x = 1` here" />);
    const code = document.querySelector('code');
    expect(code).toBeInTheDocument();
    expect(code).toHaveTextContent('const x = 1');
  });

  it('renders links as clickable anchors when searchTerm is provided', () => {
    render(<FormattedText text="Visit https://example.com now" searchTerm="Visit" />);
    const link = screen.getByText('https://example.com');
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('handles empty text', () => {
    const { container } = render(<FormattedText text="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders strikethrough text with ~~ markers', () => {
    render(<FormattedText text="This is ~~strikethrough~~ text" />);
    const s = document.querySelector('s');
    expect(s).toBeInTheDocument();
    expect(s).toHaveTextContent('strikethrough');
  });

  it('renders mentions with @ prefix when searchTerm is provided', () => {
    render(<FormattedText text="Hello @username" searchTerm="Hello" />);
    const mention = screen.getByText('@username');
    expect(mention).toBeInTheDocument();
  });
});
