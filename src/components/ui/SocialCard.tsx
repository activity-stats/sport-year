import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { domToPng } from 'modern-screenshot';
import type { Activity, YearStats } from '../../types';
import type { StravaAthlete } from '../../types/strava';
import type { RaceHighlight } from '../../utils/raceDetection';
import type { StatOption } from './statsOptions';
import { formatDuration } from '../../utils/formatters';

interface SocialCardProps {
  year: number | 'last365';
  stats: YearStats;
  athlete: StravaAthlete | null;
  daysActive: number;
  selectedActivities: Activity[];
  selectedHighlights: RaceHighlight[];
  selectedStats: StatOption[];
  backgroundImageUrl: string | null;
  onBack?: () => void;
  onClose: () => void;
}

export function SocialCard({
  year,
  stats,
  athlete,
  daysActive,
  selectedActivities,
  selectedHighlights,
  selectedStats,
  backgroundImageUrl,
  onBack,
  onClose,
}: SocialCardProps) {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

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

  // State for edited activity names
  const [editedNames, setEditedNames] = useState<Record<string, string>>(() => {
    const names: Record<string, string> = {};
    selectedHighlights.forEach((h) => (names[h.id] = h.name));
    selectedActivities.forEach((a) => (names[a.id] = a.name));
    return names;
  });

  // State for edited times (as formatted strings for easier editing)
  const [editedTimes, setEditedTimes] = useState<Record<string, string>>(() => {
    const times: Record<string, string> = {};
    selectedHighlights.forEach((h) => {
      const seconds = (h.duration || 0) * 60;
      times[h.id] = formatDuration(seconds);
    });
    selectedActivities.forEach((a) => {
      const seconds = (a.movingTimeMinutes || 0) * 60;
      times[a.id] = formatDuration(seconds);
    });
    return times;
  });

  // State for edited distances (in km)
  const [editedDistances, setEditedDistances] = useState<Record<string, number>>(() => {
    const distances: Record<string, number> = {};
    selectedHighlights.forEach((h) => (distances[h.id] = parseFloat((h.distance || 0).toFixed(2))));
    selectedActivities.forEach(
      (a) => (distances[a.id] = parseFloat((a.distanceKm || 0).toFixed(2)))
    );
    return distances;
  });

  // State for edited stat values
  const [editedStats, setEditedStats] = useState<Record<string, string>>(() => {
    const statValues: Record<string, string> = {};
    selectedStats.forEach((stat) => {
      const value = stat.getValue(stats, daysActive);
      const parts = value.match(/^([\d,.]+)\s*(.*)$/);
      const numericValue = parts ? parts[1] : value;
      statValues[stat.id] = numericValue;
    });
    return statValues;
  });

  const updateName = (id: string, newName: string) => {
    setEditedNames((prev) => ({ ...prev, [id]: newName }));
  };

  const updateTime = (id: string, timeString: string) => {
    setEditedTimes((prev) => ({ ...prev, [id]: timeString }));
  };

  const updateDistance = (id: string, distanceString: string) => {
    const distance = parseFloat((parseFloat(distanceString) || 0).toFixed(2));
    setEditedDistances((prev) => ({ ...prev, [id]: distance }));
  };

  const updateStat = (statId: string, value: string) => {
    setEditedStats((prev) => ({ ...prev, [statId]: value }));
  };

  const handleShare = async () => {
    if (!cardRef.current) {
      alert(t('errors.cardNotFound'));
      return;
    }

    setIsExporting(true);
    try {
      const dataUrl = await domToPng(cardRef.current, {
        quality: 1,
        scale: 2,
      });

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const athleteSlug = athlete
        ? `${athlete.firstname}-${athlete.lastname}`.toLowerCase().replace(/\s+/g, '-')
        : 'athlete';
      const file = new File([blob], `${athleteSlug}-year-in-sports-${year}.png`, {
        type: 'image/png',
      });

      const shareText = t('socialCard.shareText', { year });

      // Check if Web Share API is available (works on mobile and some desktop browsers)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `${year} Year in Sports`,
            text: shareText,
            files: [file],
          });
          console.log('Shared successfully using Web Share API');
          return;
        } catch (err) {
          if ((err as Error & { name: string }).name === 'AbortError') {
            console.log('User cancelled share');
            return;
          }
          console.log('Web Share API failed, falling back:', err);
        }
      }

      // Fallback: copy share text and download image
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      }

      // Download the image
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${athleteSlug}-year-in-sports-${year}.png`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      alert(
        'Image downloaded and share text copied to clipboard! 📋\nPaste it when sharing on Strava or other platforms.'
      );
    } catch (error) {
      console.error('Failed to share:', error);
      alert(t('socialCard.shareFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = async () => {
    if (!cardRef.current) {
      alert(t('errors.cardNotFound'));
      return;
    }

    setIsExporting(true);
    try {
      console.log('Starting card export...');
      const dataUrl = await domToPng(cardRef.current, {
        quality: 1,
        scale: 2,
      });

      console.log('Card exported successfully, creating download...');

      // Create filename with athlete name and year
      const athleteSlug = athlete
        ? `${athlete.firstname}-${athlete.lastname}`.toLowerCase().replace(/\s+/g, '-')
        : 'athlete';
      const filename = `${athleteSlug}-year-in-sports-${year}.png`;

      // Try File System Access API first (Chrome/Edge)
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (
            window as Window & {
              showSaveFilePicker: (options: {
                suggestedName: string;
                types: Array<{ description: string; accept: Record<string, string[]> }>;
              }) => Promise<{
                createWritable: () => Promise<{
                  write: (data: Blob) => Promise<void>;
                  close: () => Promise<void>;
                }>;
              }>;
            }
          ).showSaveFilePicker({
            suggestedName: filename,
            types: [
              {
                description: 'PNG Image',
                accept: { 'image/png': ['.png'] },
              },
            ],
          });

          const writable = await handle.createWritable();
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          await writable.write(blob);
          await writable.close();
          console.log('File saved successfully using File System Access API');
          return;
        } catch (err) {
          if ((err as Error & { name: string }).name === 'AbortError') {
            console.log('User cancelled save dialog');
            return;
          }
          console.log('File System Access API failed, falling back to download link:', err);
        }
      }

      // Fallback: Use traditional download link
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      // Cleanup with delay to ensure download starts
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log('Download triggered successfully');
      }, 100);
    } catch (error) {
      console.error('Failed to export card:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(
        `Failed to export card: ${errorMessage}\n\nPlease check the browser console for more details.`
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Combine activities and highlights for display
  const allSelectedItems = [...selectedHighlights, ...selectedActivities].slice(0, 3);

  // Debug logging
  console.log('Social Card - Selected highlights:', selectedHighlights);
  console.log('Social Card - Selected activities:', selectedActivities);
  console.log(
    'Social Card - Combined items:',
    allSelectedItems.map((item) => {
      const isTriathlon = 'badge' in item && 'activities' in item;
      return {
        id: item.id,
        name: item.name,
        isTriathlon,
        hasActivities: 'activities' in item,
        hasBadge: 'badge' in item,
        distance:
          'distance' in item
            ? (item as { distance: number }).distance
            : 'distanceKm' in item
              ? (item as { distanceKm: number }).distanceKm
              : 'MISSING',
        duration:
          'duration' in item
            ? (item as { duration: number }).duration
            : 'movingTimeMinutes' in item
              ? (item as { movingTimeMinutes: number }).movingTimeMinutes
              : 'MISSING',
        rawItem: item,
      };
    })
  );

  const athleteName = athlete ? `${athlete.firstname} ${athlete.lastname}` : 'Athlete';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 dark:bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                Social Media Card
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                💡 Tip: All fields are editable - click to customize titles, distances, times, and
                stats • 1200x630px
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Card Preview */}
        <div className="p-6">
          <div
            ref={cardRef}
            className="w-full aspect-[1200/630] bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 rounded-xl overflow-hidden shadow-2xl relative"
            style={{ maxWidth: '1200px', margin: '0 auto' }}
          >
            {/* Background Image */}
            {backgroundImageUrl && (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${backgroundImageUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/60 via-indigo-700/60 to-purple-800/60" />
              </>
            )}

            <div className="absolute inset-0 h-full p-8 flex flex-col text-white justify-between">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-4xl font-black mb-1 drop-shadow-lg">Year in Sports</h1>
                  <p className="text-3xl font-bold opacity-90 drop-shadow">{athleteName}</p>
                </div>
                <div className="text-7xl font-black drop-shadow-2xl">
                  {year === 'last365' ? 'Last 365' : year}
                </div>
              </div>

              {/* Bottom section with stats and highlights */}
              <div className="space-y-4">
                {/* Selected Activities - Compact 2-line format */}
                {allSelectedItems.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    {allSelectedItems.map((item) => {
                      const itemId = item.id;

                      return (
                        <div key={itemId} className="text-left">
                          {/* Line 1: Activity title */}
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => updateName(itemId, e.currentTarget.textContent || '')}
                            className="text-base font-bold drop-shadow outline-none text-white truncate"
                          >
                            {editedNames[itemId] || item.name}
                          </div>
                          {/* Line 2: Distance - Time */}
                          <div className="text-sm opacity-90 font-medium flex items-center gap-1.5">
                            <span
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) =>
                                updateDistance(itemId, e.currentTarget.textContent || '0')
                              }
                              className="outline-none text-white"
                            >
                              {(editedDistances[itemId] || 0).toFixed(2)}
                            </span>
                            <span>km</span>
                            <span>-</span>
                            <span
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) =>
                                updateTime(itemId, e.currentTarget.textContent || '0:00')
                              }
                              className="outline-none text-white"
                            >
                              {editedTimes[itemId] || '0:00'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Stats - Dynamic based on selection */}
                <div
                  className={`grid gap-6 ${
                    selectedStats.length === 1
                      ? 'grid-cols-1'
                      : selectedStats.length === 2
                        ? 'grid-cols-2'
                        : selectedStats.length === 3
                          ? 'grid-cols-3'
                          : 'grid-cols-4'
                  }`}
                >
                  {selectedStats.map((stat) => {
                    const value = stat.getValue(stats, daysActive);
                    // Extract numeric value
                    const parts = value.match(/^([\d,.]+)\s*(.*)$/);
                    const displayValue =
                      editedStats[stat.id] !== undefined
                        ? editedStats[stat.id]
                        : parts
                          ? parts[1]
                          : value;

                    return (
                      <div key={stat.id} className="text-center">
                        <input
                          type="text"
                          value={displayValue}
                          onChange={(e) => updateStat(stat.id, e.target.value)}
                          className={`${selectedStats.length === 4 ? 'text-4xl' : 'text-6xl'} font-black mb-3 drop-shadow-2xl bg-transparent outline-none text-white text-center w-full placeholder-white/60`}
                          placeholder="0"
                        />
                        <div
                          className={`${selectedStats.length === 4 ? 'text-base' : 'text-xl'} font-bold opacity-90 drop-shadow-lg uppercase tracking-wide`}
                        >
                          {stat.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedStats.length}{' '}
            {selectedStats.length !== 1 ? t('socialCard.statsPlural') : t('socialCard.stats')} •{' '}
            {allSelectedItems.length === 0
              ? t('socialCard.noHighlights')
              : `${allSelectedItems.length} ${allSelectedItems.length !== 1 ? t('socialCard.highlightsPlural') : t('socialCard.highlight')}`}
          </div>
          <div className="flex gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="px-6 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg font-semibold transition-colors"
              >
                ← Back
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg font-semibold transition-colors"
            >
              {t('socialCard.cancel')}
            </button>
            <button
              onClick={handleShare}
              disabled={isExporting}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-lg hover:from-orange-600 hover:to-red-700 transition-all shadow-lg disabled:opacity-50"
            >
              {isExporting ? t('socialCard.preparing') : t('socialCard.shareButton')}
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50"
            >
              {isExporting ? t('socialCard.exporting') : t('socialCard.downloadButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
