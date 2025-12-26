import { useState } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import type { ActivityType } from '../../types';

interface ActivityManagementProps {
  availableActivityTypes: ActivityType[];
}

export function ActivityManagement({ availableActivityTypes }: ActivityManagementProps) {
  const {
    yearInReview,
    reorderActivityTypes,
    toggleActivityInStats,
    toggleActivityInHighlights,
    toggleTriathlonHighlights,
    toggleMergeCycling,
  } = useSettingsStore();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const orderedTypes = yearInReview.activityTypeSettings.order.filter((type) =>
    availableActivityTypes.includes(type)
  );

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...orderedTypes];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);

    reorderActivityTypes(newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

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

  return (
    <div className="space-y-6">
      {/* Special Options */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-700">
        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>⚡</span>
          Special Options
        </h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏊🚴🏃</span>
              <div>
                <div className="font-bold text-gray-900 dark:text-white">
                  Show Triathlon Highlights
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Display triathlon events in the highlights section
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={yearInReview.specialOptions.enableTriathlonHighlights}
              onChange={toggleTriathlonHighlights}
              className="w-6 h-6 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚴</span>
              <div>
                <div className="font-bold text-gray-900 dark:text-white">
                  Merge Cycling Activities
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Combine outdoor rides and virtual rides into one cycling category
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={yearInReview.specialOptions.mergeCycling}
              onChange={toggleMergeCycling}
              className="w-6 h-6 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
            />
          </label>
        </div>
      </div>

      {/* Activity List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-gray-900 dark:text-white">Activity Types</h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Drag to reorder • Toggle to include/exclude
          </div>
        </div>

        <div className="space-y-2">
          {orderedTypes.map((type, index) => {
            const includeInStats = yearInReview.activityTypeSettings.includeInStats.includes(type);
            const includeInHighlights =
              yearInReview.activityTypeSettings.includeInHighlights.includes(type);

            return (
              <div
                key={type}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`group bg-white dark:bg-gray-800 rounded-xl border-2 p-4 transition-all cursor-move ${
                  draggedIndex === index
                    ? 'border-blue-500 dark:border-blue-400 shadow-lg scale-105'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Drag Handle */}
                  <div className="text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 8h16M4 16h16"
                      />
                    </svg>
                  </div>

                  {/* Activity Info */}
                  <div className="flex-1 flex items-center gap-3">
                    <span className="text-3xl">{getActivityIcon(type)}</span>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 dark:text-white">{type}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Position {index + 1} of {orderedTypes.length}
                      </div>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="flex items-center gap-4">
                    <label
                      className="flex flex-col items-center gap-1 cursor-pointer group/toggle"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300 group-hover/toggle:text-blue-600 dark:group-hover/toggle:text-blue-400">
                        Stats
                      </span>
                      <input
                        type="checkbox"
                        checked={includeInStats}
                        onChange={() => toggleActivityInStats(type)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>

                    <label
                      className="flex flex-col items-center gap-1 cursor-pointer group/toggle"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300 group-hover/toggle:text-purple-600 dark:group-hover/toggle:text-purple-400">
                        Highlights
                      </span>
                      <input
                        type="checkbox"
                        checked={includeInHighlights}
                        onChange={() => toggleActivityInHighlights(type)}
                        className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                      />
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {orderedTypes.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg font-bold mb-2">No activities found</p>
            <p className="text-sm">Start tracking activities to see them here</p>
          </div>
        )}
      </div>
    </div>
  );
}
