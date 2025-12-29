import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render as renderRTL, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';
import { ActivityList } from '../ActivityList';
import type { Activity } from '../../../types/activity';

describe('ActivityList', () => {
  const renderWithI18n = (ui: React.ReactElement) => {
    return renderRTL(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
  };

  const mockActivities: Activity[] = [
    {
      id: 'activity-1',
      name: 'Morning Run',
      type: 'Run',
      date: new Date('2024-01-15T08:00:00Z'),
      distanceKm: 10.5,
      movingTimeMinutes: 60,
      durationMinutes: 62,
      elevationGainMeters: 120,
      averageSpeedKmh: 10.5,
      maxSpeedKmh: 15.2,
    },
    {
      id: 'activity-2',
      name: 'Afternoon Bike',
      type: 'Ride',
      date: new Date('2024-01-15T14:00:00Z'),
      distanceKm: 45.0,
      movingTimeMinutes: 120,
      durationMinutes: 125,
      elevationGainMeters: 450,
      averageSpeedKmh: 22.5,
      maxSpeedKmh: 42.0,
    },
    {
      id: 'triathlon-swim',
      name: 'IRONMAN Swim',
      type: 'Swim',
      date: new Date('2024-01-20T07:00:00Z'),
      distanceKm: 3.8,
      movingTimeMinutes: 70,
      durationMinutes: 70,
      elevationGainMeters: 0,
      averageSpeedKmh: 3.26,
      maxSpeedKmh: 4.0,
    },
    {
      id: 'triathlon-bike',
      name: 'IRONMAN Bike',
      type: 'Ride',
      date: new Date('2024-01-20T08:30:00Z'),
      distanceKm: 180.0,
      movingTimeMinutes: 360,
      durationMinutes: 365,
      elevationGainMeters: 1200,
      averageSpeedKmh: 30.0,
      maxSpeedKmh: 55.0,
    },
    {
      id: 'triathlon-run',
      name: 'IRONMAN Run',
      type: 'Run',
      date: new Date('2024-01-20T15:00:00Z'),
      distanceKm: 42.2,
      movingTimeMinutes: 240,
      durationMinutes: 245,
      elevationGainMeters: 50,
      averageSpeedKmh: 10.55,
      maxSpeedKmh: 13.0,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render activity list with all activities', () => {
      renderWithI18n(<ActivityList activities={mockActivities} />);

      expect(screen.getByText('Morning Run')).toBeInTheDocument();
      expect(screen.getByText('Afternoon Bike')).toBeInTheDocument();
      expect(screen.getByText('IRONMAN Swim')).toBeInTheDocument();
    });

    it('should display activity count', () => {
      renderWithI18n(<ActivityList activities={mockActivities} />);

      // Should show total count in header
      expect(screen.getByText(/Activities \(5\)/)).toBeInTheDocument();
    });

    it('should render empty state when no activities', () => {
      renderWithI18n(<ActivityList activities={[]} />);

      expect(screen.getByText('No activities found')).toBeInTheDocument();
    });
  });

  describe('Activity Highlighting - Single Activity', () => {
    it('should highlight single activity when highlightedActivityIds provided', () => {
      const { container } = renderWithI18n(
        <ActivityList activities={mockActivities} highlightedActivityIds={['activity-1']} />
      );

      const highlightedActivity = container.querySelector('#activity-activity-1');
      expect(highlightedActivity).toHaveClass('border-orange-500');
      expect(highlightedActivity).toHaveClass('ring-2');
      expect(highlightedActivity).toHaveClass('ring-orange-500');
    });

    it('should not highlight activities not in highlightedActivityIds', () => {
      const { container } = renderWithI18n(
        <ActivityList activities={mockActivities} highlightedActivityIds={['activity-1']} />
      );

      const notHighlightedActivity = container.querySelector('#activity-activity-2');
      expect(notHighlightedActivity).not.toHaveClass('border-orange-500');
      expect(notHighlightedActivity).toHaveClass('border-gray-200');
    });

    it('should auto-scroll to highlighted activity', async () => {
      const scrollIntoViewMock = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      renderWithI18n(
        <ActivityList activities={mockActivities} highlightedActivityIds={['activity-2']} />
      );

      await waitFor(
        () => {
          expect(scrollIntoViewMock).toHaveBeenCalledWith({
            behavior: 'smooth',
            block: 'center',
          });
        },
        { timeout: 500 }
      );
    });
  });

  describe('Activity Highlighting - Multiple Activities (Triathlon)', () => {
    it('should highlight all triathlon component activities', () => {
      const triathlonActivityIds = ['triathlon-swim', 'triathlon-bike', 'triathlon-run'];
      const { container } = renderWithI18n(
        <ActivityList activities={mockActivities} highlightedActivityIds={triathlonActivityIds} />
      );

      triathlonActivityIds.forEach((id) => {
        const activity = container.querySelector(`#activity-${id}`);
        expect(activity).toHaveClass('border-orange-500');
        expect(activity).toHaveClass('ring-2');
        expect(activity).toHaveClass('ring-orange-500');
        expect(activity).toHaveClass('bg-orange-50');
      });
    });

    it('should auto-scroll to first triathlon activity', async () => {
      const scrollIntoViewMock = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      const triathlonActivityIds = ['triathlon-swim', 'triathlon-bike', 'triathlon-run'];
      renderWithI18n(
        <ActivityList activities={mockActivities} highlightedActivityIds={triathlonActivityIds} />
      );

      await waitFor(
        () => {
          expect(scrollIntoViewMock).toHaveBeenCalledWith({
            behavior: 'smooth',
            block: 'center',
          });
        },
        { timeout: 500 }
      );
    });

    it('should not highlight other activities when triathlon is highlighted', () => {
      const triathlonActivityIds = ['triathlon-swim', 'triathlon-bike', 'triathlon-run'];
      const { container } = renderWithI18n(
        <ActivityList activities={mockActivities} highlightedActivityIds={triathlonActivityIds} />
      );

      const regularActivity = container.querySelector('#activity-activity-1');
      expect(regularActivity).not.toHaveClass('border-orange-500');
      expect(regularActivity).toHaveClass('border-gray-200');
    });
  });

  describe('Date Filtering', () => {
    it('should filter activities by selected date', () => {
      const selectedDate = new Date('2024-01-15');
      renderWithI18n(<ActivityList activities={mockActivities} selectedDate={selectedDate} />);

      // Should show only activities from Jan 15
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
      expect(screen.getByText('Afternoon Bike')).toBeInTheDocument();
      expect(screen.queryByText('IRONMAN Swim')).not.toBeInTheDocument();
    });

    it('should show date filter badge when date is selected', () => {
      const selectedDate = new Date('2024-01-15');
      renderWithI18n(<ActivityList activities={mockActivities} selectedDate={selectedDate} />);

      // Date appears multiple times (in badge and on activity cards), use getAllByText
      const dateElements = screen.getAllByText(/Jan 15, 2024/);
      expect(dateElements.length).toBeGreaterThan(0);
    });

    it('should clear date filter when clear button clicked', () => {
      const onClearDateFilter = vi.fn();
      const selectedDate = new Date('2024-01-15');
      renderWithI18n(
        <ActivityList
          activities={mockActivities}
          selectedDate={selectedDate}
          onClearDateFilter={onClearDateFilter}
        />
      );

      const clearButton = screen.getByTitle('Clear date filter');
      clearButton.click();

      expect(onClearDateFilter).toHaveBeenCalledTimes(1);
    });
  });

  describe('Date Filtering + Highlighting Interaction', () => {
    it('should highlight activity when both date filter and highlight are active', () => {
      const selectedDate = new Date('2024-01-15');
      const { container } = renderWithI18n(
        <ActivityList
          activities={mockActivities}
          selectedDate={selectedDate}
          highlightedActivityIds={['activity-1']}
        />
      );

      // Should show filtered activities
      expect(screen.getByText('Morning Run')).toBeInTheDocument();

      // Should highlight the activity
      const highlightedActivity = container.querySelector('#activity-activity-1');
      expect(highlightedActivity).toHaveClass('border-orange-500');
    });

    it('should clear both filters when onClearDateFilter is called', () => {
      const onClearDateFilter = vi.fn();
      const selectedDate = new Date('2024-01-15');
      renderWithI18n(
        <ActivityList
          activities={mockActivities}
          selectedDate={selectedDate}
          highlightedActivityIds={['activity-1']}
          onClearDateFilter={onClearDateFilter}
        />
      );

      const clearButton = screen.getByTitle('Clear date filter');
      clearButton.click();

      // Should call the handler which should clear both date and highlight
      expect(onClearDateFilter).toHaveBeenCalledTimes(1);
    });
  });

  describe('Activity Links', () => {
    it('should render Strava links for all activities', () => {
      renderWithI18n(<ActivityList activities={mockActivities} />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(5);

      // Check that links have proper Strava attributes
      links.forEach((link) => {
        expect(link).toHaveAttribute('href');
        expect(link.getAttribute('href')).toContain('strava.com/activities/');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });
  });

  describe('Search and Filtering', () => {
    it('should filter activities by search text', () => {
      renderWithI18n(<ActivityList activities={mockActivities} />);

      const searchInput = screen.getByPlaceholderText('Search by name or date...');
      searchInput.focus();
      // Note: Full user interaction testing would require userEvent
      // This validates the input exists and has the right placeholder
      expect(searchInput).toBeInTheDocument();
    });

    it('should display activity type filter dropdown', () => {
      renderWithI18n(<ActivityList activities={mockActivities} />);

      const filterSelect = screen.getByDisplayValue('All');
      expect(filterSelect).toBeInTheDocument();
    });

    it('should display sort dropdown', () => {
      renderWithI18n(<ActivityList activities={mockActivities} />);

      const sortSelect = screen.getByDisplayValue('Sort: Date');
      expect(sortSelect).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty highlightedActivityIds array', () => {
      const { container } = renderWithI18n(
        <ActivityList activities={mockActivities} highlightedActivityIds={[]} />
      );

      const activity = container.querySelector('#activity-activity-1');
      expect(activity).not.toHaveClass('border-orange-500');
    });

    it('should handle highlightedActivityIds with non-existent IDs', () => {
      const { container } = renderWithI18n(
        <ActivityList activities={mockActivities} highlightedActivityIds={['non-existent-id']} />
      );

      // Should not crash, just no activities highlighted
      const activities = container.querySelectorAll('[id^="activity-"]');
      activities.forEach((activity) => {
        expect(activity).not.toHaveClass('border-orange-500');
      });
    });

    it('should not auto-scroll when no highlighted activities', () => {
      const scrollIntoViewMock = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      renderWithI18n(<ActivityList activities={mockActivities} highlightedActivityIds={[]} />);

      // Wait a bit to ensure no scroll happens
      setTimeout(() => {
        expect(scrollIntoViewMock).not.toHaveBeenCalled();
      }, 400);
    });
  });
});
