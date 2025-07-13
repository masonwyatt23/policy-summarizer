import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import tesseract from 'node-tesseract-ocr';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export class PDFExtractor {
  async extractText(buffer: Buffer): Promise<string> {
    console.log('Starting optimized PDF text extraction...');
    
    // Fast strategies first (skip OCR unless necessary)
    const fastStrategies = [
      () => this.extractWithAdvancedPdfjs(buffer),
      () => this.extractWithBasicPdfjs(buffer),
      () => this.extractWithLenientOptions(buffer)
    ];

    for (let i = 0; i < fastStrategies.length; i++) {
      try {
        console.log(`Trying fast extraction strategy ${i + 1}...`);
        const text = await Promise.race([
          fastStrategies[i](),
          new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error('PDF extraction timeout')), 15000)
          )
        ]);
        
        if (text && text.trim().length >= 20) {
          console.log(`Fast strategy ${i + 1} succeeded, extracted ${text.length} characters`);
          return this.cleanText(text);
        }
        console.log(`Fast strategy ${i + 1} produced insufficient text (${text?.length || 0} chars)`);
      } catch (error) {
        console.log(`Fast strategy ${i + 1} failed:`, error instanceof Error ? error.message : String(error));
        continue;
      }
    }

    // Only try OCR if fast strategies fail and document is small enough
    if (buffer.length < 5 * 1024 * 1024) { // 5MB limit for OCR
      try {
        console.log('Attempting OCR extraction as fallback...');
        const ocrText = await Promise.race([
          this.extractWithOCR(buffer),
          new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error('OCR timeout')), 30000)
          )
        ]);
        
        if (ocrText && ocrText.trim().length >= 20) {
          console.log(`OCR succeeded, extracted ${ocrText.length} characters`);
          return this.cleanText(ocrText);
        }
      } catch (error) {
        console.log('OCR extraction failed:', error instanceof Error ? error.message : String(error));
      }
    }

    throw new Error('Document appears to be image-based or contains no readable text. Please ensure the document contains readable text and try again.');
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
    
    // Limit to first 50 pages for faster processing
    const maxPages = Math.min(pdfDocument.numPages, 50);
    
    for (let pageNumber = 1; pageNumber <= maxPages; pageNumber++) {
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
        
        // Stop if we have enough text for analysis
        if (fullText.length > 50000) {
          console.log(`Stopping at page ${pageNumber} - sufficient text extracted`);
          break;
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
    
    // Limit to first 50 pages for faster processing
    const maxPages = Math.min(pdfDocument.numPages, 50);
    
    for (let pageNumber = 1; pageNumber <= maxPages; pageNumber++) {
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
        
        // Stop if we have enough text for analysis
        if (fullText.length > 50000) {
          console.log(`Stopping at page ${pageNumber} - sufficient text extracted`);
          break;
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
      
      console.log(`Processing ${imageFiles.length} pages with OCR...`);
      
      // Extract text from each image using Tesseract
      const extractedTexts = [];
      
      for (const imageFile of imageFiles) {
        const imagePath = path.join(tempDir, imageFile);
        
        try {
          console.log(`OCR processing page: ${imageFile}`);
          
          const text = await tesseract.recognize(imagePath, {
            lang: 'eng',
            oem: 1,
            psm: 6
          });
          
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