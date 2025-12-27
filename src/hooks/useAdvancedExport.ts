import { useState } from 'react';
import { domToCanvas } from 'modern-screenshot';
import jsPDF from 'jspdf';
import type { ExportSection, ExportFormat } from '../components/ui/ExportDialog';

interface AdvancedExportOptions {
  filename?: string;
  quality?: number;
  scale?: number;
}

export function useAdvancedExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const exportWithOptions = async (
    sections: ExportSection[],
    format: ExportFormat,
    options: AdvancedExportOptions = {}
  ): Promise<void> => {
    const { filename = 'year-in-review', quality = 0.95, scale = 2 } = options;

    setIsExporting(true);
    setProgress(10);

    // Store references that need to be cleaned up
    let fixedElements: NodeListOf<Element> | null = null;
    const originalDisplays: string[] = [];

    try {
      // Get enabled sections in order
      const enabledSections = sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);

      if (enabledSections.length === 0) {
        throw new Error('No sections selected for export');
      }

      console.log(`Exporting ${enabledSections.length} sections to ${format.toUpperCase()}`);

      // Hide fixed positioned elements (buttons, etc.) during export
      fixedElements = document.querySelectorAll('.print\\:hidden');
      console.log(`Found ${fixedElements.length} fixed elements to hide`);
      fixedElements.forEach((el, index) => {
        const htmlEl = el as HTMLElement;
        originalDisplays[index] = htmlEl.style.display;
        htmlEl.style.display = 'none';
      });

      setProgress(20);

      console.log('Preparing sections for export...');

      // Get the main container
      const mainContainer = document.getElementById('year-in-review-content');
      if (!mainContainer) {
        throw new Error('Main container not found');
      }

      // Store original styles and hide non-selected sections
      const allSectionIds = [
        'hero',
        'calendar',
        'triathlons',
        'running',
        'cycling',
        'swimming',
        'custom-highlights',
        'closing',
      ];
      const hiddenSections: { element: HTMLElement; originalDisplay: string }[] = [];

      for (const sectionId of allSectionIds) {
        const element = document.getElementById(sectionId);
        if (element) {
          const isEnabled = enabledSections.some((s) => s.id === sectionId);
          if (!isEnabled) {
            hiddenSections.push({ element, originalDisplay: element.style.display });
            element.style.display = 'none';
          }
        }
      }

      // Temporarily adjust main container styles for full capture
      const originalOverflow = mainContainer.style.overflow;
      const originalHeight = mainContainer.style.height;
      const originalMinWidth = mainContainer.style.minWidth;
      mainContainer.style.overflow = 'visible';
      mainContainer.style.height = 'auto';
      mainContainer.style.minWidth = '1200px'; // Ensure desktop-width layout to prevent wrapping

      setProgress(40);

      console.log('Starting capture...');

      // Wait for layout to settle
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await domToCanvas(mainContainer, {
        scale,
        backgroundColor: '#ffffff',
      });

      console.log(`Canvas created: ${canvas.width}x${canvas.height}`);

      // Restore main container styles
      mainContainer.style.overflow = originalOverflow;
      mainContainer.style.height = originalHeight;
      mainContainer.style.minWidth = originalMinWidth;

      // Restore hidden sections
      hiddenSections.forEach(({ element, originalDisplay }) => {
        element.style.display = originalDisplay;
      });

      setProgress(70);

      // Export based on format
      if (format === 'pdf') {
        await exportAsPDF(canvas, `${filename}.pdf`, quality);
      } else if (format === 'jpg') {
        await exportAsImage(canvas, `${filename}.jpg`, 'image/jpeg', quality);
      } else if (format === 'png') {
        await exportAsImage(canvas, `${filename}.png`, 'image/png');
      }

      setProgress(100);
      console.log(`Export completed successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Failed to export:', error);
      throw error;
    } finally {
      // Always restore fixed elements
      if (fixedElements) {
        fixedElements.forEach((el, index) => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.display = originalDisplays[index];
        });
      }

      setTimeout(() => {
        setIsExporting(false);
        setProgress(0);
      }, 500);
    }
  };

  const exportAsPDF = async (
    canvas: HTMLCanvasElement,
    filename: string,
    quality: number
  ): Promise<void> => {
    // Calculate PDF dimensions - create a single long page to avoid ugly page breaks
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    console.log(`PDF dimensions: ${imgWidth}x${imgHeight}mm`);

    // Create PDF with custom page size to fit all content on one page
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [imgWidth, imgHeight], // Custom size: width x height
      compress: true,
    });

    console.log('Converting canvas to data URL...');
    const imgData = canvas.toDataURL('image/jpeg', quality);
    console.log('Data URL created, adding to PDF...');

    // Add the entire image as a single page (no page breaks!)
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

    console.log('PDF created as single continuous page');

    // Save the PDF
    console.log(`Saving PDF as ${filename}...`);
    pdf.save(filename);
  };

  const exportAsImage = async (
    canvas: HTMLCanvasElement,
    filename: string,
    mimeType: string,
    quality = 0.95
  ): Promise<void> => {
    console.log(`Converting canvas to ${mimeType}...`);

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        mimeType,
        quality
      );
    });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`Saved image as ${filename}`);
  };

  return {
    exportWithOptions,
    isExporting,
    progress,
  };
}
