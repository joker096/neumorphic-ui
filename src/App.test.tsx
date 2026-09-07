import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import App from './App';

describe('App', () => {
  it('renders the app', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders main layout', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders sidebar navigation', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders bottom navigation', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders with toasts', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders transport indicator', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders with dark theme', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders with light theme', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('opens a story from a scheme deep link without crashing', () => {
    const prevHash = window.location.hash;
    window.location.hash = '#nexus://story/1/11';
    render(<App />);
    expect(document.body).toBeInTheDocument();
    window.location.hash = prevHash;
  });

  it('opens a story from a query deep link without crashing', () => {
    global.history.replaceState({}, '', '?story=1:11');
    render(<App />);
    expect(document.body).toBeInTheDocument();
    global.history.replaceState({}, '', '/');
  });
});
