import { useState } from 'react';
import type { YearStats } from '../../types';
import type { StatOption } from './statsOptions';
import { availableStats } from './statsOptions';

interface StatsSelectorProps {
  stats: YearStats;
  daysActive: number;
  onConfirm: (selectedStats: StatOption[]) => void;
  onClose: () => void;
}

export function StatsSelector({ stats, daysActive, onConfirm, onClose }: StatsSelectorProps) {
  // Default: First 3 stats from StatsOverview (Distance, Elevation, Time)
  const [selected, setSelected] = useState<Set<string>>(new Set(['distance', 'elevation', 'time']));

  const toggleStat = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      if (newSelected.size > 1) {
        // Don't allow deselecting all stats
        newSelected.delete(id);
      } else {
        alert('You must select at least 1 stat');
      }
    } else {
      if (newSelected.size < 4) {
        newSelected.add(id);
      } else {
        alert('You can select up to 4 stats');
      }
    }
    setSelected(newSelected);
  };

  const handleConfirm = () => {
    const selectedStats = availableStats.filter((stat) => selected.has(stat.id));
    onConfirm(selectedStats);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 dark:bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Select Stats</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Choose 1-4 stats to display on your social card
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-3">
            {availableStats.map((stat) => {
              const isSelected = selected.has(stat.id);
              const value = stat.getValue(stats, daysActive);

              return (
                <button
                  key={stat.id}
                  onClick={() => toggleStat(stat.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 dark:bg-gray-900'
                      : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{stat.icon}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{stat.label}</span>
                    {isSelected && (
                      <div className="ml-auto shrink-0 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">
                        ✓
                      </div>
                    )}
                  </div>
                  <div className="text-2xl font-black text-gray-700 dark:text-gray-300 ml-11">
                    {value}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selected.size} of 4 selected • {selected.size < 1 ? 'Select at least 1' : 'Ready'}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selected.size < 1}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next: Select Highlights
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
