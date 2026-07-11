import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { CampaignsScene } from './CampaignsScene';

describe('CampaignsScene', () => {
  it('renders title', () => {
    render(<CampaignsScene />);
    expect(screen.getByText('Campaigns Scene')).toBeInTheDocument();
  });

  it('renders placeholder description', () => {
    render(<CampaignsScene />);
    expect(screen.getByText(/Scene placeholder/)).toBeInTheDocument();
  });
});
