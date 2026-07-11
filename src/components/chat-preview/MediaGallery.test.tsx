import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MediaGallery } from './MediaGallery';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string) => key, lang: 'en', setLang: vi.fn() }),
}));

const mockMediaItems = [
  { id: 1, sender: 'me', type: 'image', attachment: 'photo1.jpg', url: 'photo1.jpg' },
  { id: 2, sender: 'them', type: 'image', attachment: 'photo2.jpg', url: 'photo2.jpg' },
  { id: 3, sender: 'me', type: 'audio', duration: '0:30' },
  { id: 4, sender: 'them', type: 'text', text: 'Check this out' },
];

const baseProps: any = {
  showMediaPanel: true,
  mediaItems: mockMediaItems,
  mediaTab: 'all',
  setMediaTab: vi.fn(),
  filterBySender: '',
  setFilterBySender: vi.fn(),
  filterStartDate: '',
  filterEndDate: '',
  setFilterStartDate: vi.fn(),
  setFilterEndDate: vi.fn(),
  showFilterMenu: false,
  setShowFilterMenu: vi.fn(),
  setShowMediaPanel: vi.fn(),
  setActivePhotoUrl: vi.fn(),
  setPhotoOpen: vi.fn(),
  activePhotoUrl: null,
};

describe('MediaGallery', () => {
  it('renders nothing when showMediaPanel is false', () => {
    const { container } = render(<MediaGallery {...baseProps} showMediaPanel={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders media grid with items', () => {
    render(<MediaGallery {...baseProps} />);
    const imgs = document.querySelectorAll('img[alt="media"]');
    expect(imgs.length).toBe(2);
  });

  it('renders filter button', () => {
    render(<MediaGallery {...baseProps} />);
    const filterIcon = document.querySelector('.lucide-list-filter');
    expect(filterIcon).toBeInTheDocument();
  });

  it('renders media tab buttons', () => {
    render(<MediaGallery {...baseProps} />);
    expect(screen.getByText('chat.filters.mediaTabs.all')).toBeInTheDocument();
    expect(screen.getByText('chat.filters.mediaTabs.photos')).toBeInTheDocument();
    expect(screen.getByText('chat.filters.mediaTabs.audio')).toBeInTheDocument();
    expect(screen.getByText('chat.filters.mediaTabs.links')).toBeInTheDocument();
  });

  it('changes tab when tab button is clicked', () => {
    const setMediaTab = vi.fn();
    render(<MediaGallery {...baseProps} setMediaTab={setMediaTab} />);
    fireEvent.click(screen.getByText('chat.filters.mediaTabs.photos'));
    expect(setMediaTab).toHaveBeenCalledWith('photos');
  });

  it('fires onImageClick when image media is clicked', () => {
    const setActivePhotoUrl = vi.fn();
    const setPhotoOpen = vi.fn();
    render(
      <MediaGallery
        {...baseProps}
        setActivePhotoUrl={setActivePhotoUrl}
        setPhotoOpen={setPhotoOpen}
      />,
    );
    const imageDivs = document.querySelectorAll('img[alt="media"]');
    fireEvent.click(imageDivs[0].closest('div[cursor-pointer]') || imageDivs[0]);
    expect(setActivePhotoUrl).toHaveBeenCalledWith('photo1.jpg');
    expect(setPhotoOpen).toHaveBeenCalledWith(true);
  });

  it('renders audio items with voice note display', () => {
    render(<MediaGallery {...baseProps} />);
    expect(screen.getByText('chat.filters.voiceNote')).toBeInTheDocument();
    expect(screen.getByText('0:30')).toBeInTheDocument();
  });

  it('renders text items with content preview', () => {
    render(<MediaGallery {...baseProps} />);
    expect(screen.getByText('Check this out')).toBeInTheDocument();
  });

  it('toggles filter menu when filter button is clicked', () => {
    const setShowFilterMenu = vi.fn();
    render(<MediaGallery {...baseProps} setShowFilterMenu={setShowFilterMenu} />);
    const filterBtn = document.querySelector('.lucide-list-filter')?.closest('button');
    if (filterBtn) fireEvent.click(filterBtn);
    expect(setShowFilterMenu).toHaveBeenCalled();
  });

  it('renders filter controls when showFilterMenu is true', () => {
    render(<MediaGallery {...baseProps} showFilterMenu={true} />);
    expect(screen.getByText('chat.filters.all')).toBeInTheDocument();
    expect(screen.getByText('chat.filters.me')).toBeInTheDocument();
    expect(screen.getByText('chat.filters.others')).toBeInTheDocument();
  });
});
