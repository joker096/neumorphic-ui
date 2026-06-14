import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { FormattedText } from './FormattedText';

describe('FormattedText', () => {
  it('renders plain text', () => {
    render(<FormattedText text="Hello World" />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders bold text', () => {
    render(<FormattedText text="This is **bold** text" />);
    expect(screen.getByText('bold').tagName).toBe('STRONG');
  });

  it('renders italic text', () => {
    render(<FormattedText text="This is __italic__ text" />);
    expect(screen.getByText('italic').tagName).toBe('EM');
  });

  it('renders strikethrough text', () => {
    render(<FormattedText text="This is ~~strikethrough~~ text" />);
    expect(screen.getByText('strikethrough').tagName).toBe('S');
  });

  it('renders inline code', () => {
    render(<FormattedText text="Use `code` here" />);
    expect(screen.getByText('code').tagName).toBe('CODE');
  });

  it('renders headers', () => {
    render(<FormattedText text="# Big Header" />);
    expect(screen.getByText('Big Header')).toBeInTheDocument();
  });

  it('renders blockquotes', () => {
    render(<FormattedText text="> quoted text" />);
    expect(screen.getByText('quoted text').closest('blockquote')).toBeInTheDocument();
  });

  it('highlights search term', () => {
    render(<FormattedText text="Hello World" searchTerm="World" />);
    const highlighted = screen.getByText('World');
    expect(highlighted.className).toContain('bg-yellow-400');
  });

  it('renders links when searchTerm provided', () => {
    render(<FormattedText text="Visit https://example.com" searchTerm="Visit" />);
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('renders mentions when searchTerm provided', () => {
    render(<FormattedText text="Hello @user123" searchTerm="Hello" />);
    expect(screen.getByText('@user123')).toBeInTheDocument();
  });

  it('returns null for empty text', () => {
    const { container } = render(<FormattedText text="" />);
    expect(container.innerHTML).toBe('');
  });
});

describe('FormattedText security fixes', () => {
  it('should not render javascript: URLs as links', () => {
    render(<FormattedText text="Click javascript:alert(1)" />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('should only render http and https links', () => {
    render(<FormattedText text="Visit https://example.com" searchTerm="Visit" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://example.com')
  })

  it('should escape searchTerm in regex to prevent ReDoS', () => {
    expect(() => render(<FormattedText text="Hello World" searchTerm="($+)" />)).not.toThrow()
  })
})
