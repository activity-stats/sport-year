import { useState, useRef } from 'react';
import { useSettingsStore, AVAILABLE_STATS, type StatType } from '../../stores/settingsStore';
import type { ActivityType } from '../../types';

interface YearInReviewSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  availableActivityTypes: ActivityType[];
}

export function YearInReviewSettings({
  isOpen,
  onClose,
  availableActivityTypes,
}: YearInReviewSettingsProps) {
  const [activeTab, setActiveTab] = useState<'background' | 'types' | 'filters' | 'stats'>(
    'background'
  );
  const [imageUrl, setImageUrl] = useState('');
  const [newPattern, setNewPattern] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isClickingRef = useRef(false);

  const {
    yearInReview,
    setBackgroundImage,
    toggleActivityType,
    selectAllActivityTypes,
    deselectAllActivityTypes,
    toggleExcludeVirtual,
    addIgnorePattern,
    updateIgnorePattern,
    removeIgnorePattern,
    toggleHighlightStat,
    resetYearInReview,
  } = useSettingsStore();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      alert('Image size must be less than 5MB');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setBackgroundImage(result);
      setImageUrl('');
      // Reset file input to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      alert('Failed to read file. Please try again.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSetImageUrl = () => {
    if (imageUrl.trim()) {
      setBackgroundImage(imageUrl.trim());
      setImageUrl('');
    }
  };

  const handleRemoveBackground = () => {
    setBackgroundImage(null);
    setImageUrl('');
  };

  const handleAddPattern = () => {
    if (newPattern.trim()) {
      addIgnorePattern(newPattern.trim());
      setNewPattern('');
    }
  };

  const handleSelectAll = () => {
    selectAllActivityTypes();
  };

  const handleDeselectAll = () => {
    deselectAllActivityTypes(availableActivityTypes);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black mb-1">Year in Review Settings</h2>
              <p className="text-white/80 text-sm">Customize your year-end presentation</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-3xl leading-none transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex">
            <button
              onClick={() => setActiveTab('background')}
              className={`flex-1 px-6 py-4 font-bold text-sm uppercase tracking-wider transition-colors ${
                activeTab === 'background'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🖼️ Background
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 px-6 py-4 font-bold text-sm uppercase tracking-wider transition-colors ${
                activeTab === 'stats'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Stats
            </button>
            <button
              onClick={() => setActiveTab('types')}
              className={`flex-1 px-6 py-4 font-bold text-sm uppercase tracking-wider transition-colors ${
                activeTab === 'types'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🎯 Activities
            </button>
            <button
              onClick={() => setActiveTab('filters')}
              className={`flex-1 px-6 py-4 font-bold text-sm uppercase tracking-wider transition-colors ${
                activeTab === 'filters'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🔍 Filters
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Background Tab */}
          {activeTab === 'background' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black text-gray-900 mb-3">Hero Background Image</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload a custom background image or provide a URL. Maximum file size: 5MB.
                </p>

                {yearInReview.backgroundImageUrl && (
                  <div className="mb-4 relative rounded-xl overflow-hidden border-2 border-gray-200">
                    <img
                      src={yearInReview.backgroundImageUrl}
                      alt="Background preview"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                      <span className="text-white font-bold text-sm">Current Background</span>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (isClickingRef.current) return;
                      isClickingRef.current = true;
                      fileInputRef.current?.click();
                      setTimeout(() => {
                        isClickingRef.current = false;
                      }, 500);
                    }}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
                  >
                    📤 Upload Image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Or enter image URL..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleSetImageUrl}
                      disabled={!imageUrl.trim()}
                      className="bg-blue-500 text-white font-bold px-6 py-2 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Set
                    </button>
                  </div>

                  {yearInReview.backgroundImageUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveBackground}
                      className="w-full bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-300 transition-colors"
                    >
                      🔄 Restore Chart Background
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black text-gray-900 mb-3">
                  Year Highlights Statistics
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choose which stats to display in your Year in Review hero section. Select up to 6
                  stats for the best presentation.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(Object.keys(AVAILABLE_STATS) as StatType[]).map((statId) => {
                    const stat = AVAILABLE_STATS[statId];
                    const isEnabled = (yearInReview.highlightStats || ['hours', 'daysActive', 'distance', 'elevation']).includes(statId);
                    return (
                      <label
                        key={statId}
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isEnabled ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => toggleHighlightStat(statId)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-sm text-gray-900">{stat.label}</div>
                          <div className="text-xs text-gray-600 mt-1">{stat.description}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <p className="text-sm text-yellow-900">
                    <strong>Note:</strong> Some stats like "Avg Heart Rate" or "Biggest Climb" will
                    only show if you have activities with that data. Selected:{' '}
                    <strong>{(yearInReview.highlightStats || ['hours', 'daysActive', 'distance', 'elevation']).length}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Activity Types Tab */}
          {activeTab === 'types' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black text-gray-900 mb-3">Include Activity Types</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select which activity types to include in your Year in Review.
                </p>

                <div className="flex gap-2 mb-4">
                  <button
                    onClick={handleSelectAll}
                    className="bg-green-500 text-white font-bold py-2 px-4 rounded-xl hover:bg-green-600 transition-colors text-sm"
                  >
                    ✓ Select All
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="bg-red-500 text-white font-bold py-2 px-4 rounded-xl hover:bg-red-600 transition-colors text-sm"
                  >
                    ✗ Deselect All
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {availableActivityTypes.map((type) => {
                    const isIncluded = !yearInReview.excludedActivityTypes.includes(type);
                    return (
                      <label
                        key={type}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          isIncluded ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isIncluded}
                          onChange={() => toggleActivityType(type)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="font-semibold text-sm text-gray-900">{type}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Filters Tab */}
          {activeTab === 'filters' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black text-gray-900 mb-3">Virtual Activities</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Control how virtual activities are excluded per sport.
                </p>

                <div className="space-y-4">
                  {(['cycling', 'running', 'swimming'] as const).map((sport) => (
                    <div key={sport} className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50">
                      <div className="font-bold text-gray-900 capitalize mb-3 flex items-center gap-2">
                        <span>
                          {sport === 'cycling'
                            ? '🚴 Cycling'
                            : sport === 'running'
                              ? '🏃 Running'
                              : '🏊 Swimming'}
                        </span>
                      </div>
                      <div className="space-y-2 ml-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={yearInReview.excludeVirtualPerSport[sport].highlights}
                            onChange={() => toggleExcludeVirtual(sport, 'highlights')}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            Exclude from highlight cards
                          </span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={yearInReview.excludeVirtualPerSport[sport].stats}
                            onChange={() => toggleExcludeVirtual(sport, 'stats')}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Exclude from all stats</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-black text-gray-900 mb-3">Filter by Title</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Exclude activities with specific text in their title (case-insensitive).
                </p>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newPattern}
                    onChange={(e) => setNewPattern(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddPattern()}
                    placeholder="e.g., 'lunch', 'test', 'warmup'..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddPattern}
                    disabled={!newPattern.trim()}
                    className="bg-blue-500 text-white font-bold px-6 py-2 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>

                {yearInReview.titleIgnorePatterns.length > 0 && (
                  <div className="space-y-3">
                    {yearInReview.titleIgnorePatterns.map((patternObj) => (
                      <div
                        key={patternObj.pattern}
                        className="p-4 bg-red-50 border-2 border-red-200 rounded-xl"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold text-gray-900">
                            "{patternObj.pattern}"
                          </span>
                          <button
                            type="button"
                            onClick={() => removeIgnorePattern(patternObj.pattern)}
                            className="text-red-600 hover:text-red-700 font-bold text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="space-y-2 ml-2">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={patternObj.excludeFromHighlights}
                              onChange={() =>
                                updateIgnorePattern(patternObj.pattern, {
                                  excludeFromHighlights: !patternObj.excludeFromHighlights,
                                })
                              }
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              Exclude from highlight cards
                            </span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={patternObj.excludeFromStats}
                              onChange={() =>
                                updateIgnorePattern(patternObj.pattern, {
                                  excludeFromStats: !patternObj.excludeFromStats,
                                })
                              }
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Exclude from all stats</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-6 flex justify-between items-center">
          <button
            onClick={resetYearInReview}
            className="text-red-600 hover:text-red-700 font-bold text-sm"
          >
            Reset All Settings
          </button>
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3 px-8 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
