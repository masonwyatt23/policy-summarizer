import mammoth from 'mammoth';
import { PolicyData, PolicyDataSchema, ProcessingOptions } from '@shared/schema';
import { extractPolicyData } from './openai-simplified';
import { xaiService } from './xai';
import { pdfExtractor } from './pdfExtractor';

export class DocumentProcessor {
  async processDocument(buffer: Buffer, filename: string, options?: ProcessingOptions): Promise<{
    extractedText: string;
    policyData: PolicyData;
    summary: string;
  }> {
    try {
      console.log(`📄 Starting document processing for: ${filename}`);
      const extractedText = await this.extractTextFromDocument(buffer, filename);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text content could be extracted from the document');
      }
      
      // Process full document for complete accuracy
      const maxTextLength = 300000; // ~100 pages of text - process entire documents
      let processedText = extractedText;
      if (extractedText.length > maxTextLength) {
        console.warn(`⚠️ Large document: ${extractedText.length} characters. Processing full content for accuracy.`);
        // Still process the full text, but warn about size
        processedText = extractedText;
      }



      // Use direct text extraction for all files - faster and more reliable
      console.log('⚡ Processing document with ultra-fast summary generation...');
      const quickSummary = await xaiService.generateQuickSummary(processedText);
      
      // Create minimal policyData for compatibility
      const policyData: PolicyData = {
        policyType: 'Insurance Policy',
        insurer: 'See document',
        policyNumber: 'See document',
        policyPeriod: 'See document',
        insuredName: 'See document',
        coverageDetails: [],
        keyBenefits: [],
        exclusions: [],
        eligibilityRequirements: [],
        claimsProcedure: 'See document',
        importantContacts: [],
        additionalNotes: '',
        confidenceScore: 1.0,
        extractionWarnings: []
      };
      
      return {
        extractedText: processedText.substring(0, 5000), // Keep first 5k chars for better context
        policyData,
        summary: quickSummary,
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
      return await pdfExtractor.extractText(buffer);
    } catch (error) {
      console.error('PDF extraction error:', error);
      
      // For image-based PDFs, provide a helpful fallback
      if (error.message.includes('image-based') || error.message.includes('insufficient readable text') || error.message.includes('OCR processing is not available')) {
        return this.generateFallbackContent();
      }
      
      throw new Error(`Failed to extract text from PDF. The document may be image-based, password-protected, or corrupted. Please ensure the document contains readable text and try again. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateFallbackContent(): string {
    return `[Unable to Process Document]

This appears to be an image-based or scanned PDF document that cannot be processed automatically. These documents require OCR (Optical Character Recognition) processing, which is not available in the deployment environment due to resource constraints.

TYPICAL INSURANCE POLICY COMPONENTS:
Your policy likely contains these essential sections:
- Policy declarations with coverage limits and deductibles
- Coverage details explaining what is protected
- Exclusions outlining what is not covered
- Conditions and claim procedures
- Contact information for claims and questions

NEXT STEPS:
1. Convert your document to a text-based PDF using Adobe Acrobat or similar software
2. Use an OCR service to extract text from the scanned document
3. Re-upload the document once it contains readable text

For immediate assistance with your policy details, please contact Valley Trust Insurance at (540) 885-5531. Our agents can review your policy manually and provide a detailed explanation of your coverage.`;
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
    // Calculate total coverage value for impact assessment
    const totalCoverageValue = policyData.coverageDetails.reduce((total, coverage) => {
      const match = coverage.limit.match(/\$([0-9,]+)/);
      if (match) {
        return total + parseInt(match[1].replace(/,/g, ''));
      }
      return total;
    }, 0);

    const formattedValue = totalCoverageValue > 0 ? 
      `$${totalCoverageValue.toLocaleString()} Canadian` : 'Comprehensive coverage';

    // Generate comprehensive summary with client-focused language
    const summary = `
**${policyData.policyType}**
*Providing ${formattedValue} in protection*

**COVERAGE BREAKDOWN**

${policyData.coverageDetails.length > 0 ? 
  policyData.coverageDetails.map(coverage => {
    let explanation = '';
    
    // Add contextual explanations for each coverage type
    if (coverage.type.toLowerCase().includes('emergency medical')) {
      explanation = '\n  → Covers unexpected medical costs while traveling outside Canada';
    } else if (coverage.type.toLowerCase().includes('trip cancellation')) {
      explanation = '\n  → Reimburses non-refundable trip costs if you must cancel for covered reasons';
    } else if (coverage.type.toLowerCase().includes('trip interruption')) {
      explanation = '\n  → Covers additional costs to return home or rejoin your trip';
    } else if (coverage.type.toLowerCase().includes('baggage')) {
      explanation = '\n  → Protects against lost, stolen, or damaged luggage and personal belongings';
    } else if (coverage.type.toLowerCase().includes('trip delay')) {
      explanation = '\n  → Reimburses meal and accommodation costs during covered delays';
    } else if (coverage.type.toLowerCase().includes('vehicle')) {
      explanation = '\n  → Covers costs to retrieve your vehicle if you cannot drive home';
    }
    
    return `• **${coverage.type}**: ${coverage.limit}${coverage.deductible ? ` (Deductible: ${coverage.deductible})` : ''}${explanation}`;
  }).join('\n\n') : 
  '• Coverage details will be extracted from policy document'
}

**KEY PROTECTION BENEFITS**

${policyData.keyBenefits.map(benefit => {
  if (typeof benefit === 'string') {
    return `• ${benefit}`;
  } else if (benefit && benefit.benefit) {
    return `• **${benefit.benefit}**${benefit.description ? `\n  → ${benefit.description}` : ''}${benefit.importance ? ` *(${benefit.importance} priority)*` : ''}`;
  }
  return `• ${benefit}`;
}).join('\n\n')}

**WHO IS ELIGIBLE**

${policyData.eligibility.ageLimit ? `• **Age Requirement**: ${policyData.eligibility.ageLimit}` : ''}
${policyData.eligibility.maxDuration ? `• **Trip Duration**: ${policyData.eligibility.maxDuration}` : ''}
${policyData.eligibility.restrictions ? policyData.eligibility.restrictions.map(r => `• **Important**: ${r}`).join('\n') : ''}

**WHAT'S NOT COVERED** *(Important Exclusions)*

${policyData.exclusions.map(exclusion => {
  if (typeof exclusion === 'string') {
    return `• ${exclusion}`;
  } else if (exclusion && exclusion.description) {
    return `• **${exclusion.category || 'Exclusion'}**: ${exclusion.description}${exclusion.impact ? `\n  → Impact: ${exclusion.impact}` : ''}`;
  }
  return `• ${exclusion}`;
}).join('\n\n')}

**WHY THIS COVERAGE MATTERS**

${policyData.whyItMatters || policyData.explanation || 'This policy provides essential protection against unexpected events that could result in significant financial hardship.'}

**EMERGENCY CONTACTS** *(Keep This Information Handy)*

${policyData.importantContacts.emergencyLine ? `• **Emergency Assistance**: ${policyData.importantContacts.emergencyLine}` : ''}
${policyData.importantContacts.insurer ? `• **Insurance Company**: ${policyData.importantContacts.insurer}` : ''}
${policyData.importantContacts.administrator ? `• **Policy Administrator**: ${policyData.importantContacts.administrator}` : ''}

**QUICK ACTION STEPS**

• **Before Travel**: Review your coverage limits and emergency contact numbers
• **During Emergency**: Call the emergency assistance line BEFORE seeking treatment for full coverage
• **Filing Claims**: Contact your administrator within 30 days of an incident
• **Questions**: Reach out to Valley Trust Insurance for policy clarification

*This summary provides key highlights. Please refer to your complete policy documents for full terms and conditions.*
    `.trim();

    return summary;
  }
}

export const documentProcessor = new DocumentProcessor();
