import { useRef, useState } from 'react';
import { domToPng } from 'modern-screenshot';
import type { Activity, YearStats } from '../../types';
import type { StravaAthlete } from '../../types/strava';
import type { RaceHighlight } from '../../utils/raceDetection';
import { formatDistanceWithUnit, formatDuration } from '../../utils/formatters';

interface SocialCardProps {
  year: number;
  stats: YearStats;
  athlete: StravaAthlete | null;
  daysActive: number;
  selectedActivities: Activity[];
  selectedHighlights: RaceHighlight[];
  backgroundImageUrl: string | null;
  onClose: () => void;
}

export function SocialCard({
  year,
  stats,
  athlete,
  daysActive,
  selectedActivities,
  selectedHighlights,
  backgroundImageUrl,
  onClose,
}: SocialCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // State for edited activity names
  const [editedNames, setEditedNames] = useState<Record<string, string>>(() => {
    const names: Record<string, string> = {};
    selectedHighlights.forEach((h) => (names[h.id] = h.name));
    selectedActivities.forEach((a) => (names[a.id] = a.name));
    return names;
  });

  const updateName = (id: string, newName: string) => {
    setEditedNames((prev) => ({ ...prev, [id]: newName }));
  };

  const handleExport = async () => {
    if (!cardRef.current) {
      alert('Card element not found. Please try again.');
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
      const filename = `${athleteSlug}-${year}-year-in-sports.png`;

      // Try File System Access API first (Chrome/Edge)
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
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
          if ((err as any).name === 'AbortError') {
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

  const totalDistance = stats.totalDistanceKm;
  const totalHours = Math.round(stats.totalTimeHours);

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
            ? (item as any).distance
            : 'distanceKm' in item
              ? (item as any).distanceKm
              : 'MISSING',
        duration:
          'duration' in item
            ? (item as any).duration
            : 'movingTimeMinutes' in item
              ? (item as any).movingTimeMinutes
              : 'MISSING',
        rawItem: item,
      };
    })
  );

  const athleteName = athlete ? `${athlete.firstname} ${athlete.lastname}` : 'Athlete';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Social Media Card</h2>
              <p className="text-sm text-gray-600 mt-1">
                Click on activity titles below to edit them • 1200x630px
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
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

            <div className="absolute inset-0 h-full p-12 flex flex-col text-white">
              {/* Header */}
              <div className="flex items-start justify-between mb-auto">
                <div>
                  <h1 className="text-4xl font-black mb-1 drop-shadow-lg">Year in Sports</h1>
                  <p className="text-3xl font-bold opacity-90 drop-shadow">{athleteName}</p>
                </div>
                <div className="text-7xl font-black drop-shadow-2xl">{year}</div>
              </div>

              {/* Bottom section with stats and highlights */}
              <div className="space-y-8">
                {/* Selected Activities */}
                {allSelectedItems.length > 0 && (
                  <div className="grid grid-cols-3 gap-6">
                    {allSelectedItems.map((item) => {
                      const isRaceHighlight = 'badge' in item;
                      const itemId = item.id;

                      return (
                        <div
                          key={itemId}
                          className="bg-white/15 backdrop-blur-md rounded-xl p-5 border border-white/30 shadow-xl"
                        >
                          <div className="text-lg font-bold mb-2 drop-shadow">
                            <input
                              type="text"
                              value={editedNames[itemId] || item.name}
                              onChange={(e) => updateName(itemId, e.target.value)}
                              className="w-full bg-transparent border-b border-white/30 focus:border-white/60 outline-none text-white placeholder-white/60 transition-colors"
                              placeholder="Activity name"
                              maxLength={50}
                            />
                          </div>
                          <div className="text-sm opacity-90 font-semibold">
                            {isRaceHighlight ? (
                              <>
                                {formatDistanceWithUnit(
                                  ((item as RaceHighlight).distance || 0) * 1000
                                )}{' '}
                                • {formatDuration(((item as RaceHighlight).duration || 0) * 60)}
                              </>
                            ) : (
                              <>
                                {formatDistanceWithUnit(
                                  ((item as Activity).distanceKm || 0) * 1000
                                )}{' '}
                                • {formatDuration(((item as Activity).movingTimeMinutes || 0) * 60)}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Stats - Clean design without boxes */}
                <div className="flex justify-around items-center">
                  <div className="text-center">
                    <div className="text-6xl font-black mb-2 drop-shadow-2xl">{daysActive}</div>
                    <div className="text-xl font-bold opacity-90 drop-shadow-lg uppercase tracking-wide">
                      Days Active
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-6xl font-black mb-2 drop-shadow-2xl">
                      {Math.round(totalDistance).toLocaleString('de-DE')}
                    </div>
                    <div className="text-xl font-bold opacity-90 drop-shadow-lg uppercase tracking-wide">
                      Distance (km)
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-6xl font-black mb-2 drop-shadow-2xl">
                      {totalHours.toLocaleString('de-DE')}
                    </div>
                    <div className="text-xl font-bold opacity-90 drop-shadow-lg uppercase tracking-wide">
                      Hours
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {allSelectedItems.length === 0
              ? 'No highlights selected'
              : `${allSelectedItems.length} highlight${allSelectedItems.length !== 1 ? 's' : ''} selected`}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50"
            >
              {isExporting ? 'Exporting...' : '📥 Download Card'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
