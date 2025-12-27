import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../settingsStore';
import type { ActivityType } from '../../types';

describe('settingsStore', () => {
  beforeEach(() => {
    // Reset to initial state before each test
    useSettingsStore.getState().resetYearInReview();
    useSettingsStore.getState().resetSportBreakdown();
  });

  describe('background image', () => {
    it('should set background image URL', () => {
      useSettingsStore.getState().setBackgroundImage('https://example.com/image.jpg');
      expect(useSettingsStore.getState().yearInReview.backgroundImageUrl).toBe(
        'https://example.com/image.jpg'
      );
    });

    it('should clear background image', () => {
      useSettingsStore.getState().setBackgroundImage('https://example.com/image.jpg');
      useSettingsStore.getState().setBackgroundImage(null);
      expect(useSettingsStore.getState().yearInReview.backgroundImageUrl).toBeNull();
    });

    it('should set background image position', () => {
      useSettingsStore.getState().setBackgroundImagePosition({ x: 30, y: 70, scale: 1.5 });
      expect(useSettingsStore.getState().yearInReview.backgroundImagePosition).toEqual({
        x: 30,
        y: 70,
        scale: 1.5,
      });
    });
  });

  describe('activity type exclusions', () => {
    it('should toggle activity type exclusion', () => {
      useSettingsStore.getState().toggleActivityType('Run');
      expect(useSettingsStore.getState().yearInReview.excludedActivityTypes).toContain('Run');

      useSettingsStore.getState().toggleActivityType('Run');
      expect(useSettingsStore.getState().yearInReview.excludedActivityTypes).not.toContain('Run');
    });

    it('should select all activity types', () => {
      useSettingsStore.getState().toggleActivityType('Run');
      useSettingsStore.getState().toggleActivityType('Ride');
      useSettingsStore.getState().selectAllActivityTypes();
      expect(useSettingsStore.getState().yearInReview.excludedActivityTypes).toEqual([]);
    });

    it('should deselect all activity types', () => {
      const types = ['Run', 'Ride', 'Swim'] as const;
      useSettingsStore.getState().deselectAllActivityTypes([...types]);
      expect(useSettingsStore.getState().yearInReview.excludedActivityTypes).toEqual(types);
    });
  });

  describe('virtual activity exclusion', () => {
    it('should toggle exclude virtual for cycling highlights', () => {
      const initialValue =
        useSettingsStore.getState().yearInReview.excludeVirtualPerSport.cycling.highlights;
      useSettingsStore.getState().toggleExcludeVirtual('cycling', 'highlights');
      expect(
        useSettingsStore.getState().yearInReview.excludeVirtualPerSport.cycling.highlights
      ).toBe(!initialValue);
    });

    it('should toggle exclude virtual for running stats', () => {
      const initialValue =
        useSettingsStore.getState().yearInReview.excludeVirtualPerSport.running.stats;
      useSettingsStore.getState().toggleExcludeVirtual('running', 'stats');
      expect(useSettingsStore.getState().yearInReview.excludeVirtualPerSport.running.stats).toBe(
        !initialValue
      );
    });
  });

  describe('ignore patterns', () => {
    it('should add ignore pattern', () => {
      useSettingsStore.getState().addIgnorePattern('test pattern');
      const patterns = useSettingsStore.getState().yearInReview.titleIgnorePatterns;
      expect(patterns).toHaveLength(1);
      expect(patterns[0]).toEqual({
        pattern: 'test pattern',
        excludeFromHighlights: true,
        excludeFromStats: false,
      });
    });

    it('should trim whitespace when adding pattern', () => {
      useSettingsStore.getState().addIgnorePattern('  test  ');
      const patterns = useSettingsStore.getState().yearInReview.titleIgnorePatterns;
      expect(patterns[0].pattern).toBe('test');
    });

    it('should not add duplicate patterns', () => {
      useSettingsStore.getState().addIgnorePattern('test');
      useSettingsStore.getState().addIgnorePattern('test');
      expect(useSettingsStore.getState().yearInReview.titleIgnorePatterns).toHaveLength(1);
    });

    it('should not add empty patterns', () => {
      useSettingsStore.getState().addIgnorePattern('');
      useSettingsStore.getState().addIgnorePattern('   ');
      expect(useSettingsStore.getState().yearInReview.titleIgnorePatterns).toHaveLength(0);
    });

    it('should update ignore pattern', () => {
      useSettingsStore.getState().addIgnorePattern('test');
      useSettingsStore.getState().updateIgnorePattern('test', { excludeFromStats: true });
      const pattern = useSettingsStore.getState().yearInReview.titleIgnorePatterns[0];
      expect(pattern.excludeFromStats).toBe(true);
      expect(pattern.excludeFromHighlights).toBe(true);
    });

    it('should remove ignore pattern', () => {
      useSettingsStore.getState().addIgnorePattern('test');
      useSettingsStore.getState().removeIgnorePattern('test');
      expect(useSettingsStore.getState().yearInReview.titleIgnorePatterns).toHaveLength(0);
    });
  });

  describe('highlight stats', () => {
    it('should toggle highlight stat', () => {
      useSettingsStore.getState().toggleHighlightStat('calories');
      expect(useSettingsStore.getState().yearInReview.highlightStats).toContain('calories');

      useSettingsStore.getState().toggleHighlightStat('calories');
      expect(useSettingsStore.getState().yearInReview.highlightStats).not.toContain('calories');
    });

    it('should set highlight stats', () => {
      useSettingsStore.getState().setHighlightStats(['distance', 'elevation', 'activities']);
      expect(useSettingsStore.getState().yearInReview.highlightStats).toEqual([
        'distance',
        'elevation',
        'activities',
      ]);
    });
  });

  describe('activity type management', () => {
    it('should reorder activity types', () => {
      const newOrder: ActivityType[] = ['Swim', 'Run', 'Ride', 'Walk'];
      useSettingsStore.getState().reorderActivityTypes(newOrder);
      expect(useSettingsStore.getState().yearInReview.activityTypeSettings.order).toEqual(newOrder);
    });

    it('should toggle activity in stats', () => {
      useSettingsStore.getState().toggleActivityInStats('Run');
      expect(
        useSettingsStore.getState().yearInReview.activityTypeSettings.includeInStats
      ).not.toContain('Run');

      useSettingsStore.getState().toggleActivityInStats('Run');
      expect(
        useSettingsStore.getState().yearInReview.activityTypeSettings.includeInStats
      ).toContain('Run');
    });

    it('should toggle activity in highlights', () => {
      useSettingsStore.getState().toggleActivityInHighlights('Ride');
      expect(
        useSettingsStore.getState().yearInReview.activityTypeSettings.includeInHighlights
      ).not.toContain('Ride');

      useSettingsStore.getState().toggleActivityInHighlights('Ride');
      expect(
        useSettingsStore.getState().yearInReview.activityTypeSettings.includeInHighlights
      ).toContain('Ride');
    });
  });

  describe('special options', () => {
    it('should toggle triathlon highlights', () => {
      const initial =
        useSettingsStore.getState().yearInReview.specialOptions.enableTriathlonHighlights;
      useSettingsStore.getState().toggleTriathlonHighlights();
      expect(
        useSettingsStore.getState().yearInReview.specialOptions.enableTriathlonHighlights
      ).toBe(!initial);
    });

    it('should toggle merge cycling', () => {
      const initial = useSettingsStore.getState().yearInReview.specialOptions.mergeCycling;
      useSettingsStore.getState().toggleMergeCycling();
      expect(useSettingsStore.getState().yearInReview.specialOptions.mergeCycling).toBe(!initial);
    });
  });

  describe('activity filters', () => {
    it('should add activity filter', () => {
      useSettingsStore.getState().addActivityFilter('Run');
      const filters = useSettingsStore.getState().yearInReview.activityFilters;
      expect(filters).toHaveLength(1);
      expect(filters[0]).toEqual({
        activityType: 'Run',
        distanceFilters: [],
        titlePatterns: [],
      });
    });

    it('should not add duplicate activity filter', () => {
      useSettingsStore.getState().addActivityFilter('Run');
      useSettingsStore.getState().addActivityFilter('Run');
      expect(useSettingsStore.getState().yearInReview.activityFilters).toHaveLength(1);
    });

    it('should remove activity filter', () => {
      useSettingsStore.getState().addActivityFilter('Run');
      useSettingsStore.getState().removeActivityFilter('Run');
      expect(useSettingsStore.getState().yearInReview.activityFilters).toHaveLength(0);
    });

    it('should add distance filter', () => {
      useSettingsStore.getState().addActivityFilter('Run');
      useSettingsStore.getState().addDistanceFilter('Run', {
        id: 'test-1',
        operator: '±',
        value: 10,
        unit: 'km',
      });
      const filter = useSettingsStore.getState().yearInReview.activityFilters[0];
      expect(filter.distanceFilters).toHaveLength(1);
      expect(filter.distanceFilters[0]).toEqual({
        id: 'test-1',
        operator: '±',
        value: 10,
        unit: 'km',
      });
    });

    it('should remove distance filter', () => {
      useSettingsStore.getState().addActivityFilter('Run');
      useSettingsStore.getState().addDistanceFilter('Run', {
        id: 'test-1',
        operator: '±',
        value: 10,
        unit: 'km',
      });
      useSettingsStore.getState().removeDistanceFilter('Run', 'test-1');
      const filter = useSettingsStore.getState().yearInReview.activityFilters[0];
      expect(filter.distanceFilters).toHaveLength(0);
    });

    it('should add title filter', () => {
      useSettingsStore.getState().addActivityFilter('Run');
      useSettingsStore.getState().addTitleFilter('Run', 'marathon');
      const filter = useSettingsStore.getState().yearInReview.activityFilters[0];
      expect(filter.titlePatterns).toContain('marathon');
    });

    it('should remove title filter', () => {
      useSettingsStore.getState().addActivityFilter('Run');
      useSettingsStore.getState().addTitleFilter('Run', 'marathon');
      useSettingsStore.getState().removeTitleFilter('Run', 'marathon');
      const filter = useSettingsStore.getState().yearInReview.activityFilters[0];
      expect(filter.titlePatterns).not.toContain('marathon');
    });

    it('should initialize default filters', () => {
      useSettingsStore.getState().initializeDefaultFilters();
      const filters = useSettingsStore.getState().yearInReview.activityFilters;
      expect(filters.length).toBeGreaterThan(0);
      expect(filters.find((f) => f.activityType === 'Run')).toBeDefined();
      expect(filters.find((f) => f.activityType === 'Ride')).toBeDefined();
    });

    it('should not initialize default filters if filters exist', () => {
      useSettingsStore.getState().addActivityFilter('Walk');
      useSettingsStore.getState().initializeDefaultFilters();
      const filters = useSettingsStore.getState().yearInReview.activityFilters;
      expect(filters).toHaveLength(1);
      expect(filters[0].activityType).toBe('Walk');
    });
  });

  describe('sport breakdown', () => {
    it('should toggle sport activity', () => {
      const initial = useSettingsStore
        .getState()
        .sportBreakdown.activities.find((a) => a.id === 'cycling-all')?.enabled;
      useSettingsStore.getState().toggleSportActivity('cycling-all');
      const updated = useSettingsStore
        .getState()
        .sportBreakdown.activities.find((a) => a.id === 'cycling-all')?.enabled;
      expect(updated).toBe(!initial);
    });

    it('should reorder sport activities', () => {
      const activities = useSettingsStore.getState().sportBreakdown.activities;
      const reversed = [...activities].reverse();
      useSettingsStore.getState().reorderSportActivities(reversed);
      const reordered = useSettingsStore.getState().sportBreakdown.activities;
      expect(reordered[0].id).toBe(reversed[0].id);
      expect(reordered[0].order).toBe(0);
    });

    it('should toggle sport activity in stats', () => {
      const initial = useSettingsStore
        .getState()
        .sportBreakdown.activities.find((a) => a.id === 'running')?.includeInStats;
      useSettingsStore.getState().toggleSportActivityInStats('running');
      const updated = useSettingsStore
        .getState()
        .sportBreakdown.activities.find((a) => a.id === 'running')?.includeInStats;
      expect(updated).toBe(!initial);
    });

    it('should toggle sport activity in highlights', () => {
      const initial = useSettingsStore
        .getState()
        .sportBreakdown.activities.find((a) => a.id === 'swimming')?.includeInHighlights;
      useSettingsStore.getState().toggleSportActivityInHighlights('swimming');
      const updated = useSettingsStore
        .getState()
        .sportBreakdown.activities.find((a) => a.id === 'swimming')?.includeInHighlights;
      expect(updated).toBe(!initial);
    });

    it('should reset sport breakdown', () => {
      useSettingsStore.getState().toggleSportActivity('cycling-all');
      useSettingsStore.getState().resetSportBreakdown();
      const activities = useSettingsStore.getState().sportBreakdown.activities;
      expect(activities.find((a) => a.id === 'cycling-all')?.enabled).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset year in review to defaults', () => {
      useSettingsStore.getState().setBackgroundImage('https://example.com/image.jpg');
      useSettingsStore.getState().toggleActivityType('Run');
      useSettingsStore.getState().addIgnorePattern('test');

      useSettingsStore.getState().resetYearInReview();

      const state = useSettingsStore.getState().yearInReview;
      expect(state.backgroundImageUrl).toBeNull();
      expect(state.excludedActivityTypes).toEqual([]);
      expect(state.titleIgnorePatterns).toEqual([]);
    });
  });
});
