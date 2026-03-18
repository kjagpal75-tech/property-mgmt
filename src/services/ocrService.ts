import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

/**
 * OCR Service for extracting text from image-based PDFs
 */
export class OCRService {
  private static worker: Tesseract.Worker | null = null;
  private static pdfDocument: any = null;

  /**
   * Initialize OCR worker
   */
  static async initializeWorker(): Promise<void> {
    if (!this.worker) {
      this.worker = await Tesseract.createWorker('eng', 1, {
        logger: (m) => console.log(m),
      });
    }
  }

  /**
   * Extract text from PDF using OCR
   * @param file PDF file to process
   * @returns Extracted text
   */
  static async extractTextFromPDF(file: File): Promise<string> {
    try {
      console.log('Starting OCR extraction for PDF:', file.name);
      
      // Initialize worker if not already done
      await this.initializeWorker();
      
      if (!this.worker) {
        throw new Error('Failed to initialize OCR worker');
      }

      // Convert PDF to images using pdf.js
      const images = await this.convertPDFToImages(file);
      console.log(`PDF converted to ${images.length} images`);

      let extractedText = '';
      
      // Process each image with OCR
      for (let i = 0; i < images.length; i++) {
        console.log(`Processing page ${i + 1}/${images.length}...`);
        
        const { data: { text } } = await this.worker.recognize(images[i]);
        extractedText += text + '\n\n';
        
        console.log(`Page ${i + 1} extracted text length:`, text.length);
      }

      console.log('OCR extraction completed. Total text length:', extractedText.length);
      return extractedText.trim();

    } catch (error) {
      console.error('OCR extraction error:', error);
      throw new Error('Failed to extract text using OCR');
    }
  }

  /**
   * Convert PDF to images using pdf.js
   * @param file PDF file
   * @returns Array of image data URLs
   */
  private static async convertPDFToImages(file: File): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const typedArray = new Uint8Array(reader.result as ArrayBuffer);
          
          // Load PDF using pdf.js
          const loadingTask = pdfjsLib.getDocument(typedArray);
          const pdf = await loadingTask.promise;
          
          console.log('PDF loaded successfully:', {
            numPages: pdf.numPages,
            file: file.name,
            size: file.size
          });

          const images: string[] = [];

          // Process each page
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 });
            
            // Create canvas
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            console.log(`Rendering page ${pageNum}:`, {
              width: viewport.width,
              height: viewport.height
            });

            // Render PDF page to canvas
            await page.render({
              canvasContext: context!,
              viewport: viewport,
              canvas: canvas,
            }).promise;

            // Convert to data URL
            const imageUrl = canvas.toDataURL('image/png');
            images.push(imageUrl);
            
            console.log(`Page ${pageNum} rendered successfully`);
          }

          resolve(images);
        } catch (error) {
          console.error('PDF to image conversion error:', error);
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Clean up OCR worker
   */
  static async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
