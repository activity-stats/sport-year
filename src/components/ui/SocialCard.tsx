import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { domToPng } from 'modern-screenshot';
import type { Activity, YearStats } from '../../types';
import type { StravaAthlete } from '../../types/strava';
import type { RaceHighlight } from '../../utils/raceDetection';
import type { StatOption } from './statsOptions';
import { formatDuration } from '../../utils/formatters';
import { ImageCropEditor } from './ImageCropEditor';
import type { CropArea } from '../../utils/imageCrop';
import { getCroppedImage, calculateBestFitCrop } from '../../utils/imageCrop';
import { useSettingsStore } from '../../stores/settingsStore';

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
  const { yearInReview, setSocialCardCrop } = useSettingsStore();

  // Format options
  type ExportFormat = 'landscape' | 'opengraph' | 'square';
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('landscape');
  const [imageOpacity, setImageOpacity] = useState(0.6);
  const [textShadow, setTextShadow] = useState(2);
  const [showCropModal, setShowCropModal] = useState(false);
  const [croppedBackgroundUrl, setCroppedBackgroundUrl] = useState<string | null>(null);

  const formats = {
    landscape: {
      width: 1920,
      height: 1080,
      label: 'Landscape',
      description: '16:9 format',
      aspectRatio: 16 / 9,
    },
    opengraph: {
      width: 1200,
      height: 630,
      label: 'Open Graph',
      description: 'LinkedIn, Facebook, Twitter',
      aspectRatio: 1200 / 630,
    },
    square: {
      width: 1080,
      height: 1080,
      label: 'Square',
      description: 'Instagram, Strava',
      aspectRatio: 1,
    },
  };

  const currentFormat = formats[selectedFormat];

  // Generate cropped background image when crop settings or format changes
  useEffect(() => {
    if (!backgroundImageUrl) {
      setCroppedBackgroundUrl(null);
      return;
    }

    const currentCrop = yearInReview.socialCardCrops[selectedFormat];
    let isCancelled = false;

    // If no crop exists yet, calculate and apply default best-fit crop
    if (!currentCrop) {
      const img = new Image();
      img.onload = () => {
        if (isCancelled) return;

        // Calculate best-fit crop for this format's aspect ratio
        const defaultCrop = calculateBestFitCrop(
          img.naturalWidth,
          img.naturalHeight,
          currentFormat.aspectRatio
        );

        // Save the default crop
        setSocialCardCrop(selectedFormat, defaultCrop);

        // Generate preview with default crop
        getCroppedImage(backgroundImageUrl, defaultCrop, currentFormat.width, currentFormat.height)
          .then((result) => {
            if (!isCancelled) {
              setCroppedBackgroundUrl(result.url);
            }
          })
          .catch((error) => {
            console.error('Failed to crop social card image:', error);
            if (!isCancelled) {
              setCroppedBackgroundUrl(null);
            }
          });
      };
      img.src = backgroundImageUrl;
      return () => {
        isCancelled = true;
      };
    }

    // Use existing crop
    getCroppedImage(backgroundImageUrl, currentCrop, currentFormat.width, currentFormat.height)
      .then((result) => {
        if (!isCancelled) {
          setCroppedBackgroundUrl(result.url);
        }
      })
      .catch((error) => {
        console.error('Failed to crop social card image:', error);
        if (!isCancelled) {
          setCroppedBackgroundUrl(null);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [
    backgroundImageUrl,
    selectedFormat,
    yearInReview.socialCardCrops,
    currentFormat.width,
    currentFormat.height,
    currentFormat.aspectRatio,
    setSocialCardCrop,
  ]);

  const handleCropChange = (crop: CropArea) => {
    setSocialCardCrop(selectedFormat, crop);
  };

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
          return;
        } catch (err) {
          if ((err as Error & { name: string }).name === 'AbortError') {
            return;
          }
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
      const dataUrl = await domToPng(cardRef.current, {
        quality: 1,
        width: currentFormat.width,
        height: currentFormat.height,
      });

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
          return;
        } catch (err) {
          if ((err as Error & { name: string }).name === 'AbortError') {
            return;
          }
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

          {/* Format Selector and Crop Button */}
          <div className="mt-3 flex gap-3 items-center justify-center flex-wrap">
            {/* Format Buttons */}
            {(Object.keys(formats) as ExportFormat[]).map((format) => (
              <button
                key={format}
                onClick={() => setSelectedFormat(format)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex-shrink-0 ${
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

            {/* Crop Button */}
            {backgroundImageUrl && (
              <button
                onClick={() => setShowCropModal(true)}
                className="px-4 py-1.5 bg-linear-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md text-sm inline-flex items-center gap-2 flex-shrink-0"
              >
                <span>✂️</span>
                <span>Crop & Adjust</span>
              </button>
            )}
          </div>
        </div>

        {/* Card Preview */}
        <div className="px-6 py-3 flex justify-center items-center overflow-auto">
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
                className="bg-linear-to-br from-blue-600 via-indigo-700 to-purple-800 rounded-xl overflow-hidden shadow-2xl relative"
                style={{
                  width: `${currentFormat.width}px`,
                  height: `${currentFormat.height}px`,
                  fontSize: '16px',
                }}
              >
                {/* Background Image */}
                {croppedBackgroundUrl && (
                  <>
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url(${croppedBackgroundUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center center',
                      }}
                    />
                    <div
                      className="absolute inset-0 bg-linear-to-br from-blue-600 via-indigo-700 to-purple-800"
                      style={{ opacity: imageOpacity }}
                    />
                  </>
                )}

                <div
                  className="absolute inset-0 h-full flex flex-col text-white"
                  style={{ padding: '32px' }}
                >
                  {/* Top row with header and year */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '24px',
                    }}
                  >
                    {/* Header */}
                    <div>
                      <h1
                        className="font-black drop-shadow-lg"
                        style={{
                          fontSize:
                            selectedFormat === 'landscape'
                              ? '67px'
                              : selectedFormat === 'square'
                                ? '46.2px'
                                : '42px',
                          marginBottom: '4px',
                          textShadow: `0 ${textShadow}px ${textShadow * 4}px rgba(0, 0, 0, 0.8)`,
                        }}
                      >
                        Year in Sports
                      </h1>
                      <p
                        className="font-bold opacity-90 drop-shadow truncate"
                        style={{
                          fontSize:
                            selectedFormat === 'landscape'
                              ? '58px'
                              : selectedFormat === 'square'
                                ? '39.6px'
                                : '36px',
                          textShadow: `0 ${textShadow}px ${textShadow * 4}px rgba(0, 0, 0, 0.8)`,
                        }}
                      >
                        {athleteName}
                      </p>
                    </div>

                    {/* Year at top right */}
                    <div
                      className="font-black drop-shadow-2xl text-right"
                      style={{
                        fontSize:
                          selectedFormat === 'landscape'
                            ? '134px'
                            : selectedFormat === 'square'
                              ? '92.4px'
                              : '84px',
                        lineHeight: '1',
                        textShadow: `0 ${textShadow}px ${textShadow * 4}px rgba(0, 0, 0, 0.8)`,
                      }}
                    >
                      {year === 'last365' ? 'Last 365' : year}
                    </div>
                  </div>

                  {/* Center area with activities */}
                  <div
                    style={{
                      flex: '1 1 auto',
                      display: 'flex',
                      justifyContent: selectedFormat === 'square' ? 'flex-end' : 'space-between',
                      alignItems: 'center',
                      gap: '24px',
                    }}
                  >
                    {/* Left Activities - Only for landscape and opengraph */}
                    {selectedFormat !== 'square' && allSelectedItems.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
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
                                  fontSize:
                                    selectedFormat === 'landscape'
                                      ? '34px'
                                      : selectedFormat === 'opengraph'
                                        ? '21px'
                                        : '26px',
                                  textShadow: `0 ${textShadow}px ${textShadow * 4}px rgba(0, 0, 0, 0.8)`,
                                }}
                              >
                                {editedNames[itemId] || item.name}
                              </div>
                              {/* Line 2: Distance - Time */}
                              <div
                                className="opacity-90 font-medium flex items-center"
                                style={{
                                  fontSize:
                                    selectedFormat === 'landscape'
                                      ? '29px'
                                      : selectedFormat === 'opengraph'
                                        ? '18px'
                                        : '22px',
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

                    {/* Right Activities - For square: all items, for landscape/opengraph: second half */}
                    {allSelectedItems.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          width: selectedFormat === 'square' ? '450px' : 'auto',
                          maxWidth: '450px',
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
                                  fontSize:
                                    selectedFormat === 'landscape'
                                      ? '34px'
                                      : selectedFormat === 'square'
                                        ? '23.1px'
                                        : '21px',
                                  textShadow: `0 ${textShadow}px ${textShadow * 4}px rgba(0, 0, 0, 0.8)`,
                                }}
                              >
                                {editedNames[itemId] || item.name}
                              </div>
                              {/* Line 2: Distance - Time */}
                              <div
                                className="opacity-90 font-medium flex items-center justify-end"
                                style={{
                                  fontSize:
                                    selectedFormat === 'landscape'
                                      ? '29px'
                                      : selectedFormat === 'square'
                                        ? '19.8px'
                                        : '18px',
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

                  {/* Stats at bottom - full width */}
                  {selectedStats.length > 0 && (
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
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Adjustment Controls - Below Preview */}
        {backgroundImageUrl && (
          <div className="px-6 pb-4 flex gap-6 justify-center items-center">
            {/* Transparency Control */}
            <div className="flex items-center gap-2 min-w-[200px] max-w-[300px]">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                Transparency:
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={imageOpacity}
                onChange={(e) => setImageOpacity(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[2.5rem] text-right">
                {Math.round(imageOpacity * 100)}%
              </span>
            </div>

            {/* Text Shadow Control */}
            <div className="flex items-center gap-2 min-w-[200px] max-w-[300px]">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                Text Shadow:
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={textShadow}
                onChange={(e) => setTextShadow(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[2.5rem] text-right">
                {textShadow}
              </span>
            </div>
          </div>
        )}

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
              className="px-6 py-2 bg-linear-to-r from-orange-500 to-red-600 text-white font-bold rounded-lg hover:from-orange-600 hover:to-red-700 transition-all shadow-lg disabled:opacity-50"
            >
              {isExporting ? t('socialCard.preparing') : t('socialCard.shareButton')}
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-6 py-2 bg-linear-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50"
            >
              {isExporting ? t('socialCard.exporting') : t('socialCard.downloadButton')}
            </button>
          </div>
        </div>
      </div>

      {/* Crop Modal */}
      {showCropModal && backgroundImageUrl && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">
                    Crop Image for {currentFormat.label}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Adjust the crop area to match your {currentFormat.width}×{currentFormat.height}
                    px social card
                  </p>
                </div>
                <button
                  onClick={() => setShowCropModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <ImageCropEditor
                imageUrl={backgroundImageUrl}
                initialCrop={yearInReview.socialCardCrops[selectedFormat]}
                aspectRatio={currentFormat.aspectRatio}
                onChange={handleCropChange}
              />
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowCropModal(false)}
                className="px-6 py-2 bg-linear-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
