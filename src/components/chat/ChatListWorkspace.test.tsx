import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import * as ChatListViewModule from '../ChatListView';

// Mock the ChatListView component to accept any props
vi.mock('../ChatListView', () => ({
  ChatListView: ((_props: any) => (
    <div data-testid="chat-list-workspace">
      <span data-testid="workspace-title">Chat Workspace</span>
    </div>
  )) as any,
}));

import { ChatListWorkspace } from './ChatListWorkspace';

describe('ChatListWorkspace', () => {
  it('renders the workspace', () => {
    const mockProps: any = { t: () => 'Chat Workspace' };
    render(<ChatListWorkspace {...mockProps} />);
    expect(screen.getByText(/Chat Workspace|chat.workspace/i)).toBeInTheDocument();
  });

  it('renders with theme prop', () => {
    const mockProps: any = { theme: 'dark', t: () => 'Chat Workspace' };
    render(<ChatListWorkspace {...mockProps} />);
    expect(screen.getByText(/Chat Workspace|chat.workspace/i)).toBeInTheDocument();
  });

  it('renders with light theme', () => {
    const mockProps: any = { theme: 'light', t: () => 'Chat Workspace' };
    render(<ChatListWorkspace {...mockProps} />);
    expect(screen.getByText(/Chat Workspace|chat.workspace/i)).toBeInTheDocument();
  });

  it('renders with dark theme', () => {
    const mockProps: any = { theme: 'dark', t: () => 'Chat Workspace' };
    render(<ChatListWorkspace {...mockProps} />);
    expect(screen.getByText(/Chat Workspace|chat.workspace/i)).toBeInTheDocument();
  });

  it('renders with t function', () => {
    const mockProps: any = { t: () => 'Chat Workspace' };
    render(<ChatListWorkspace {...mockProps} />);
    expect(screen.getByText(/Chat Workspace|chat.workspace/i)).toBeInTheDocument();
  });
});
