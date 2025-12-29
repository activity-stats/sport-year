import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import type { CropArea } from '../../utils/imageCrop';
import { calculateBestFitCrop } from '../../utils/imageCrop';

interface ImageCropEditorProps {
  imageUrl: string;
  initialCrop?: CropArea | null;
  aspectRatio?: number; // width/height ratio, or undefined for free aspect
  onChange: (crop: CropArea) => void;
  showPreviewOverlay?: boolean;
  previewGradient?: string;
}

export function ImageCropEditor({
  imageUrl,
  initialCrop,
  aspectRatio,
  onChange,
  showPreviewOverlay = false,
  previewGradient = 'bg-gradient-to-br from-blue-600/70 via-indigo-700/80 to-purple-800/70',
}: ImageCropEditorProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Load image dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Initialize crop from props or calculate best fit
  useEffect(() => {
    if (!imageSize || hasInitialized) return;

    // Use a microtask to avoid cascading renders
    Promise.resolve().then(() => {
      if (initialCrop) {
        // Convert percentage-based crop to pixel center coordinates for react-easy-crop
        const centerX = initialCrop.x + initialCrop.width / 2;
        const centerY = initialCrop.y + initialCrop.height / 2;
        setCrop({ x: centerX, y: centerY });
        // Calculate zoom from crop width (approximation)
        const zoomLevel = 100 / initialCrop.width;
        setZoom(zoomLevel);
      } else {
        // Calculate best fit crop
        const bestFit = calculateBestFitCrop(imageSize.width, imageSize.height, aspectRatio);
        const centerX = bestFit.x + bestFit.width / 2;
        const centerY = bestFit.y + bestFit.height / 2;
        setCrop({ x: centerX, y: centerY });
        const zoomLevel = 100 / bestFit.width;
        setZoom(zoomLevel);

        // Immediately notify parent of best-fit crop
        onChange(bestFit);
      }

      // Use microtask to avoid cascading renders
      Promise.resolve().then(() => setHasInitialized(true));
    });
  }, [imageSize, initialCrop, aspectRatio, hasInitialized, onChange]);

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      if (!imageSize) return;

      // Convert pixel coordinates to percentages
      const cropPercentages: CropArea = {
        x: (croppedAreaPixels.x / imageSize.width) * 100,
        y: (croppedAreaPixels.y / imageSize.height) * 100,
        width: (croppedAreaPixels.width / imageSize.width) * 100,
        height: (croppedAreaPixels.height / imageSize.height) * 100,
      };

      onChange(cropPercentages);
    },
    [imageSize, onChange]
  );

  const handleReset = () => {
    if (!imageSize) return;

    const bestFit = calculateBestFitCrop(imageSize.width, imageSize.height, aspectRatio);
    const centerX = bestFit.x + bestFit.width / 2;
    const centerY = bestFit.y + bestFit.height / 2;
    setCrop({ x: centerX, y: centerY });
    const zoomLevel = 100 / bestFit.width;
    setZoom(zoomLevel);
    onChange(bestFit);
  };

  return (
    <div className="space-y-4">
      <div className="relative h-64 w-full overflow-hidden rounded-lg bg-gray-900">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          objectFit="contain"
          showGrid={true}
          style={{
            containerStyle: {
              borderRadius: '0.5rem',
            },
          }}
        />
        {showPreviewOverlay && (
          <div className={`pointer-events-none absolute inset-0 ${previewGradient}`} />
        )}
      </div>

      <div className="space-y-3">
        {/* Zoom Slider */}
        <div className="flex items-center gap-3">
          <label
            htmlFor="crop-zoom"
            className="text-sm font-medium text-gray-700 whitespace-nowrap"
          >
            Zoom
          </label>
          <input
            id="crop-zoom"
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-gray-200"
            style={{
              background: `linear-gradient(to right, rgb(249 115 22) 0%, rgb(249 115 22) ${((zoom - 1) / 2) * 100}%, rgb(229 231 235) ${((zoom - 1) / 2) * 100}%, rgb(229 231 235) 100%)`,
            }}
          />
          <span className="text-sm text-gray-500 min-w-[3rem] text-right">
            {Math.round((zoom - 1) * 100)}%
          </span>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        >
          Reset Crop
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Drag to reposition, scroll or use the slider to zoom, and drag the corners to adjust the
        crop area.
      </p>
    </div>
  );
}
