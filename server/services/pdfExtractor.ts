import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

export class PDFExtractor {
  async extractText(buffer: Buffer): Promise<string> {
    console.log('Starting PDF text extraction...');
    
    // Try multiple extraction strategies
    const strategies = [
      () => this.extractWithAdvancedPdfjs(buffer),
      () => this.extractWithBasicPdfjs(buffer),
      () => this.extractWithLenientOptions(buffer)
    ];

    for (let i = 0; i < strategies.length; i++) {
      try {
        console.log(`Trying extraction strategy ${i + 1}...`);
        const text = await strategies[i]();
        
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
    
    // Limit pages to avoid hanging on large documents
    const maxPages = Math.min(pdfDocument.numPages, 20);
    
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

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .replace(/[^\w\s\.,;:!?\-()]/g, ' ')
      .trim();
  }
}

export const pdfExtractor = new PDFExtractor();