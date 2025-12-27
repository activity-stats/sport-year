import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface ExportSection {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

export type ExportFormat = 'pdf' | 'jpg' | 'png';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (sections: ExportSection[], format: ExportFormat) => void;
  availableSections: Omit<ExportSection, 'enabled' | 'order'>[];
  isExporting?: boolean;
  exportProgress?: number;
}

export function ExportDialog({
  isOpen,
  onClose,
  onExport,
  availableSections,
  isExporting = false,
  exportProgress = 0,
}: ExportDialogProps) {
  const { t } = useTranslation();

  const [sections, setSections] = useState<ExportSection[]>(
    availableSections.map((section, index) => ({
      ...section,
      enabled: true,
      order: index,
    }))
  );
  const [format, setFormat] = useState<ExportFormat>('pdf');

  const handleToggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === id ? { ...section, enabled: !section.enabled } : section
      )
    );
  };

  const handleMoveUp = (id: string) => {
    const index = sections.findIndex((s) => s.id === id);
    if (index <= 0) return;

    const newSections = [...sections];
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];

    // Update order values
    newSections.forEach((section, idx) => {
      section.order = idx;
    });

    setSections(newSections);
  };

  const handleMoveDown = (id: string) => {
    const index = sections.findIndex((s) => s.id === id);
    if (index >= sections.length - 1) return;

    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];

    // Update order values
    newSections.forEach((section, idx) => {
      section.order = idx;
    });

    setSections(newSections);
  };

  const handleExport = () => {
    onExport(sections, format);
    // Don't close immediately - let the parent component close after export completes
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col relative">
        {/* Loading Overlay */}
        {isExporting && (
          <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-2xl text-center">
              <div className="text-4xl mb-4 animate-spin">⏳</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Exporting...
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {exportProgress}%
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('export.customizeExport')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Format Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {t('export.format')}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {(['pdf', 'jpg', 'png'] as ExportFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    format === fmt
                      ? 'bg-blue-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Section Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {t('export.sections')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('export.sectionsDescription')}
            </p>

            <div className="space-y-2">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    section.enabled
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={section.enabled}
                    onChange={() => handleToggleSection(section.id)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />

                  {/* Section Name */}
                  <span
                    className={`flex-1 font-medium ${
                      section.enabled
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {section.name}
                  </span>

                  {/* Order Controls */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleMoveUp(section.id)}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label="Move up"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleMoveDown(section.id)}
                      disabled={index === sections.length - 1}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label="Move down"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-6 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleExport}
            disabled={!sections.some((s) => s.enabled) || isExporting}
            className="px-6 py-2 rounded-lg font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {t('export.exportButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
