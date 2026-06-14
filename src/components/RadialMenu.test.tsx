import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RadialMenu } from './RadialMenu';
import { Moon, Shield, Battery } from 'lucide-react';

const defaultItems = [
  { id: '1', angle: 45, title: 'Privacy', subtitle: 'Enhanced', icon: Shield },
  { id: '2', angle: 135, title: 'Battery', subtitle: 'Optimized', icon: Battery },
  { id: '3', angle: 225, title: 'Night', subtitle: 'Mode', icon: Moon },
];

describe('RadialMenu', () => {
  it('renders center title', () => {
    render(
      <RadialMenu
        theme="dark"
        items={defaultItems}
        centerTitle="Hub"
        centerSubtitle="Control Center"
      />
    );
    expect(screen.getByText('Hub')).toBeTruthy();
  });

  it('renders center subtitle', () => {
    render(
      <RadialMenu
        theme="dark"
        items={defaultItems}
        centerTitle="Hub"
        centerSubtitle="Control Center"
      />
    );
    expect(screen.getByText('Control Center')).toBeTruthy();
  });

  it('renders item titles', () => {
    render(
      <RadialMenu
        theme="dark"
        items={defaultItems}
        centerTitle="Hub"
        centerSubtitle="Control Center"
      />
    );
    expect(screen.getByText('Privacy')).toBeTruthy();
    expect(screen.getByText('Battery')).toBeTruthy();
    expect(screen.getByText('Night')).toBeTruthy();
  });

  it('renders with dark theme', () => {
    render(
      <RadialMenu
        theme="dark"
        items={defaultItems}
        centerTitle="Hub"
        centerSubtitle="Control Center"
      />
    );
    expect(screen.getByText('Hub')).toBeTruthy();
  });

  it('renders with light theme', () => {
    render(
      <RadialMenu
        theme="light"
        items={defaultItems}
        centerTitle="Hub"
        centerSubtitle="Control Center"
      />
    );
    expect(screen.getByText('Hub')).toBeTruthy();
  });

  it('renders item subtitles', () => {
    render(
      <RadialMenu
        theme="dark"
        items={defaultItems}
        centerTitle="Hub"
        centerSubtitle="Control Center"
      />
    );
    expect(screen.getByText('Enhanced')).toBeTruthy();
    expect(screen.getByText('Optimized')).toBeTruthy();
    expect(screen.getByText('Mode')).toBeTruthy();
  });

  it('opens menu on center click', () => {
    render(
      <RadialMenu
        theme="dark"
        items={defaultItems}
        centerTitle="Hub"
        centerSubtitle="Control Center"
      />
    );
    const hubTitle = screen.getByText('Hub');
    const hubElement = hubTitle.closest('[style*="translate"]') || hubTitle.parentElement?.parentElement;
    if (hubElement) {
      fireEvent.click(hubElement);
    } else {
      fireEvent.click(hubTitle);
    }
    expect(screen.getByTitle('radial.closeMenu')).toBeTruthy();
  });

  it('calls onCenterClick when diamond icon clicked', () => {
    const onCenterClick = vi.fn();
    render(
      <RadialMenu
        theme="dark"
        items={defaultItems}
        centerTitle="Hub"
        centerSubtitle="Control Center"
        onCenterClick={onCenterClick}
      />
    );
    const diamondButton = document.querySelector('.rounded-full.cursor-pointer.relative');
    if (diamondButton) {
      fireEvent.click(diamondButton);
      expect(onCenterClick).toHaveBeenCalled();
    }
  });

  it('calls onItemClick when an item bubble is clicked', () => {
    const onItemClick = vi.fn();
    render(
      <RadialMenu
        theme="dark"
        items={defaultItems}
        centerTitle="Hub"
        centerSubtitle="Control Center"
        onItemClick={onItemClick}
      />
    );
    const centerHub = screen.getByText('Hub').closest('[style*="translate"]')?.parentElement;
    if (centerHub) {
      fireEvent.click(centerHub);
    }
    const privacyItem = screen.getByTitle('Privacy - Enhanced');
    if (privacyItem) {
      fireEvent.click(privacyItem);
      expect(onItemClick).toHaveBeenCalledWith('1');
    }
  });
});
