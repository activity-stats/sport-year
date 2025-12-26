import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatsSelector } from '../StatsSelector';
import { availableStats } from '../statsOptions';
import type { YearStats } from '../../../types';

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
  };

  let mockOnConfirm: (selectedStats: any[]) => void;
  let mockOnClose: () => void;

  beforeEach(() => {
    mockOnConfirm = vi.fn();
    mockOnClose = vi.fn();
  });

  it('renders stats selector with all stat options', () => {
    render(
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
    render(
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
    render(
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
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
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
      expect(alertSpy).toHaveBeenCalledWith('You can select up to 4 stats');
    }

    alertSpy.mockRestore();
  });

  it('calls onConfirm with selected stats when Next button is clicked', async () => {
    const user = userEvent.setup();
    render(
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
    render(
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
    render(
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
});
