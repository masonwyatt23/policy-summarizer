import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import tesseract from 'node-tesseract-ocr';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export class PDFExtractor {
  async extractText(buffer: Buffer): Promise<string> {
    console.log('Starting PDF text extraction...');
    
    // Add overall timeout to prevent hanging
    const extractionTimeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('PDF extraction timeout - process took too long')), 120000); // 2 minutes max
    });
    
    const extractionProcess = this.performExtraction(buffer);
    
    try {
      return await Promise.race([extractionProcess, extractionTimeout]);
    } catch (error) {
      console.error('PDF extraction failed:', error);
      throw error;
    }
  }

  private async performExtraction(buffer: Buffer): Promise<string> {
    // Try multiple extraction strategies (OCR disabled to prevent timeout)
    const strategies = [
      () => this.extractWithAdvancedPdfjs(buffer),
      () => this.extractWithBasicPdfjs(buffer),
      () => this.extractWithLenientOptions(buffer),
      // OCR disabled temporarily to prevent timeout issues
      // () => this.extractWithOCR(buffer)
    ];

    for (let i = 0; i < strategies.length; i++) {
      try {
        console.log(`Trying extraction strategy ${i + 1}...`);
        
        // Add timeout for each strategy to prevent hanging
        const strategyTimeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Strategy ${i + 1} timeout`)), 
            i < 3 ? 30000 : 60000); // 30s for regular strategies, 60s for OCR
        });
        
        const text = await Promise.race([strategies[i](), strategyTimeout]);
        
        if (text && text.trim().length >= 20) {
          console.log(`Strategy ${i + 1} succeeded, extracted ${text.length} characters`);
          return this.cleanText(text);
        }
        console.log(`Strategy ${i + 1} produced insufficient text (${text?.length || 0} chars)`);
      } catch (error) {
        console.log(`Strategy ${i + 1} failed:`, error instanceof Error ? error.message : String(error));
        continue;
      }
    }

    throw new Error('Document appears to be image-based or contains no readable text. This may be a scanned document that requires OCR processing.');
  }

  private async extractWithAdvancedPdfjs(buffer: Buffer): Promise<string> {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      disableFontFace: false,
      verbosity: 0,
      standardFontDataUrl: 'node_modules/pdfjs-dist/standard_fonts/',
    });
    
    const pdfDocument = await loadingTask.promise;
    let fullText = '';
    
    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
      try {
        const page = await pdfDocument.getPage(pageNumber);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .filter((item: any) => item.str && typeof item.str === 'string')
          .map((item: any) => {
            let text = item.str.trim();
            // Preserve spacing and structure
            if (item.hasEOL) text += '\n';
            return text;
          })
          .join(' ')
          .replace(/\s+/g, ' ');
        
        if (pageText.trim().length > 0) {
          fullText += `${pageText}\n\n`;
        }
      } catch (pageError) {
        console.warn(`Failed to extract page ${pageNumber}:`, pageError instanceof Error ? pageError.message : String(pageError));
        continue;
      }
    }
    
    return fullText;
  }

  private async extractWithBasicPdfjs(buffer: Buffer): Promise<string> {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: false,
      disableFontFace: true,
      verbosity: 0,
    });
    
    const pdfDocument = await loadingTask.promise;
    let fullText = '';
    
    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
      try {
        const page = await pdfDocument.getPage(pageNumber);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .filter((item: any) => item.str && item.str.trim())
          .map((item: any) => item.str)
          .join(' ');
        
        if (pageText.trim()) {
          fullText += pageText + '\n\n';
        }
      } catch (pageError) {
        console.warn(`Basic extraction failed for page ${pageNumber}:`, pageError instanceof Error ? pageError.message : String(pageError));
        continue;
      }
    }
    
    return fullText;
  }



  private async extractWithLenientOptions(buffer: Buffer): Promise<string> {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: false,
      disableFontFace: true,
      disableRange: true,
      disableStream: true,
      disableAutoFetch: true,
      verbosity: 0,
      cMapPacked: true,
      stopAtErrors: false
    });
    
    const pdfDocument = await loadingTask.promise;
    let fullText = '';
    let extractedPages = 0;
    
    // Extract all pages for comprehensive policy analysis
    const maxPages = Math.min(pdfDocument.numPages, 100);
    
    for (let pageNumber = 1; pageNumber <= maxPages; pageNumber++) {
      try {
        const page = await pdfDocument.getPage(pageNumber);
        
        // Try different text extraction approaches
        try {
          const textContent = await page.getTextContent();
          
          if (textContent.items.length > 0) {
            const pageText = textContent.items
              .map((item: any) => {
                if (typeof item.str === 'string' && item.str.trim()) {
                  return item.str;
                }
                return '';
              })
              .filter(Boolean)
              .join(' ')
              .trim();
            
            if (pageText.length > 5) {
              fullText += `${pageText} `;
              extractedPages++;
            }
          }
        } catch (textError) {
          // Try alternative text extraction
          try {
            const operators = await page.getOperatorList();
            // This is a fallback - we might get some text from operators
            if (operators.fnArray.length > 0) {
              fullText += `[Page ${pageNumber} contains graphics/images] `;
            }
          } catch (opError) {
            console.warn(`All text extraction methods failed for page ${pageNumber}`);
          }
        }
      } catch (pageError) {
        console.warn(`Lenient extraction failed for page ${pageNumber}:`, pageError instanceof Error ? pageError.message : String(pageError));
        continue;
      }
    }
    
    console.log(`Lenient extraction processed ${extractedPages}/${maxPages} pages`);
    return fullText;
  }

  private async extractWithOCR(buffer: Buffer): Promise<string> {
    console.log('Attempting OCR extraction for image-based PDF...');
    
    try {
      // Create temporary directory for processing
      const tempDir = '/tmp/pdf-ocr';
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const timestamp = Date.now();
      const pdfPath = path.join(tempDir, `input-${timestamp}.pdf`);
      const outputPattern = path.join(tempDir, `page-${timestamp}`);
      
      // Write PDF buffer to temporary file
      fs.writeFileSync(pdfPath, buffer);
      
      // Convert PDF pages to images using poppler-utils
      console.log('Converting PDF to images...');
      execSync(`pdftoppm -png -r 300 "${pdfPath}" "${outputPattern}"`, { 
        timeout: 30000 
      });
      
      // Find generated image files
      const imageFiles = fs.readdirSync(tempDir)
        .filter(file => file.startsWith(`page-${timestamp}`) && file.endsWith('.png'))
        .sort();
      
      if (imageFiles.length === 0) {
        throw new Error('No images generated from PDF');
      }
      
      // Limit OCR processing to first 3 pages to prevent timeout
      const maxPages = Math.min(imageFiles.length, 3);
      console.log(`Processing ${maxPages} pages with OCR (limited to prevent timeout)...`);
      
      // Extract text from each image using Tesseract with timeout
      const extractedTexts = [];
      
      for (let i = 0; i < maxPages; i++) {
        const imageFile = imageFiles[i];
        const imagePath = path.join(tempDir, imageFile);
        
        try {
          console.log(`OCR processing page: ${imageFile}`);
          
          // Add timeout wrapper for OCR processing
          const text = await Promise.race([
            tesseract.recognize(imagePath, {
              lang: 'eng',
              oem: 1,
              psm: 6
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('OCR timeout')), 15000)
            )
          ]);
          
          if (text && text.trim().length > 10) {
            extractedTexts.push(text.trim());
          }
        } catch (pageError) {
          console.warn(`OCR failed for page ${imageFile}:`, pageError instanceof Error ? pageError.message : String(pageError));
        }
      }
      
      // Cleanup temporary files
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn('Cleanup warning:', cleanupError instanceof Error ? cleanupError.message : String(cleanupError));
      }
      
      const fullText = extractedTexts.join('\n\n').trim();
      
      if (fullText.length < 100) {
        throw new Error(`OCR extracted insufficient text: ${fullText.length} characters`);
      }
      
      console.log(`OCR extraction successful: ${fullText.length} characters from ${extractedTexts.length} pages`);
      return fullText;
      
    } catch (error) {
      console.warn('OCR extraction failed:', error instanceof Error ? error.message : String(error));
      return '';
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .replace(/[^\w\s\.,;:!?\-()]/g, ' ')
      .trim();
  }
}

export const pdfExtractor = new PDFExtractor();