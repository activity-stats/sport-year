/**
 * Image cropping utilities for canvas-based cropping
 */

export interface CropArea {
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  width: number; // percentage (0-100)
  height: number; // percentage (0-100)
}

export interface CropResult {
  canvas: HTMLCanvasElement;
  blob: Blob | null;
  url: string;
}

/**
 * Creates a cropped image from the source image using canvas
 * @param imageSrc - Source image URL or data URL
 * @param cropPercentages - Crop area in percentages (0-100)
 * @param targetWidth - Target width in pixels for the output
 * @param targetHeight - Target height in pixels for the output
 * @returns Promise with canvas, blob, and object URL
 */
export async function getCroppedImage(
  imageSrc: string,
  cropPercentages: CropArea,
  targetWidth: number,
  targetHeight: number
): Promise<CropResult> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';

    image.onload = () => {
      try {
        // Calculate source crop coordinates from percentages
        const sourceX = (image.naturalWidth * cropPercentages.x) / 100;
        const sourceY = (image.naturalHeight * cropPercentages.y) / 100;
        const sourceWidth = (image.naturalWidth * cropPercentages.width) / 100;
        const sourceHeight = (image.naturalHeight * cropPercentages.height) / 100;

        // Create canvas at target dimensions
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw the cropped portion of the source image to fill the canvas
        ctx.drawImage(
          image,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          targetWidth,
          targetHeight
        );

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            const url = blob ? URL.createObjectURL(blob) : '';
            resolve({ canvas, blob, url });
          },
          'image/png',
          1.0
        );
      } catch (error) {
        reject(error);
      }
    };

    image.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    image.src = imageSrc;
  });
}

/**
 * Calculate best-fit crop area for an image (centered, maximum visible area)
 * @param imageWidth - Natural width of the image
 * @param imageHeight - Natural height of the image
 * @param aspectRatio - Target aspect ratio (width/height), or null for free aspect
 * @returns Crop area in percentages
 */
export function calculateBestFitCrop(
  imageWidth: number,
  imageHeight: number,
  aspectRatio?: number | null
): CropArea {
  if (!aspectRatio) {
    // Free aspect ratio - use entire image
    return {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    };
  }

  const imageAspect = imageWidth / imageHeight;

  if (imageAspect > aspectRatio) {
    // Image is wider than target - crop sides
    const cropWidth = (aspectRatio / imageAspect) * 100;
    const cropX = (100 - cropWidth) / 2;
    return {
      x: cropX,
      y: 0,
      width: cropWidth,
      height: 100,
    };
  } else {
    // Image is taller than target - crop top/bottom
    const cropHeight = (imageAspect / aspectRatio) * 100;
    const cropY = (100 - cropHeight) / 2;
    return {
      x: 0,
      y: cropY,
      width: 100,
      height: cropHeight,
    };
  }
}

/**
 * Revoke object URL to free memory
 * @param url - Object URL to revoke
 */
export function revokeCroppedImageUrl(url: string): void {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
