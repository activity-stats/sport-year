import { useState } from 'react';
import { useSettingsStore, type SportBreakdownActivity } from '../../stores/settingsStore';

interface SportBreakdownSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SportBreakdownSettings({ isOpen, onClose }: SportBreakdownSettingsProps) {
  const { sportBreakdown, toggleSportActivity, reorderSportActivities, resetSportBreakdown } =
    useSettingsStore();

  const [localActivities, setLocalActivities] = useState(sportBreakdown.activities);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Sync with store when opened
  useState(() => {
    setLocalActivities([...sportBreakdown.activities].sort((a, b) => a.order - b.order));
  });

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newActivities = [...localActivities];
    const draggedItem = newActivities[draggedIndex];
    newActivities.splice(draggedIndex, 1);
    newActivities.splice(index, 0, draggedItem);

    setLocalActivities(newActivities);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleToggle = (id: string) => {
    setLocalActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const handleSave = () => {
    reorderSportActivities(localActivities);
    localActivities.forEach((activity) => {
      const original = sportBreakdown.activities.find((a) => a.id === activity.id);
      if (original && original.enabled !== activity.enabled) {
        toggleSportActivity(activity.id);
      }
    });
    onClose();
  };

  const handleReset = () => {
    if (confirm('Reset Sport Breakdown to default settings?')) {
      resetSportBreakdown();
      setLocalActivities([...defaultActivities].sort((a, b) => a.order - b.order));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black">Sport Breakdown Settings</h2>
              <p className="text-sm text-white/80 mt-1">
                Customize which activities appear in detailed view
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-white/80 text-3xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> These settings only affect the "Sport Breakdown" section in
                detailed view. Overall stats and charts remain unchanged.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Activities</h3>
              <p className="text-sm text-gray-600 mb-4">
                Drag to reorder, toggle to enable/disable. Disabled activities are hidden from Sport
                Breakdown.
              </p>

              <div className="space-y-2">
                {localActivities.map((activity, index) => (
                  <div
                    key={activity.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all cursor-move ${
                      activity.enabled
                        ? 'border-gray-200 bg-white hover:border-blue-300'
                        : 'border-gray-100 bg-gray-50 opacity-60'
                    } ${draggedIndex === index ? 'opacity-50' : ''}`}
                  >
                    {/* Drag Handle */}
                    <div className="text-gray-400 text-xl">⋮⋮</div>

                    {/* Icon */}
                    <div className="text-3xl">{activity.icon}</div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{activity.label}</div>
                      <div className="text-xs text-gray-500">
                        {activity.stravaTypes.join(', ')}
                        {activity.specialType && (
                          <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold">
                            {activity.specialType === 'triathlon' ? 'SPECIAL' : 'BIKE SPLIT'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(activity.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        activity.enabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          activity.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <p className="text-sm text-yellow-900">
                <strong>Bike Categories:</strong> Enable "Cycling (All)" OR the specific
                outdoor/virtual splits, not both. Triathlon is a special view combining Swim, Bike,
                and Run activities by detection patterns.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-6 flex justify-between items-center">
          <button
            onClick={handleReset}
            className="text-red-600 hover:text-red-700 font-bold text-sm"
          >
            Reset to Default
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:text-gray-900 font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Default for reset button reference
const defaultActivities: SportBreakdownActivity[] = [
  {
    id: 'cycling-all',
    label: 'Cycling (All)',
    icon: '🚴',
    gradient: 'from-blue-500 to-cyan-500',
    stravaTypes: ['Ride', 'VirtualRide'],
    enabled: true,
    order: 0,
    includeInStats: true,
    includeInHighlights: true,
    specialType: 'bike-category',
  },
  {
    id: 'running',
    label: 'Running',
    icon: '🏃',
    gradient: 'from-orange-500 to-red-500',
    stravaTypes: ['Run'],
    enabled: true,
    order: 1,
    includeInStats: true,
    includeInHighlights: true,
  },
  {
    id: 'swimming',
    label: 'Swimming',
    icon: '🏊',
    gradient: 'from-teal-500 to-blue-500',
    stravaTypes: ['Swim'],
    enabled: true,
    order: 2,
    includeInStats: true,
    includeInHighlights: true,
  },
];
