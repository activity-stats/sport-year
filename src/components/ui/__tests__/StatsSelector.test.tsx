import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';
import { StatsSelector } from '../StatsSelector';
import { availableStats } from '../statsOptions';
import type { YearStats } from '../../../types';
import * as toast from '../../../utils/toast';

// Mock the toast utility
vi.mock('../../../utils/toast', () => ({
  showWarning: vi.fn(),
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showInfo: vi.fn(),
}));

describe('StatsSelector', () => {
  const mockStats: YearStats = {
    year: 2024,
    totalDistanceKm: 5000,
    totalElevationMeters: 50000,
    totalTimeHours: 250,
    activityCount: 200,
    totalKudos: 1500,
    longestActivity: {
      id: '1',
      name: 'Long Run',
      type: 'Run',
      date: new Date('2024-01-01'),
      distanceKm: 42.2,
      durationMinutes: 240,
      movingTimeMinutes: 240,
      elevationGainMeters: 500,
      averageSpeedKmh: 10.5,
      maxSpeedKmh: 15.0,
    },
    highestElevation: undefined,
    byType: {} as any,
    byMonth: [],
    byDayOfWeek: [],
    hourDayHeatmap: new Map(),
  };

  let mockOnConfirm: (selectedStats: any[]) => void;
  let mockOnClose: () => void;

  beforeEach(() => {
    mockOnConfirm = vi.fn();
    mockOnClose = vi.fn();
    vi.clearAllMocks(); // Clear all mocks including toast
    i18n.changeLanguage('en'); // Ensure tests run in English
  });

  const renderWithI18n = (component: React.ReactElement) => {
    return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
  };

  it('renders stats selector with all stat options', () => {
    renderWithI18n(
      <StatsSelector
        stats={mockStats}
        daysActive={150}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Select Stats')).toBeInTheDocument();
    expect(screen.getByText('Choose 1-4 stats to display on your social card')).toBeInTheDocument();

    // Check that all stat options are rendered
    availableStats.forEach((stat: { label: string }) => {
      expect(screen.getByText(stat.label)).toBeInTheDocument();
    });
  });

  it('has first 3 stats selected by default', () => {
    renderWithI18n(
      <StatsSelector
        stats={mockStats}
        daysActive={150}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    // Should show "3 of 4 selected"
    expect(screen.getByText(/3 of 4 selected/)).toBeInTheDocument();
  });

  it('allows selecting and deselecting stats', async () => {
    const user = userEvent.setup();
    renderWithI18n(
      <StatsSelector
        stats={mockStats}
        daysActive={150}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    // Find the Activities stat button (not selected by default)
    const activitiesButton = screen.getByText('Activities').closest('button');
    expect(activitiesButton).toBeTruthy();

    if (activitiesButton) {
      await user.click(activitiesButton);
      // Should now show "4 of 4 selected"
      expect(screen.getByText(/4 of 4 selected/)).toBeInTheDocument();
    }
  });

  it('prevents selecting more than 4 stats', async () => {
    const user = userEvent.setup();

    renderWithI18n(
      <StatsSelector
        stats={mockStats}
        daysActive={150}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    // Select the 4th stat
    const activitiesButton = screen.getByText('Activities').closest('button');
    if (activitiesButton) {
      await user.click(activitiesButton);
    }

    // Try to select a 5th stat
    const daysActiveButton = screen.getByText('Days Active').closest('button');
    if (daysActiveButton) {
      await user.click(daysActiveButton);
      expect(toast.showWarning).toHaveBeenCalledWith('You can select up to 4 stats');
    }
  });

  it('calls onConfirm with selected stats when Next button is clicked', async () => {
    const user = userEvent.setup();
    renderWithI18n(
      <StatsSelector
        stats={mockStats}
        daysActive={150}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    const nextButton = screen.getByText('Next: Select Highlights');
    await user.click(nextButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    const selectedStats = (mockOnConfirm as any).mock.calls[0][0];
    expect(selectedStats).toHaveLength(3); // Default 3 selected
    expect(selectedStats[0].id).toBe('distance');
    expect(selectedStats[1].id).toBe('elevation');
    expect(selectedStats[2].id).toBe('time');
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderWithI18n(
      <StatsSelector
        stats={mockStats}
        daysActive={150}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when X button is clicked', async () => {
    const user = userEvent.setup();
    renderWithI18n(
      <StatsSelector
        stats={mockStats}
        daysActive={150}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByText('×');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('allows deselecting all stats', async () => {
    const user = userEvent.setup();

    // Start with only 1 stat selected
    renderWithI18n(
      <StatsSelector
        stats={mockStats}
        daysActive={150}
        initialSelectedStats={[availableStats[0]]} // Only distance
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    // Deselect the only selected stat - should be allowed now
    const distanceButton = screen.getByText('km Distance').closest('button');
    if (distanceButton) {
      await user.click(distanceButton);
      // No warning should be shown
      expect(toast.showWarning).not.toHaveBeenCalled();
    }
  });

  it('allows reordering stats by deselecting and reselecting', async () => {
    const user = userEvent.setup();
    renderWithI18n(
      <StatsSelector
        stats={mockStats}
        daysActive={150}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    // Deselect elevation (2nd stat)
    const elevationButton = screen.getByText('m Elevation').closest('button');
    if (elevationButton) {
      await user.click(elevationButton);
    }

    // Select it again
    if (elevationButton) {
      await user.click(elevationButton);
    }

    const nextButton = screen.getByText('Next: Select Highlights');
    await user.click(nextButton);

    expect(mockOnConfirm).toHaveBeenCalled();
  });
});
