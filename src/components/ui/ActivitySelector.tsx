import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Activity } from '../../types';
import type { RaceHighlight } from '../../utils/raceDetection';
import { formatDistanceWithUnit, formatDuration } from '../../utils/formatters';

type SelectableItem = Activity | RaceHighlight;

interface ActivitySelectorProps {
  activities: Activity[];
  highlightActivities: Activity[];
  highlights: RaceHighlight[];
  initialSelectedActivities?: Activity[];
  initialSelectedHighlights?: RaceHighlight[];
  onConfirm: (selectedActivities: Activity[], selectedHighlights: RaceHighlight[]) => void;
  onBack?: () => void;
  onClose: () => void;
}

function isRaceHighlight(item: SelectableItem): item is RaceHighlight {
  return 'badge' in item && 'activities' in item;
}

export function ActivitySelector({
  activities,
  highlightActivities,
  highlights,
  initialSelectedActivities,
  initialSelectedHighlights,
  onConfirm,
  onBack,
  onClose,
}: ActivitySelectorProps) {
  const { t } = useTranslation();
  // Combine activities and highlights, pre-select triathlon highlights or use previous selections
  const triathlonHighlights = highlights.filter((h) => h.type === 'triathlon');
  const hasInitialSelection =
    (initialSelectedActivities && initialSelectedActivities.length > 0) ||
    (initialSelectedHighlights && initialSelectedHighlights.length > 0);
  const initialSelectedIds = hasInitialSelection
    ? new Set([
        ...(initialSelectedHighlights || []).map((h) => h.id),
        ...(initialSelectedActivities || []).map((a) => a.id),
      ])
    : new Set([
        ...triathlonHighlights.slice(0, 3).map((h) => h.id),
        ...highlightActivities
          .slice(0, Math.max(0, 3 - triathlonHighlights.length))
          .map((a) => a.id),
      ]);
  const [selected, setSelected] = useState<Set<string>>(initialSelectedIds);
  const [searchQuery, setSearchQuery] = useState('');

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const toggleActivity = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      if (newSelected.size < 3) {
        newSelected.add(id);
      } else {
        alert(t('errors.maxItemsReached'));
      }
    }
    setSelected(newSelected);
  };

  const handleConfirm = () => {
    // Separate triathlons from regular activities
    const selectedTriathlons: RaceHighlight[] = [];
    const selectedRegularActivities: Activity[] = [];

    selected.forEach((id) => {
      // Check if it's a triathlon highlight
      const triathlon = highlights.find((h) => h.id === id);
      if (triathlon) {
        selectedTriathlons.push(triathlon);
      } else {
        // Regular activity
        const activity = activities.find((a) => a.id === id);
        if (activity) selectedRegularActivities.push(activity);
      }
    });

    // Allow 0 to 3 selections
    onConfirm(selectedRegularActivities, selectedTriathlons);
  };

  // Combine triathlon highlights with regular activities
  const allItems: SelectableItem[] = [...triathlonHighlights, ...activities];

  // Filter by search query
  const filteredItems = allItems.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();

    if (isRaceHighlight(item)) {
      return (
        item.name.toLowerCase().includes(query) ||
        item.badge.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query)
      );
    } else {
      return (
        item.name.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        item.date.toLocaleDateString().toLowerCase().includes(query)
      );
    }
  });

  // Sort: triathlon highlights first, then regular highlights, then by distance
  const highlightIds = new Set([
    ...triathlonHighlights.map((h) => h.id),
    ...highlightActivities.map((a) => a.id),
  ]);
  const sortedItems = [...filteredItems].sort((a, b) => {
    const aIsTriathlon = isRaceHighlight(a) && a.type === 'triathlon';
    const bIsTriathlon = isRaceHighlight(b) && b.type === 'triathlon';
    const aIsHighlight = highlightIds.has(a.id);
    const bIsHighlight = highlightIds.has(b.id);

    if (aIsTriathlon && !bIsTriathlon) return -1;
    if (!aIsTriathlon && bIsTriathlon) return 1;
    if (aIsHighlight && !bIsHighlight) return -1;
    if (!aIsHighlight && bIsHighlight) return 1;

    const aDistance = isRaceHighlight(a) ? a.distance : a.distanceKm;
    const bDistance = isRaceHighlight(b) ? b.distance : b.distanceKm;
    return bDistance - aDistance;
  });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 dark:bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                Select Highlights
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Choose up to 3 activities to feature on your social card
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              🔍
            </span>
          </div>
        </div>

        {/* Activity List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-2">
            {sortedItems.map((item) => {
              const isSelected = selected.has(item.id);
              const isHighlight = highlightIds.has(item.id);
              const isTriathlon = isRaceHighlight(item) && item.type === 'triathlon';

              return (
                <button
                  key={item.id}
                  onClick={() => toggleActivity(item.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900 dark:text-white truncate">
                          {item.name}
                        </span>
                        {isTriathlon && (
                          <span className="flex-shrink-0 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full font-semibold">
                            🏊🚴🏃 Triathlon
                          </span>
                        )}
                        {isHighlight && !isTriathlon && (
                          <span className="flex-shrink-0 text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded-full font-semibold">
                            ⭐ Highlight
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {isRaceHighlight(item) ? (
                          <>
                            {item.badge} • {formatDistanceWithUnit(item.distance * 1000)} •{' '}
                            {formatDuration(item.duration * 60)}
                          </>
                        ) : (
                          <>
                            {item.type} • {formatDistanceWithUnit(item.distanceKm * 1000)} •{' '}
                            {formatDuration(item.movingTimeMinutes * 60)}
                          </>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {item.date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm">
                        ✓
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selected.size} of 3 selected
          </div>
          <div className="flex gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-semibold transition-colors"
              >
                ← Back
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
            >
              Create Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
