import type { Activity } from '../types/activity';
import type { YearStats } from '../types/activity';
import type {
  ActivityTypeFilter,
  TitlePattern,
  YearInReviewSettings,
} from '../stores/settingsStore';
import type { RaceHighlight, TriathlonRace } from '../utils/raceDetection';
import type { SportHighlights } from '../utils/sportHighlights';
import { aggregateYearStats } from '../utils/aggregations';
import { filterActivities } from '../utils/activityFilters';
import {
  detectRaceHighlights,
  detectRaceHighlightsWithExcluded,
  detectTriathlons,
} from '../utils/raceDetection';
import { calculateSportHighlights } from '../utils/sportHighlights';

/**
 * Configuration for race detection
 */
export interface RaceDetectionConfig {
  titleIgnorePatterns: TitlePattern[];
  activityFilters: ActivityTypeFilter[];
}

/**
 * Result of enriched activity processing
 */
export interface EnrichedActivityData {
  /** Activities filtered for statistics calculations */
  activitiesForStats: Activity[];
  /** Detected race highlights (marathons, triathlons, etc.) */
  highlights: RaceHighlight[];
  /** Sport-specific highlights (distance records, longest rides, etc.) */
  sportHighlights: {
    running?: SportHighlights;
    cycling?: SportHighlights;
    swimming?: SportHighlights;
  };
  /** Activity IDs excluded due to custom filters (to prevent duplicates) */
  excludedActivityIds: Set<string>;
  /** Year statistics (totals, monthly breakdown, etc.) */
  yearStats?: YearStats;
}

/**
 * ActivityService - Centralized service for activity data processing
 *
 * This service layer:
 * - Encapsulates all business logic for activity processing
 * - Provides high-level operations for components
 * - Uses existing utils internally (aggregations, filters, race detection)
 * - Returns domain models ready for consumption
 * - Ensures consistency across the application
 *
 * Benefits:
 * - Single source of truth for activity operations
 * - DRY: Logic in one place, used everywhere
 * - Testable: Service methods easy to unit test
 * - Maintainable: Changes to business logic happen in one place
 * - Extensible: Easy to add new features (multi-sport, PRs, training load)
 */
export class ActivityService {
  /**
   * Get enriched activities with all computed data
   *
   * This method:
   * 1. Applies filters for statistics vs highlights
   * 2. Detects races and highlights
   * 3. Calculates sport-specific highlights
   * 4. Aggregates statistics (optional)
   *
   * @param activities - Raw activities to process
   * @param settings - Year in review settings (filters, exclusions, etc.)
   * @param includeYearStats - Whether to calculate year statistics (optional, default: false)
   * @param year - Year for statistics calculation (required if includeYearStats is true)
   * @returns Enriched activity data ready for display
   *
   * @example
   * ```typescript
   * const enriched = ActivityService.getEnrichedActivities(activities, settings);
   * // Use enriched.highlights for timeline
   * // Use enriched.sportHighlights for sport sections
   * // Use enriched.activitiesForStats for totals
   * ```
   */
  static getEnrichedActivities(
    activities: Activity[],
    settings: YearInReviewSettings,
    includeYearStats: boolean = false,
    year?: number
  ): EnrichedActivityData {
    // STEP 1: Filter activities for statistics calculations
    // These activities exclude:
    // - Activity types in excludedActivityTypes
    // - Activities matching title patterns with excludeFromStats=true
    const activitiesForStats = activities.filter((activity) => {
      // Filter by activity type exclusions
      if (settings.excludedActivityTypes.includes(activity.type)) {
        return false;
      }

      // Apply title ignore patterns for stats
      for (const patternObj of settings.titleIgnorePatterns) {
        if (
          patternObj.excludeFromStats &&
          activity.name.toLowerCase().includes(patternObj.pattern.toLowerCase())
        ) {
          return false;
        }
      }

      return true;
    });

    // STEP 2: Detect races and highlights
    // This uses ALL activities (not filtered) to ensure complete detection
    // but respects titleIgnorePatterns for excludeFromHighlights
    const highlights = detectRaceHighlights(activities, {
      titleIgnorePatterns: settings.titleIgnorePatterns,
      activityFilters: settings.activityFilters,
    });

    // STEP 3: Get excluded activity IDs from custom filters
    // This prevents activities matched by custom filters from appearing
    // as duplicates in sport highlights (distance records)
    const { excludedActivityIds } = detectRaceHighlightsWithExcluded(activities, {
      titleIgnorePatterns: settings.titleIgnorePatterns,
      activityFilters: settings.activityFilters,
    });

    // STEP 4: Calculate sport-specific highlights
    // Uses activitiesForStats to ensure totals match statistics calculations
    // Respects excludedActivityIds to prevent duplicate display
    const sportHighlights = calculateSportHighlights(
      activitiesForStats,
      settings.activityFilters,
      excludedActivityIds,
      settings.titleIgnorePatterns,
      settings.activityTypeSettings.includeInHighlights
    );

    // STEP 5: Calculate year statistics (optional)
    let yearStats: YearStats | undefined;
    if (includeYearStats && year !== undefined) {
      yearStats = aggregateYearStats(activitiesForStats, year);
    }

    return {
      activitiesForStats,
      highlights,
      sportHighlights,
      excludedActivityIds,
      yearStats,
    };
  }

