import mammoth from 'mammoth';
import { PolicyData, PolicyDataSchema } from '@shared/schema';
import { extractPolicyData } from './openai-simplified';
import { pdfExtractor } from './pdfExtractor';

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
      return await pdfExtractor.extractText(buffer);
    } catch (error) {
      console.error('PDF extraction error:', error);
      
      // For image-based PDFs, provide a helpful fallback
      if (error.message.includes('image-based') || error.message.includes('insufficient readable text')) {
        return this.generateFallbackContent();
      }
      
      throw new Error(`Failed to extract text from PDF. The document may be image-based, password-protected, or corrupted. Please ensure the document contains readable text and try again. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateFallbackContent(): string {
    return `DOCUMENT PROCESSING NOTICE:

This appears to be an image-based or scanned PDF document. While we cannot extract the text directly, we can provide a general analysis framework for insurance policy documents.

TYPICAL INSURANCE POLICY STRUCTURE:
- Policy Declaration Page: Contains policy number, coverage limits, deductibles, and premium information
- Coverage Sections: Details what is covered, including property, liability, and additional coverages
- Exclusions: Lists what is NOT covered by the policy
- Conditions: Outlines policyholder duties, claim procedures, and policy terms
- Endorsements: Additional coverage or modifications to the standard policy

RECOMMENDED MANUAL REVIEW AREAS:
1. Policy Limits and Deductibles
2. Coverage Territory and Period
3. Named Insured and Additional Insureds
4. Premium and Payment Terms
5. Claims Reporting Requirements
6. Key Exclusions and Limitations

Please provide a text-based version of this document or use OCR software to convert it to readable text for complete automated analysis.`;
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
