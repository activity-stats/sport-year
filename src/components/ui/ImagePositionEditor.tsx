import { useState, useEffect } from 'react';

interface ImagePositionEditorProps {
  imageUrl: string;
  position: { x: number; y: number; scale: number };
  onPositionChange: (position: { x: number; y: number; scale: number }) => void;
}

export function ImagePositionEditor({
  imageUrl,
  position,
  onPositionChange,
}: ImagePositionEditorProps) {
  const [localPosition, setLocalPosition] = useState(position);

  useEffect(() => {
    setLocalPosition(position);
  }, [position]);

  const handleXChange = (x: number) => {
    const newPosition = { ...localPosition, x };
    setLocalPosition(newPosition);
    onPositionChange(newPosition);
  };

  const handleYChange = (y: number) => {
    const newPosition = { ...localPosition, y };
    setLocalPosition(newPosition);
    onPositionChange(newPosition);
  };

  const handleScaleChange = (scale: number) => {
    const newPosition = { ...localPosition, scale };
    setLocalPosition(newPosition);
    onPositionChange(newPosition);
  };

  const handleReset = () => {
    const defaultPosition = { x: 50, y: 50, scale: 1 };
    setLocalPosition(defaultPosition);
    onPositionChange(defaultPosition);
  };

  return (
    <div className="space-y-4">
      <div className="relative h-64 rounded-xl overflow-hidden border-2 border-gray-200 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800">
        <div
          className="absolute inset-0 bg-cover"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundPosition: `${localPosition.x}% ${localPosition.y}%`,
            transform: `scale(${localPosition.scale})`,
            transformOrigin: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/70 via-indigo-700/70 to-purple-800/70" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center">
            <h3 className="text-4xl font-black mb-2">2024</h3>
            <p className="text-lg">Preview</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-700">Horizontal Position</span>
            <span className="text-sm text-gray-500">{localPosition.x}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={localPosition.x}
            onChange={(e) => handleXChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        <div>
          <label className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-700">Vertical Position</span>
            <span className="text-sm text-gray-500">{localPosition.y}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={localPosition.y}
            onChange={(e) => handleYChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        <div>
          <label className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-700">Zoom</span>
            <span className="text-sm text-gray-500">{localPosition.scale.toFixed(1)}x</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={localPosition.scale}
            onChange={(e) => handleScaleChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="w-full bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-xl hover:bg-gray-300 transition-colors text-sm"
        >
          Reset to Default
        </button>
      </div>
    </div>
  );
}