  /**
   * Detect triathlons specifically
   *
   * Detects multi-discipline events (swim + bike + run on same day)
   * with proper validation of distances, transitions, and naming.
   *
   * @param activities - Activities to analyze
   * @returns Detected triathlon races
   *
   * @example
   * ```typescript
   * const triathlons = ActivityService.getTriathlons(activities);
   * console.log(`Found ${triathlons.length} triathlons`);
   * ```
   */
  static getTriathlons(activities: Activity[]): TriathlonRace[] {
    return detectTriathlons(activities);
  }

  /**
   * Get race highlights only (without full enrichment)
   *
   * Use this when you only need race detection without other calculations.
   *
   * @param activities - Activities to analyze
   * @param config - Race detection configuration (filters, patterns)
   * @returns Detected race highlights
   *
   * @example
   * ```typescript
   * const races = ActivityService.getRaceHighlights(activities, {
   *   titleIgnorePatterns: settings.titleIgnorePatterns,
   *   activityFilters: settings.activityFilters,
   * });
   * ```
   */
  static getRaceHighlights(activities: Activity[], config: RaceDetectionConfig): RaceHighlight[] {
    return detectRaceHighlights(activities, config);
  }

  /**
   * Filter activities for statistics or highlights
   *
   * @param activities - Activities to filter
   * @param settings - Settings containing filter rules
   * @param target - Whether filtering for 'stats' or 'highlights'
   * @returns Filtered activities
   *
   * @example
   * ```typescript
   * const statsActivities = ActivityService.filterActivities(
   *   activities,
   *   settings,
   *   'stats'
   * );
   * ```
   */
  static filterActivities(
    activities: Activity[],
    settings: YearInReviewSettings,
    target: 'highlights' | 'stats' = 'highlights'
  ): Activity[] {
    return filterActivities(activities, settings, target);
  }

  /**
   * Calculate year statistics for filtered activities
   *
   * @param activities - Activities to aggregate (should already be filtered)
   * @param year - Year for statistics calculation
   * @returns Year statistics
   *
   * @example
   * ```typescript
   * const stats = ActivityService.calculateYearStats(
   *   filteredActivities,
   *   2024
   * );
   * ```
   */
  static calculateYearStats(activities: Activity[], year: number): YearStats {
    return aggregateYearStats(activities, year);
  }

  // ========================================================================
  // FUTURE FEATURES (Phase 2)
  // These methods are placeholders for future enhancements
  // ========================================================================

  /**
   * Detect multi-sport events beyond triathlons
   *
   * Future implementation to detect:
   * - Duathlons (run + bike + run)
   * - Aquathlons (swim + run)
   * - Winter triathlons (ski + bike + run)
   *
   * @param activities - Activities to analyze
   * @returns Detected multi-sport events
   *
   * @future Phase 2
   */
  static detectMultiSportEvents(activities: Activity[]): MultiSportEvent[] {
    // Placeholder for future implementation
    void activities;
    return [];
  }

  /**
   * Get personal records for a sport
   *
   * Future implementation to find PRs for standard distances:
   * - Running: 5K, 10K, Half Marathon, Marathon
   * - Cycling: 40K, 100K, 200K
   * - Swimming: 500m, 1K, 2K
   *
   * @param activities - Activities to analyze
   * @param sport - Sport type to analyze
   * @returns Personal records
   *
   * @future Phase 2
   */
  static getPersonalRecords(
    activities: Activity[],
    sport: 'Run' | 'Ride' | 'Swim'
  ): PersonalRecord[] {
    // Placeholder for future implementation
    void activities;
    void sport;
    return [];
  }

  /**
   * Calculate training load and fitness trends
   *
   * Future implementation for:
   * - Weekly/monthly training load
   * - Fitness/fatigue/form calculation
   * - Training stress scores
   *
   * @param activities - Activities to analyze
   * @returns Training load metrics
   *
   * @future Phase 2
   */
  static calculateTrainingLoad(activities: Activity[]): TrainingLoadMetrics {
    // Placeholder for future implementation
    void activities;
    return {
      weeklyLoad: 0,
      monthlyLoad: 0,
      fitness: 0,
      fatigue: 0,
      form: 0,
    };
  }
}

// ========================================================================
// TYPE DEFINITIONS FOR FUTURE FEATURES
// ========================================================================

/**
 * Multi-sport event (duathlon, aquathlon, etc.)
 * @future Phase 2
 */
export interface MultiSportEvent {
  date: Date;
  activities: Activity[];
  totalDistance: number;
  totalTime: number;
  type: 'duathlon' | 'aquathlon' | 'winter-triathlon' | 'other';
}

/**
 * Personal record for a distance
 * @future Phase 2
 */
export interface PersonalRecord {
  distance: string; // e.g., "5K", "Half Marathon"
  activity: Activity;
  time: number; // in minutes
  pace?: number; // min/km for running
  speed?: number; // km/h for cycling
  date: Date;
}

/**
 * Training load metrics
 * @future Phase 2
 */
export interface TrainingLoadMetrics {
  weeklyLoad: number;
  monthlyLoad: number;
  fitness: number; // Chronic Training Load (CTL)
  fatigue: number; // Acute Training Load (ATL)
  form: number; // Training Stress Balance (TSB)
}
