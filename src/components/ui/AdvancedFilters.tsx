import { useState, useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import type { ActivityType } from '../../types';
import type { DistanceFilter } from '../../stores/settingsStore';

interface AdvancedFiltersProps {
  availableActivityTypes: ActivityType[];
}

// Default distance filters that can be enabled/disabled
const DEFAULT_FILTERS: Partial<
  Record<ActivityType, Array<{ name: string; operator: '±'; value: number }>>
> = {
  Run: [
    { name: '5km', operator: '±', value: 5 },
    { name: '10km', operator: '±', value: 10 },
    { name: '15km', operator: '±', value: 15 },
    { name: 'Half Marathon', operator: '±', value: 21 },
    { name: 'Marathon', operator: '±', value: 42 },
  ],
  Ride: [
    { name: '40km', operator: '±', value: 40 },
    { name: '50km', operator: '±', value: 50 },
    { name: '90km', operator: '±', value: 90 },
    { name: '100km', operator: '±', value: 100 },
    { name: '150km', operator: '±', value: 150 },
    { name: '200km', operator: '±', value: 200 },
  ],
  VirtualRide: [
    { name: '40km', operator: '±', value: 40 },
    { name: '50km', operator: '±', value: 50 },
    { name: '90km', operator: '±', value: 90 },
    { name: '100km', operator: '±', value: 100 },
    { name: '150km', operator: '±', value: 150 },
    { name: '200km', operator: '±', value: 200 },
  ],
  Swim: [
    { name: '500m', operator: '±', value: 0.5 },
    { name: '1000m', operator: '±', value: 1 },
    { name: '1500m', operator: '±', value: 1.5 },
    { name: '2000m', operator: '±', value: 2 },
  ],
};

export function AdvancedFilters({ availableActivityTypes }: AdvancedFiltersProps) {
  const {
    yearInReview,
    addActivityFilter,
    removeActivityFilter,
    addDistanceFilter,
    removeDistanceFilter,
    addTitleFilter,
    removeTitleFilter,
    addIgnorePattern,
    updateIgnorePattern,
    removeIgnorePattern,
    initializeDefaultFilters,
  } = useSettingsStore();

  // Initialize default filters on first mount if none exist
  useEffect(() => {
    initializeDefaultFilters();
  }, [initializeDefaultFilters]);

  const [selectedActivityType, setSelectedActivityType] = useState<ActivityType | null>(null);
  const [distanceValue, setDistanceValue] = useState('');
  const [distanceOperator, setDistanceOperator] = useState<
    'gt' | 'lt' | 'eq' | 'gte' | 'lte' | '±' | '='
  >('±');
  const [titlePattern, setTitlePattern] = useState('');

  const getActivityIcon = (type: ActivityType): string => {
    const icons: Record<string, string> = {
      Run: '🏃',
      Ride: '🚴',
      VirtualRide: '🚴‍♂️',
      Swim: '🏊',
      Walk: '🚶',
      Hike: '🥾',
    };
    return icons[type] || '🏃';
  };

  const getOperatorLabel = (op: string): string => {
    const labels: Record<string, string> = {
      gt: '>',
      gte: '≥',
      lt: '<',
      lte: '≤',
      eq: '= (±10%)',
      '±': '± (±5%)',
      '=': '= (±0.1km)',
    };
    return labels[op] || op;
  };

  const handleAddDistanceFilter = () => {
    if (!selectedActivityType || !distanceValue) return;

    const filter: DistanceFilter = {
      id: `${Date.now()}-${Math.random()}`,
      operator: distanceOperator,
      value: parseFloat(distanceValue),
      unit: 'km',
    };

    addDistanceFilter(selectedActivityType, filter);
    setDistanceValue('');
  };

  const handleAddTitleFilter = () => {
    if (!selectedActivityType || !titlePattern.trim()) return;
    addTitleFilter(selectedActivityType, titlePattern.trim());
    setTitlePattern('');
  };

  const handleToggleDefaultFilter = (
    activityType: ActivityType,
    defaultFilter: NonNullable<typeof DEFAULT_FILTERS.Run>[0]
  ) => {
    const existingFilter = yearInReview.activityFilters.find(
      (f) => f.activityType === activityType
    );

    if (!existingFilter) {
      // Create activity filter if it doesn't exist
      addActivityFilter(activityType);
    }

    // Check if this default filter already exists
    const currentFilters = existingFilter?.distanceFilters || [];
    const exists = currentFilters.some(
      (f) => f.operator === defaultFilter.operator && f.value === defaultFilter.value
    );

    if (exists) {
      // Remove the filter
      const filterToRemove = currentFilters.find(
        (f) => f.operator === defaultFilter.operator && f.value === defaultFilter.value
      );
      if (filterToRemove) {
        removeDistanceFilter(activityType, filterToRemove.id);
      }
    } else {
      // Add the filter
      const filter: DistanceFilter = {
        id: `default-${activityType}-${defaultFilter.value}`,
        operator: defaultFilter.operator,
        value: defaultFilter.value,
        unit: 'km',
      };
      addDistanceFilter(activityType, filter);
    }
  };

  const isDefaultFilterActive = (
    activityType: ActivityType,
    defaultFilter: NonNullable<typeof DEFAULT_FILTERS.Run>[0]
  ) => {
    const existingFilter = yearInReview.activityFilters.find(
      (f) => f.activityType === activityType
    );
    if (!existingFilter) return false;

    return existingFilter.distanceFilters.some(
      (f) => f.operator === defaultFilter.operator && f.value === defaultFilter.value
    );
  };

  const activeFilters = yearInReview.activityFilters;

  // Get activity types with default filters
  const activityTypesWithDefaults = availableActivityTypes.filter(
    (type) => (DEFAULT_FILTERS[type] || []).length > 0
  );

  return (
    <div className="space-y-6">
      {/* Help Text */}
      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-700/50">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>Distance Filters:</strong> Enable pre-configured filters (5km, 10km, Marathon,
          etc.) or add custom ones. Each filter shows your <strong>fastest activity</strong> within
          ±5% of the target distance. If multiple activities have the same pace, the closest
          distance match is selected.
        </p>
      </div>

      {/* Activity Type Sections */}
      {activityTypesWithDefaults.map((activityType) => {
        const defaults = DEFAULT_FILTERS[activityType] || [];
        const existingFilter = activeFilters.find((f) => f.activityType === activityType);
        const hasAnyActiveFilters =
          existingFilter &&
          (existingFilter.distanceFilters.length > 0 || existingFilter.titlePatterns.length > 0);
        const isExpanded = selectedActivityType === activityType;

        return (
          <div
            key={activityType}
            className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-750 p-4 border-b-2 border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getActivityIcon(activityType)}</span>
                  <h4 className="text-lg font-black text-gray-900 dark:text-white">
                    {activityType}
                  </h4>
                  {hasAnyActiveFilters && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200 rounded-full text-xs font-bold border border-blue-300 dark:border-blue-700">
                      {existingFilter.distanceFilters.length + existingFilter.titlePatterns.length}{' '}
                      active
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedActivityType(isExpanded ? null : activityType)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold text-sm px-3 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                >
                  {isExpanded ? '▲ Collapse' : '▼ Expand'}
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="p-4 space-y-4">
                {/* Default Distance Filters */}
                {defaults.length > 0 && (
                  <div>
                    <h5 className="font-bold text-gray-900 dark:text-white text-sm mb-3">
                      Standard Distances
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {defaults.map((defaultFilter) => {
                        const isActive = isDefaultFilterActive(activityType, defaultFilter);
                        return (
                          <button
                            key={defaultFilter.name}
                            onClick={() => handleToggleDefaultFilter(activityType, defaultFilter)}
                            className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
                              isActive
                                ? 'bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-200 border-2 border-green-500 dark:border-green-600'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                            }`}
                          >
                            {defaultFilter.name}
                            {isActive && ' ✓'}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                      Click to enable/disable standard distance filters
                    </p>
                  </div>
                )}

                {/* Custom Distance Filters */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-bold text-gray-900 dark:text-white text-sm">
                      Custom Distances
                    </h5>
                  </div>

                  {/* Add Custom Distance Filter Form */}
                  <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700/50">
                    <div className="flex gap-2">
                      <select
                        value={distanceOperator}
                        onChange={(e) =>
                          setDistanceOperator(
                            e.target.value as 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | '±' | '='
                          )
                        }
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="±">± Best match (±5%)</option>
                        <option value="=">= Exact (±0.1km)</option>
                        <option value="eq">≈ About (±10%)</option>
                        <option value="gte">≥ At least</option>
                        <option value="lte">≤ At most</option>
                        <option value="gt">&gt; Greater than</option>
                        <option value="lt">&lt; Less than</option>
                      </select>
                      <input
                        type="number"
                        step="0.1"
                        value={distanceValue}
                        onChange={(e) => setDistanceValue(e.target.value)}
                        placeholder="Distance"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                      />
                      <span className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-bold text-gray-700 dark:text-gray-300 text-sm">
                        km
                      </span>
                      <button
                        onClick={handleAddDistanceFilter}
                        disabled={!distanceValue}
                        className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Custom Distance Filter Tags */}
                  {existingFilter && existingFilter.distanceFilters.length > 0 ? (
                    <div>
                      <div className="flex flex-wrap gap-2">
                        {existingFilter.distanceFilters.map((df) => {
                          // Check if this is a default filter
                          const isDefault = defaults.some(
                            (def) => def.operator === df.operator && def.value === df.value
                          );
                          if (isDefault) return null; // Don't show defaults here

                          return (
                            <div
                              key={df.id}
                              className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 rounded-full text-sm font-bold border-2 border-blue-500 dark:border-blue-600"
                            >
                              <span>
                                {getOperatorLabel(df.operator)} {df.value} {df.unit}
                              </span>
                              <button
                                onClick={() => removeDistanceFilter(activityType, df.id)}
                                className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      No custom filters added
                    </p>
                  )}
                </div>

                {/* Title Filters */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-bold text-gray-900 dark:text-white text-sm">
                      Title Filters
                    </h5>
                  </div>

                  {/* Add Title Filter Form */}
                  <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-700/50">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={titlePattern}
                        onChange={(e) => setTitlePattern(e.target.value)}
                        placeholder="Title contains... (e.g., 'race', 'marathon')"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTitleFilter()}
                      />
                      <button
                        onClick={handleAddTitleFilter}
                        disabled={!titlePattern.trim()}
                        className="px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Title Filter Tags */}
                  {existingFilter && existingFilter.titlePatterns.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {existingFilter.titlePatterns.map((pattern) => (
                        <div
                          key={pattern}
                          className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200 rounded-full text-sm font-bold border border-purple-300 dark:border-purple-700"
                        >
                          <span>"{pattern}"</span>
                          <button
                            onClick={() => removeTitleFilter(activityType, pattern)}
                            className="text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      No title filters
                    </p>
                  )}
                </div>

                {/* Clear all button */}
                {existingFilter &&
                  (existingFilter.distanceFilters.length > 0 ||
                    existingFilter.titlePatterns.length > 0) && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => removeActivityFilter(activityType)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-bold text-sm px-3 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      >
                        Clear All Filters for {activityType}
                      </button>
                    </div>
                  )}
              </div>
            )}
          </div>
        );
      })}

      {/* Global Title Patterns */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 rounded-xl p-6 border-2 border-gray-300 dark:border-gray-700">
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-3">
            Global Title Patterns
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Exclude activities with titles containing these patterns (case-insensitive, partial
            match).
            <br />
            <span className="text-orange-600 dark:text-orange-400 font-semibold">
              Example: "Zwemles" matches "Zwemles #1", "Morning Zwemles", etc.
            </span>
          </p>

          {/* Add new pattern input */}
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={titlePattern}
              onChange={(e) => setTitlePattern(e.target.value)}
              placeholder="e.g., Lunch Ride, Recovery"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400"
            />
            <button
              onClick={() => {
                if (titlePattern.trim()) {
                  addIgnorePattern(titlePattern.trim());
                  setTitlePattern('');
                }
              }}
              className="px-4 py-2 bg-orange-600 dark:bg-orange-500 hover:bg-orange-700 dark:hover:bg-orange-600 text-white text-sm font-bold rounded-lg transition-colors"
            >
              Add
            </button>
          </div>

          {yearInReview.titleIgnorePatterns.length > 0 ? (
            <div className="space-y-2">
              {yearInReview.titleIgnorePatterns.map((patternObj) => (
                <div
                  key={patternObj.pattern}
                  className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      "{patternObj.pattern}"
                    </span>
                    <button
                      onClick={() => removeIgnorePattern(patternObj.pattern)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs font-bold"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={patternObj.excludeFromHighlights}
                        onChange={() =>
                          updateIgnorePattern(patternObj.pattern, {
                            excludeFromHighlights: !patternObj.excludeFromHighlights,
                          })
                        }
                        className="w-4 h-4 text-orange-600 dark:text-orange-500 rounded"
                      />
                      <span className="text-gray-700 dark:text-gray-300">
                        Exclude from highlights
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={patternObj.excludeFromStats}
                        onChange={() =>
                          updateIgnorePattern(patternObj.pattern, {
                            excludeFromStats: !patternObj.excludeFromStats,
                          })
                        }
                        className="w-4 h-4 text-red-600 dark:text-red-500 rounded"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Exclude from stats</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-3">
              No global title patterns configured
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
