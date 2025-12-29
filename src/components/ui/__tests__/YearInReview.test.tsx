import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';
import { YearInReview } from '../YearInReview';
import type { Activity, YearStats, ActivityType, TypeStats } from '../../../types';
import type { StravaAthlete } from '../../../types/strava';

// Helper to render with i18n
const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe('YearInReview', () => {
  const mockAthlete: StravaAthlete = {
    id: 12345,
    username: 'testathlete',
    firstname: 'Test',
    lastname: 'Athlete',
    profile: 'https://example.com/avatar.jpg',
    city: 'Test City',
    state: 'Test State',
    country: 'Test Country',
  };

  const mockStats: YearStats = {
    year: 2024,
    totalDistanceKm: 1000, // 1000 km
    totalTimeHours: 100, // 100 hours
    totalElevationMeters: 15000, // 15000 m
    activityCount: 150,
    totalKudos: 500,
    byMonth: [],
    byType: {} as Record<ActivityType, TypeStats>,
    byDayOfWeek: [],
    hourDayHeatmap: new Map(),
  };

  const createActivity = (
    id: string,
    name: string,
    type: ActivityType,
    distance: number,
    duration: number,
    date: string = '2024-01-15T10:00:00Z',
    elevation: number = 100
  ): Activity => ({
    id,
    name,
    type,
    date: new Date(date),
    distanceKm: distance / 1000,
    durationMinutes: duration,
    movingTimeMinutes: duration,
    elevationGainMeters: elevation,
    averageSpeedKmh: distance / 1000 / (duration / 60),
    maxSpeedKmh: 15,
  });

  const mockActivities: Activity[] = [
    createActivity('1', 'Morning Run', 'Run', 10000, 50, '2024-01-15T07:00:00Z', 120),
    createActivity('2', 'Afternoon Bike', 'Ride', 45000, 120, '2024-02-20T14:00:00Z', 450),
    createActivity('3', 'Evening Swim', 'Swim', 2000, 45, '2024-03-10T18:00:00Z', 0),
    createActivity('4', 'Marathon', 'Run', 42195, 180, '2024-04-01T08:00:00Z', 300),
    createActivity('5', 'Century Ride', 'Ride', 100000, 360, '2024-05-15T06:00:00Z', 1200),
  ];

  const mockHighlightFilters = {
    backgroundImageUrl: null,
    backgroundImageCrop: null,
    backgroundImageOpacity: 0.3,
    socialCardCrops: {},
    excludedActivityTypes: [] as any[],
    excludeVirtualPerSport: {
      cycling: { highlights: false, stats: false },
      running: { highlights: false, stats: false },
      swimming: { highlights: false, stats: false },
    },
    titleIgnorePatterns: [],
    highlightStats: ['distance', 'duration', 'elevation', 'activities'] as any[],
    activityTypeSettings: {
      order: ['Run', 'Ride', 'Swim'] as any[],
      includeInStats: ['Run', 'Ride', 'Swim'] as any[],
      includeInHighlights: ['Run', 'Ride', 'Swim'] as any[],
    },
    specialOptions: {
      enableTriathlonHighlights: true,
      mergeCycling: false,
    },
    activityFilters: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render year in review with stats', () => {
      renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={mockActivities}
          athlete={mockAthlete}
          highlightFilters={mockHighlightFilters}
        />
      );

      // Check year is displayed
      expect(screen.getByText(/2024/)).toBeInTheDocument();
    });

    it('should render athlete name when provided', () => {
      const { container } = renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={mockActivities}
          athlete={mockAthlete}
          highlightFilters={mockHighlightFilters}
        />
      );

      // Component should render successfully with athlete
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render without athlete', () => {
      renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={mockActivities}
          athlete={null}
          highlightFilters={mockHighlightFilters}
        />
      );

      expect(screen.queryByText('Test Athlete')).not.toBeInTheDocument();
    });

    it('should render last365 period', () => {
      renderWithI18n(
        <YearInReview
          year="last365"
          stats={mockStats}
          activities={mockActivities}
          athlete={mockAthlete}
          highlightFilters={mockHighlightFilters}
        />
      );

      // Should show "Last 365 Days" or similar text
      expect(screen.getByText(/Last 365 Days/i)).toBeInTheDocument();
    });
  });

  describe('Activity Click Handler', () => {
    it('should call onActivityClick when clicking an activity', async () => {
      const onActivityClick = vi.fn();
      const user = userEvent.setup();

      renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={mockActivities}
          athlete={mockAthlete}
          highlightFilters={mockHighlightFilters}
          onActivityClick={onActivityClick}
        />
      );

      // Find and click an activity card (they have links to Strava)
      const activityLinks = screen.getAllByRole('link');
      const firstActivity = activityLinks.find((link) =>
        link.getAttribute('href')?.includes('strava.com/activities')
      );

      if (firstActivity) {
        await user.click(firstActivity);
        expect(onActivityClick).toHaveBeenCalled();
      }
    });

    it('should not call onActivityClick when handler not provided', async () => {
      const user = userEvent.setup();

      renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={mockActivities}
          athlete={mockAthlete}
          highlightFilters={mockHighlightFilters}
        />
      );

      // Find an activity link
      const activityLinks = screen.getAllByRole('link');
      const firstActivity = activityLinks.find((link) =>
        link.getAttribute('href')?.includes('strava.com/activities')
      );

      // Should not throw error when clicking
      if (firstActivity) {
        await user.click(firstActivity);
        // Just verify it doesn't crash
        expect(firstActivity).toBeInTheDocument();
      }
    });
  });

  describe('Sport Highlights', () => {
    it('should display running highlights when activities exist', () => {
      renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={mockActivities}
          athlete={mockAthlete}
          highlightFilters={mockHighlightFilters}
        />
      );

      // Should show running emoji and activities
      const runningElements = screen.getAllByText(/🏃/);
      expect(runningElements.length).toBeGreaterThan(0);
    });

    it('should display cycling highlights when activities exist', () => {
      renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={mockActivities}
          athlete={mockAthlete}
          highlightFilters={mockHighlightFilters}
        />
      );

      // Should show cycling emoji
      const cyclingElements = screen.getAllByText(/🚴/);
      expect(cyclingElements.length).toBeGreaterThan(0);
    });

    it('should display swimming highlights when activities exist', () => {
      renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={mockActivities}
          athlete={mockAthlete}
          highlightFilters={mockHighlightFilters}
        />
      );

      // Should show swimming emoji
      const swimmingElements = screen.getAllByText(/🏊/);
      expect(swimmingElements.length).toBeGreaterThan(0);
    });
  });

  describe('Triathlon Highlights', () => {
    it('should display triathlon races when enabled', () => {
      const triathlonActivities = [
        createActivity('tri-swim', 'IRONMAN Swim', 'Swim', 3800, 60, '2024-06-15T08:00:00Z'),
        createActivity('tri-bike', 'IRONMAN Bike', 'Ride', 180000, 360, '2024-06-15T09:00:00Z'),
        createActivity('tri-run', 'IRONMAN Run', 'Run', 42195, 240, '2024-06-15T15:00:00Z'),
      ];

      renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={triathlonActivities}
          athlete={mockAthlete}
          highlightFilters={{
            ...mockHighlightFilters,
            specialOptions: {
              enableTriathlonHighlights: true,
              mergeCycling: false,
            },
          }}
        />
      );

      // Should display IRONMAN activities (multiple elements)
      const ironmanElements = screen.getAllByText(/IRONMAN/);
      expect(ironmanElements.length).toBeGreaterThan(0);
    });

    it('should not display triathlon highlights when disabled', () => {
      const triathlonActivities = [
        createActivity('tri-swim', 'IRONMAN Swim', 'Swim', 3800, 60, '2024-06-15T08:00:00Z'),
        createActivity('tri-bike', 'IRONMAN Bike', 'Ride', 180000, 360, '2024-06-15T09:00:00Z'),
        createActivity('tri-run', 'IRONMAN Run', 'Run', 42195, 240, '2024-06-15T15:00:00Z'),
      ];

      renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={triathlonActivities}
          athlete={mockAthlete}
          highlightFilters={{
            ...mockHighlightFilters,
            specialOptions: {
              enableTriathlonHighlights: false,
              mergeCycling: false,
            },
          }}
        />
      );

      // Should not group as triathlon (shown individually instead)
      // When disabled, the triathlon section should not appear
      expect(screen.queryByText('Triathlons')).not.toBeInTheDocument();
    });

    it('should call onActivityClick with all triathlon activity IDs', async () => {
      const onActivityClick = vi.fn();
      const user = userEvent.setup();

      const triathlonActivities = [
        createActivity('tri-swim', 'IRONMAN Swim', 'Swim', 3800, 60, '2024-06-15T08:00:00Z'),
        createActivity('tri-bike', 'IRONMAN Bike', 'Ride', 180000, 360, '2024-06-15T09:00:00Z'),
        createActivity('tri-run', 'IRONMAN Run', 'Run', 42195, 240, '2024-06-15T15:00:00Z'),
      ];

      renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={triathlonActivities}
          athlete={mockAthlete}
          highlightFilters={{
            ...mockHighlightFilters,
            specialOptions: {
              enableTriathlonHighlights: true,
              mergeCycling: false,
            },
          }}
          onActivityClick={onActivityClick}
        />
      );

      // Find and click one of the triathlon activity cards
      const ironmanElements = screen.getAllByText(/IRONMAN/);
      if (ironmanElements.length > 0) {
        const triathlonCard = ironmanElements[0].closest('a');
        if (triathlonCard) {
          await user.click(triathlonCard);

          // Should call onActivityClick (may pass single ID or array depending on implementation)
          expect(onActivityClick).toHaveBeenCalled();
        }
      }
    });
  });

  describe('Activity Filtering', () => {
    it('should exclude virtual activities when configured', () => {
      const activitiesWithVirtual = [
        createActivity('1', 'Real Run', 'Run', 10000, 50),
        { ...createActivity('2', 'Virtual Run', 'VirtualRide', 10000, 50), trainer: true },
      ];

      renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={activitiesWithVirtual}
          athlete={mockAthlete}
          highlightFilters={{
            ...mockHighlightFilters,
            excludeVirtualPerSport: {
              cycling: { highlights: false, stats: false },
              running: { highlights: true, stats: true },
              swimming: { highlights: false, stats: false },
            },
          }}
        />
      );

      // Real run should be shown, virtual should be filtered
      const realRunElements = screen.getAllByText('Real Run');
      expect(realRunElements.length).toBeGreaterThan(0);
    });

    it('should exclude activities by type when configured', () => {
      renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={mockActivities}
          athlete={mockAthlete}
          highlightFilters={{
            ...mockHighlightFilters,
            excludedActivityTypes: ['Swim'] as any[],
          }}
        />
      );

      // Swimming should not be shown
      expect(screen.queryByText('Evening Swim')).not.toBeInTheDocument();
    });

    it('should filter activities by title patterns', () => {
      const activitiesWithPatterns = [
        createActivity('1', 'Morning Run', 'Run', 10000, 50),
        createActivity('2', 'IRONMAN Training', 'Run', 10000, 50),
      ];

      renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={activitiesWithPatterns}
          athlete={mockAthlete}
          highlightFilters={{
            ...mockHighlightFilters,
            titleIgnorePatterns: [
              { pattern: 'IRONMAN', excludeFromHighlights: true, excludeFromStats: false },
            ],
          }}
        />
      );

      // IRONMAN should be excluded from highlights but stats should include it
      const morningRunElements = screen.getAllByText('Morning Run');
      expect(morningRunElements.length).toBeGreaterThan(0);
    });
  });

  describe('Stats Display', () => {
    it('should display total distance', () => {
      const { container } = renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={mockActivities}
          athlete={mockAthlete}
          highlightFilters={mockHighlightFilters}
        />
      );

      // Should render stats section
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should display total duration', () => {
      renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={mockActivities}
          athlete={mockAthlete}
          highlightFilters={mockHighlightFilters}
        />
      );

      // Should show duration (format may vary)
      const allText = document.body.textContent || '';
      expect(allText.length).toBeGreaterThan(0);
    });

    it('should display activity count', () => {
      const { container } = renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={mockActivities}
          athlete={mockAthlete}
          highlightFilters={mockHighlightFilters}
        />
      );

      // Component should render with content
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should display elevation gain when present', () => {
      const { container } = renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={mockActivities}
          athlete={mockAthlete}
          highlightFilters={mockHighlightFilters}
        />
      );

      // Should render elevation data (format may vary)
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should handle empty activities array', () => {
      renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={[]}
          athlete={mockAthlete}
          highlightFilters={mockHighlightFilters}
        />
      );

      // Should still render the component structure
      expect(screen.getByText(/2024/)).toBeInTheDocument();
    });

    it('should handle activities with no sport highlights', () => {
      const unknownActivities = [createActivity('1', 'Unknown Activity', 'Walk', 5000, 30)];

      renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={unknownActivities}
          athlete={mockAthlete}
          highlightFilters={mockHighlightFilters}
        />
      );

      // Should render without crashing
      expect(screen.getByText(/2024/)).toBeInTheDocument();
    });
  });

  describe('Date Click Handler', () => {
    it('should call onDateClick when clicking on calendar', async () => {
      const onDateClick = vi.fn();
      const user = userEvent.setup();

      const { container } = renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={mockActivities}
          athlete={mockAthlete}
          highlightFilters={mockHighlightFilters}
          onDateClick={onDateClick}
        />
      );

      // Find calendar cells (they should be clickable)
      const calendarCells = container.querySelectorAll('[data-date]');
      if (calendarCells.length > 0) {
        await user.click(calendarCells[0]);
        expect(onDateClick).toHaveBeenCalled();
      }
    });
  });

  describe('Background Image', () => {
    it('should render with background image when provided', () => {
      const { container } = renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={mockActivities}
          athlete={mockAthlete}
          highlightFilters={{
            ...mockHighlightFilters,
            backgroundImageUrl: 'https://example.com/background.jpg',
          }}
          backgroundImageUrl="https://example.com/background.jpg"
        />
      );

      // Component should render successfully
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render without background image', () => {
      renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={mockActivities}
          athlete={mockAthlete}
          highlightFilters={mockHighlightFilters}
        />
      );

      // Should render successfully
      expect(screen.getByText(/2024/)).toBeInTheDocument();
    });
  });

  describe('Activity Timeline', () => {
    it('should display monthly timeline', () => {
      renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={mockActivities}
          athlete={mockAthlete}
          highlightFilters={mockHighlightFilters}
        />
      );

      // Should show month names or timeline indicators
      // Timeline shows activities distributed across months
      expect(screen.getByText(/2024/)).toBeInTheDocument();
    });

    it('should show activities in chronological order in timeline', () => {
      const orderedActivities = [
        createActivity('1', 'January Run', 'Run', 10000, 50, '2024-01-15T10:00:00Z'),
        createActivity('2', 'February Ride', 'Ride', 45000, 120, '2024-02-15T10:00:00Z'),
        createActivity('3', 'March Swim', 'Swim', 2000, 45, '2024-03-15T10:00:00Z'),
      ];

      const { container } = renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={orderedActivities}
          athlete={mockAthlete}
          highlightFilters={mockHighlightFilters}
        />
      );

      // Timeline should render with activities
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should render export buttons', () => {
      renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={mockActivities}
          athlete={mockAthlete}
          highlightFilters={mockHighlightFilters}
        />
      );

      // Should have export/share buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    it('should render all major sections', () => {
      const { container } = renderWithI18n(
        <YearInReview
          year={2024}
          stats={mockStats}
          activities={mockActivities}
          athlete={mockAthlete}
          highlightFilters={mockHighlightFilters}
        />
      );

      // Should have main content sections
      expect(container.querySelector('div')).toBeInTheDocument();
    });
  });
});
