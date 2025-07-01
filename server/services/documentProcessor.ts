import mammoth from 'mammoth';
import { PolicyData, PolicyDataSchema } from '@shared/schema';
import { extractPolicyData } from './openai';

export class DocumentProcessor {
  async processDocument(buffer: Buffer, filename: string): Promise<{
    extractedText: string;
    policyData: PolicyData;
    summary: string;
  }> {
    try {
      const extractedText = await this.extractTextFromDocument(buffer, filename);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text content could be extracted from the document');
      }

      const policyData = await extractPolicyData(extractedText);
      const summary = await this.generateSummary(policyData);

      return {
        extractedText,
        policyData,
        summary,
      };
    } catch (error) {
      console.error('Document processing error:', error);
      throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractTextFromDocument(buffer: Buffer, filename: string): Promise<string> {
    const extension = filename.toLowerCase().split('.').pop();

    switch (extension) {
      case 'pdf':
        return await this.extractFromPDF(buffer);
      case 'docx':
        return await this.extractFromDOCX(buffer);
      default:
        throw new Error(`Unsupported file format: ${extension}. Only PDF and DOCX files are supported.`);
    }
  }

  private async extractFromPDF(buffer: Buffer): Promise<string> {
    try {
      // Method 1: Try pdf-parse with dynamic import
      const { default: pdfParse } = await import('pdf-parse');
      
      const options = {
        normalizeWhitespace: true,
        disableCombineTextItems: false
      };
      
      const data = await pdfParse(buffer, options);
      
      if (!data.text || data.text.trim().length < 10) {
        throw new Error('Insufficient text extracted from PDF');
      }
      
      return data.text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      
      // Method 2: Try fallback extraction with detailed error message
      throw new Error(`Failed to extract text from PDF. The document may be image-based or corrupted. Please try uploading a text-based PDF or convert to DOCX format. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractPDFUsingOCR(buffer: Buffer): Promise<string> {
    // For now, throw error with helpful message
    // In production, this could use Tesseract.js or similar
    throw new Error('Document appears to be image-based or corrupted. Please try uploading a text-based PDF or convert to DOCX format.');
  }

  private async extractFromDOCX(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateSummary(policyData: PolicyData): Promise<string> {
    const summary = `
**${policyData.policyType}**

**Coverage Highlights:**
${policyData.coverageDetails.map(coverage => 
  `• ${coverage.type}: ${coverage.limit}${coverage.deductible ? ` (Deductible: ${coverage.deductible})` : ''}`
).join('\n')}

**Key Benefits:**
${policyData.keyBenefits.map(benefit => `• ${benefit}`).join('\n')}

**Why This Coverage Matters:**
${policyData.whyItMatters}

**Eligibility Requirements:**
${policyData.eligibility.ageLimit ? `• Age Limit: ${policyData.eligibility.ageLimit}` : ''}
${policyData.eligibility.maxDuration ? `• Maximum Duration: ${policyData.eligibility.maxDuration}` : ''}
${policyData.eligibility.restrictions ? policyData.eligibility.restrictions.map(r => `• ${r}`).join('\n') : ''}

**Important Exclusions:**
${policyData.exclusions.map(exclusion => `• ${exclusion}`).join('\n')}

**Contact Information:**
${policyData.importantContacts.insurer ? `• Insurer: ${policyData.importantContacts.insurer}` : ''}
${policyData.importantContacts.administrator ? `• Administrator: ${policyData.importantContacts.administrator}` : ''}
${policyData.importantContacts.emergencyLine ? `• Emergency Line: ${policyData.importantContacts.emergencyLine}` : ''}
    `.trim();

    return summary;
  }
}

export const documentProcessor = new DocumentProcessor();
