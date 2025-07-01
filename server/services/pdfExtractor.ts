import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

export class PDFExtractor {
  async extractText(buffer: Buffer): Promise<string> {
    try {
      // Load the PDF document with pdfjs-dist
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
        useSystemFonts: true,
        disableFontFace: false,
      });
      
      const pdfDocument = await loadingTask.promise;
      let fullText = '';
      
      // Process each page
      for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
        const page = await pdfDocument.getPage(pageNumber);
        const textContent = await page.getTextContent();
        
        // Extract text from page
        const pageText = textContent.items
          .filter((item: any) => item.str && item.str.trim())
          .map((item: any) => item.str)
          .join(' ');
        
        if (pageText.trim()) {
          fullText += pageText + '\n\n';
        }
      }
      
      // Clean up the extracted text
      const cleanedText = fullText
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();
      
      if (!cleanedText || cleanedText.length < 50) {
        throw new Error('Document contains insufficient readable text');
      }
      
      return cleanedText;
    } catch (error) {
      console.error('PDF extraction failed:', error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const pdfExtractor = new PDFExtractor();