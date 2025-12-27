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

  // Format options
  type ExportFormat = 'landscape' | 'opengraph' | 'square';
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('landscape');
  const [imageOpacity, setImageOpacity] = useState(0.6);
  const [textShadow, setTextShadow] = useState(2);

  const formats = {
    landscape: { width: 1920, height: 1080, label: 'Landscape', description: '16:9 format' },
    opengraph: {
      width: 1200,
      height: 630,
      label: 'Open Graph',
      description: 'LinkedIn, Facebook, Twitter',
    },
    square: { width: 1080, height: 1080, label: 'Square', description: 'Instagram, Strava' },
  };

  const currentFormat = formats[selectedFormat];

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
        width: currentFormat.width,
        height: currentFormat.height,
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
        width: currentFormat.width,
        height: currentFormat.height,
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

  // Combine activities and highlights for display, sorted by date oldest first
  const allSelectedItems = [...selectedHighlights, ...selectedActivities]
    .sort((a, b) => {
      const dateA = 'date' in a ? new Date(a.date).getTime() : 0;
      const dateB = 'date' in b ? new Date(b.date).getTime() : 0;
      return dateA - dateB;
    })
    .slice(0, 6);

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
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-h-[95vh] overflow-y-auto"
        style={{ maxWidth: '1296px' }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                Social Media Card
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                💡 Tip: All fields are editable - click to customize titles, distances, times, and
                stats • Current: {currentFormat.width}×{currentFormat.height}px
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Format Selector and Controls */}
          <div className="mt-4 flex gap-4 items-start">
            <div className="flex gap-2">
              {(Object.keys(formats) as ExportFormat[]).map((format) => (
                <button
                  key={format}
                  onClick={() => setSelectedFormat(format)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedFormat === format
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="text-sm font-bold">{formats[format].label}</div>
                  <div className="text-xs opacity-75">
                    {formats[format].width}×{formats[format].height}
                  </div>
                </button>
              ))}
            </div>

            {/* Slider Controls */}
            {backgroundImageUrl && (
              <div className="flex-1 flex flex-col gap-3 min-w-[200px]">
                {/* Transparency Control */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap w-24">
                    Transparency:
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={imageOpacity}
                    onChange={(e) => setImageOpacity(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12 text-right">
                    {Math.round(imageOpacity * 100)}%
                  </span>
                </div>

                {/* Text Shadow Control */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap w-24">
                    Text Shadow:
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={textShadow}
                    onChange={(e) => setTextShadow(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12 text-right">
                    {textShadow}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card Preview */}
        <div className="p-6 flex justify-center items-center overflow-auto">
          <div
            style={{
              width: `${currentFormat.width * 0.5}px`,
              height: `${currentFormat.height * 0.5}px`,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${currentFormat.width}px`,
                height: `${currentFormat.height}px`,
                transform: 'scale(0.5)',
                transformOrigin: 'top left',
              }}
            >
              <div
                ref={cardRef}
                className="bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 rounded-xl overflow-hidden shadow-2xl relative"
                style={{
                  width: `${currentFormat.width}px`,
                  height: `${currentFormat.height}px`,
                  fontSize: '16px',
                }}
              >
                {/* Background Image */}
                {backgroundImageUrl && (
                  <>
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url(${backgroundImageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition:
                          selectedFormat === 'opengraph'
                            ? 'center 40%'
                            : selectedFormat === 'square'
                              ? '70% center'
                              : 'center center',
                      }}
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800"
                      style={{ opacity: imageOpacity }}
                    />
                  </>
                )}

                <div
                  className="absolute inset-0 h-full flex flex-col text-white"
                  style={{ padding: '32px' }}
                >
                  {/* Top row with header and year/activities */}
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', flex: '1 1 auto' }}
                  >
                    {/* Left/Center column */}
                    <div
                      style={{
                        flex: '1 1 auto',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      {/* Header */}
                      <div>
                        <h1
                          className="font-black drop-shadow-lg"
                          style={{
                            fontSize: selectedFormat === 'landscape' ? '67px' : '42px',
                            marginBottom: '4px',
                            textShadow: `0 ${textShadow}px ${textShadow * 4}px rgba(0, 0, 0, 0.8)`,
                          }}
                        >
                          Year in Sports
                        </h1>
                        <p
                          className="font-bold opacity-90 drop-shadow truncate"
                          style={{
                            fontSize: selectedFormat === 'landscape' ? '58px' : '36px',
                            textShadow: `0 ${textShadow}px ${textShadow * 4}px rgba(0, 0, 0, 0.8)`,
                          }}
                        >
                          {athleteName}
                        </p>
                      </div>

                      {/* Left Activities - Only for landscape and opengraph */}
                      {selectedFormat !== 'square' && allSelectedItems.length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            flex: '1 1 auto',
                            justifyContent: 'center',
                            maxWidth: '450px',
                          }}
                        >
                          {allSelectedItems.slice(0, 3).map((item) => {
                            const itemId = item.id;

                            return (
                              <div key={itemId} className="text-left">
                                {/* Line 1: Activity title */}
                                <div
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) =>
                                    updateName(itemId, e.currentTarget.textContent || '')
                                  }
                                  className="font-bold drop-shadow outline-none text-white truncate"
                                  style={{
                                    fontSize: selectedFormat === 'landscape' ? '34px' : '21px',
                                    textShadow: `0 ${textShadow}px ${textShadow * 4}px rgba(0, 0, 0, 0.8)`,
                                  }}
                                >
                                  {editedNames[itemId] || item.name}
                                </div>
                                {/* Line 2: Distance - Time */}
                                <div
                                  className="opacity-90 font-medium flex items-center"
                                  style={{
                                    fontSize: selectedFormat === 'landscape' ? '29px' : '18px',
                                    gap: '6px',
                                    textShadow: `0 ${textShadow}px ${textShadow * 4}px rgba(0, 0, 0, 0.8)`,
                                  }}
                                >
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
                    </div>

                    {/* Right column - Year and Activities */}
                    <div
                      style={{
                        flex: '0 0 auto',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        width: '450px',
                        marginLeft: '24px',
                      }}
                    >
                      {/* Year at top */}
                      <div
                        className="font-black drop-shadow-2xl text-right"
                        style={{
                          fontSize: selectedFormat === 'landscape' ? '134px' : '84px',
                          lineHeight: '1',
                          textShadow: `0 ${textShadow}px ${textShadow * 4}px rgba(0, 0, 0, 0.8)`,
                        }}
                      >
                        {year === 'last365' ? 'Last 365' : year}
                      </div>

                      {/* Right Activities - For square: all items, for landscape/opengraph: second half */}
                      {allSelectedItems.length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            flex: '1 1 auto',
                            justifyContent: 'center',
                          }}
                        >
                          {(selectedFormat === 'square'
                            ? allSelectedItems
                            : allSelectedItems.slice(3)
                          ).map((item) => {
                            const itemId = item.id;

                            return (
                              <div key={itemId} className="text-right">
                                {/* Line 1: Activity title */}
                                <div
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) =>
                                    updateName(itemId, e.currentTarget.textContent || '')
                                  }
                                  className="font-bold drop-shadow outline-none text-white truncate"
                                  style={{
                                    fontSize: selectedFormat === 'landscape' ? '34px' : '21px',
                                    textShadow: `0 ${textShadow}px ${textShadow * 4}px rgba(0, 0, 0, 0.8)`,
                                  }}
                                >
                                  {editedNames[itemId] || item.name}
                                </div>
                                {/* Line 2: Distance - Time */}
                                <div
                                  className="opacity-90 font-medium flex items-center justify-end"
                                  style={{
                                    fontSize: selectedFormat === 'landscape' ? '29px' : '18px',
                                    gap: '6px',
                                    textShadow: `0 ${textShadow}px ${textShadow * 4}px rgba(0, 0, 0, 0.8)`,
                                  }}
                                >
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

                      {/* Spacer at bottom to balance layout */}
                      <div></div>
                    </div>
                  </div>

                  {/* Stats at bottom - full width */}
                  <div
                    className={`grid ${
                      selectedStats.length === 1
                        ? 'grid-cols-1'
                        : selectedStats.length === 2
                          ? 'grid-cols-2'
                          : selectedStats.length === 3
                            ? 'grid-cols-3'
                            : 'grid-cols-4'
                    }`}
                    style={{ gap: '24px', width: '100%' }}
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
                            className="font-black drop-shadow-2xl bg-transparent outline-none text-white text-center w-full placeholder-white/60"
                            style={{
                              fontSize:
                                selectedFormat === 'landscape'
                                  ? selectedStats.length >= 3
                                    ? '77px'
                                    : '102px'
                                  : selectedStats.length >= 3
                                    ? '48px'
                                    : '64px',
                              marginBottom: '8px',
                              textShadow: `0 ${textShadow}px ${textShadow * 4}px rgba(0, 0, 0, 0.8)`,
                            }}
                            placeholder="0"
                          />
                          <div
                            className="font-bold opacity-90 drop-shadow-lg uppercase tracking-wide"
                            style={{
                              fontSize:
                                selectedFormat === 'landscape'
                                  ? selectedStats.length >= 3
                                    ? '27px'
                                    : '32px'
                                  : selectedStats.length >= 3
                                    ? '17px'
                                    : '20px',
                              textShadow: `0 ${textShadow}px ${textShadow * 4}px rgba(0, 0, 0, 0.8)`,
                            }}
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
