import { useState } from 'react';
import { domToCanvas } from 'modern-screenshot';
import jsPDF from 'jspdf';

interface PDFExportOptions {
  filename?: string;
  quality?: number;
  scale?: number;
}

export function usePDFExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const exportToPDF = async (elementId: string, options: PDFExportOptions = {}): Promise<void> => {
    const { filename = 'year-in-review.pdf', quality = 0.95, scale = 2 } = options;

    setIsExporting(true);
    setProgress(10);

    // Store references that need to be cleaned up
    let fixedElements: NodeListOf<Element> | null = null;
    const originalDisplays: string[] = [];
    let element: HTMLElement | null = null;
    let originalOverflow = '';
    let originalHeight = '';

    try {
      element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with id "${elementId}" not found`);
      }

      // Store original styles
      originalOverflow = element.style.overflow;
      originalHeight = element.style.height;

      // Hide fixed positioned elements (buttons, etc.) during export
      fixedElements = document.querySelectorAll('.print\\:hidden');
      fixedElements.forEach((el, index) => {
        const htmlEl = el as HTMLElement;
        originalDisplays[index] = htmlEl.style.display;
        htmlEl.style.display = 'none';
      });

      // Temporarily adjust styles for full capture
      element.style.overflow = 'visible';
      element.style.height = 'auto';

      setProgress(30);

      // Capture the element as canvas using modern-screenshot
      const canvas = await domToCanvas(element, {
        scale,
        backgroundColor: '#ffffff',
      });

      setProgress(60);

      // Calculate PDF dimensions - create a single long page to avoid ugly page breaks
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF with custom page size to fit all content on one page
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [imgWidth, imgHeight], // Custom size: width x height
        compress: true,
      });

      setProgress(80);

      const imgData = canvas.toDataURL('image/jpeg', quality);

      // Add the entire image as a single page (no page breaks!)
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

      setProgress(90);

      // Save the PDF
      pdf.save(filename);

      setProgress(100);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      throw error;
    } finally {
      // Always restore original styles
      if (element) {
        element.style.overflow = originalOverflow;
        element.style.height = originalHeight;
      }

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

  return {
    exportToPDF,
    isExporting,
    progress,
  };
}
