import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AppearanceSettings } from './AppearanceSettings';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key),
    lang: 'en',
    setLang: vi.fn(),
  }),
}));

describe('AppearanceSettings - additional tests', () => {
  const defaultProps = {
    theme: 'dark' as 'light' | 'dark',
    setTheme: vi.fn(),
    fontSize: 'Medium',
    setFontSize: vi.fn(),
    uiAnimations: true,
    setUiAnimations: vi.fn(),
    onBack: vi.fn(),
  };

  it('renders segmented controls and rows', () => {
    render(<AppearanceSettings {...defaultProps} />);
    expect(document.querySelectorAll('button').length).toBeGreaterThan(0);
  });

  it('renders font size row value', () => {
    render(<AppearanceSettings {...defaultProps} fontSize="Large" />);
    expect(screen.getByText('Large')).toBeInTheDocument();
  });

  it('renders dark theme styles', () => {
    const { container } = render(<AppearanceSettings {...defaultProps} />);
    expect(container.querySelector('[class*="bg-"]') || container.querySelector('[class*="border-"]')).toBeInTheDocument();
  });

  it('renders light theme styles', () => {
    const { container } = render(<AppearanceSettings {...defaultProps} theme="light" />);
    expect(container.querySelector('[class*="bg-white"]') || container.querySelector('[class*="border-"]')).toBeInTheDocument();
  });

  it('renders all groups', () => {
    const { container } = render(<AppearanceSettings {...defaultProps} />);
    expect(container.querySelectorAll('[class*="bg-"]').length).toBeGreaterThan(0);
  });

  it('renders section title', () => {
    render(<AppearanceSettings {...defaultProps} />);
    expect(screen.getByText('settings.appearance')).toBeInTheDocument();
  });

  it('renders theme toggle description', () => {
    render(<AppearanceSettings {...defaultProps} />);
    expect(screen.getByText('settings.darkTheme')).toBeInTheDocument();
  });

  it('renders animations subtitle', () => {
    render(<AppearanceSettings {...defaultProps} />);
    expect(screen.getByText('settings.animationsSubtitle')).toBeInTheDocument();
  });

  it('accent swatches keep 44px hit zone and are labelled', () => {
    const { container } = render(<AppearanceSettings {...defaultProps} />);
    const swatch = container.querySelector('button[aria-label="#3b82f6"]') as HTMLElement;
    expect(swatch).toBeInTheDocument();
    expect(swatch.className).toContain('min-w-11');
    expect(swatch.className).toContain('min-h-11');
    expect(swatch).toHaveAttribute('aria-pressed');
  });
});

describe('AppearanceSettings - custom chat background (premium)', () => {
  const freeProps = {
    theme: 'dark' as 'light' | 'dark',
    setTheme: vi.fn(),
    fontSize: 'Medium',
    setFontSize: vi.fn(),
    uiAnimations: true,
    setUiAnimations: vi.fn(),
    onBack: vi.fn(),
  };
  const premiumProps = {
    ...freeProps,
    premium: true,
    setCustomChatBackground: vi.fn(),
    setChatBackground: vi.fn(),
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hides the custom chip and shows a premium hint on the free tier', () => {
    render(<AppearanceSettings {...freeProps} premium={false} />);
    expect(screen.queryByText('settings.chatbg.custom')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('settings.chatbg.remove')).not.toBeInTheDocument();
    expect(screen.getByText('settings.chatbg.premium')).toBeInTheDocument();
  });

  it('renders the custom chip for premium users', () => {
    render(<AppearanceSettings {...premiumProps} />);
    expect(screen.getByText('settings.chatbg.custom')).toBeInTheDocument();
    expect(screen.queryByText('settings.chatbg.premium')).not.toBeInTheDocument();
  });

  it('uploading a file downscales to a data URL and applies it', async () => {
    class FakeImage {
      onload: (() => void) | null = null;
      width = 1920;
      height = 1080;
      set src(_v: string) {
        setTimeout(() => this.onload?.(), 0);
      }
    }
    vi.stubGlobal('Image', FakeImage);
    const ctx = { drawImage: vi.fn() } as unknown as CanvasRenderingContext2D;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,MOCK');

    const { container } = render(<AppearanceSettings {...premiumProps} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    const file = new File(['x'], 'bg.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(premiumProps.setCustomChatBackground).toHaveBeenCalledWith('data:image/jpeg;base64,MOCK');
      expect(premiumProps.setChatBackground).toHaveBeenCalledWith('custom');
    });
    expect(ctx.drawImage).toHaveBeenCalled();
  });

  it('remove button clears the custom background and falls back to default', () => {
    const { container } = render(
      <AppearanceSettings {...premiumProps} customChatBackground="data:image/jpeg;base64,AAAA" chatBackground="custom" />,
    );
    const remove = screen.getByLabelText('settings.chatbg.remove');
    fireEvent.click(remove);
    expect(premiumProps.setCustomChatBackground).toHaveBeenCalledWith('');
    expect(premiumProps.setChatBackground).toHaveBeenCalledWith('default');
    expect(container.querySelector('input[type="file"]')).toBeInTheDocument();
  });

  it('custom chip toggle: active → resets to default without reopening the picker', () => {
    render(
      <AppearanceSettings {...premiumProps} customChatBackground="data:image/jpeg;base64,AAAA" chatBackground="custom" />,
    );
    const chip = screen.getByText('settings.chatbg.custom');
    fireEvent.click(chip);
    expect(premiumProps.setChatBackground).toHaveBeenCalledWith('default');
    expect(premiumProps.setCustomChatBackground).not.toHaveBeenCalled();
  });
});
