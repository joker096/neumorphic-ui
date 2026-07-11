import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({ motion: { div: 'div' } }));
vi.mock('lucide-react', () => ({ Mic: 'div', MicOff: 'div', PhoneOff: 'div' }));

import { HuddleWidget } from './HuddleWidget';

describe('HuddleWidget', () => {
  it('renders huddle title when inactive', () => {
    render(<HuddleWidget chatId="chat_1" chatName="Test Chat" />);
    expect(screen.getByText('Huddle')).toBeInTheDocument();
  });

  it('renders Join button when inactive', () => {
    render(<HuddleWidget chatId="chat_1" />);
    expect(screen.getByText('Join')).toBeInTheDocument();
  });

  it('renders voice chat subtitle', () => {
    render(<HuddleWidget chatId="chat_1" />);
    expect(screen.getByText('Voice chat')).toBeInTheDocument();
  });
});
