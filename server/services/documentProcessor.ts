import mammoth from 'mammoth';
import { PolicyData, PolicyDataSchema, ProcessingOptions } from '@shared/schema';
import { extractPolicyData } from './openai-simplified';
import { xaiService } from './xai';
import { pdfExtractor } from './pdfExtractor';
import { getDeploymentConfig } from './deploymentConfig';

export class DocumentProcessor {
  async processDocument(buffer: Buffer, filename: string, options?: ProcessingOptions): Promise<{
    extractedText: string;
    policyData: PolicyData;
    summary: string;
  }> {
    const config = getDeploymentConfig();
    const startTime = Date.now();
    
    try {
      console.log(`🚀 Starting document processing in ${config.environment} environment`);
      console.log(`📄 File: ${filename}, Size: ${buffer.length} bytes`);
      console.log(`⚙️ Timeout: ${config.timeouts.totalProcessing/1000}s, Text limit: ${config.textLimits.maxCharacters} chars`);
      
      const extractStart = Date.now();
      console.log('📖 Step 1/3: Extracting text from document...');
      const extractedText = await this.extractTextFromDocument(buffer, filename);
      const extractTime = Date.now() - extractStart;
      console.log(`✅ Text extraction completed in ${extractTime}ms (${extractedText.length} characters)`);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text content could be extracted from the document');
      }



      // For deployment, truncate very large texts to prevent timeout
      let processedText = extractedText;
      if (config.isDeployed && extractedText.length > config.textLimits.maxCharacters) {
        console.warn(`⚠️ Truncating text from ${extractedText.length} to ${config.textLimits.maxCharacters} characters for deployment`);
        processedText = extractedText.substring(0, config.textLimits.maxCharacters);
      }

      // Step 2: Analyze policy with timing
      const analyzeStart = Date.now();
      console.log('🤖 Step 2/3: Analyzing policy with xAI...');
      console.log(`📄 Processing ${processedText.length} characters of document text`);
      console.log(`📋 Summary length requested: ${options?.summaryLength || 'detailed'}`);
      
      const policyData = await xaiService.analyzePolicy(processedText);
      const analyzeTime = Date.now() - analyzeStart;
      console.log(`✅ Policy analysis completed in ${analyzeTime}ms`);
      
      // Step 3: Generate summary with timing
      const summaryStart = Date.now();
      const summaryLength = options?.summaryLength || 'detailed';
      console.log(`📝 Step 3/3: Generating ${summaryLength} summary...`);
      
      const summary = await xaiService.generateEnhancedSummary(policyData, '', summaryLength);
      const summaryTime = Date.now() - summaryStart;
      console.log(`✅ Summary generation completed in ${summaryTime}ms`);
      
      const totalTime = Date.now() - startTime;
      console.log('✅ Document processing completed successfully');
      console.log(`📊 Total processing time: ${totalTime}ms (Extract: ${extractTime}ms, Analyze: ${analyzeTime}ms, Summary: ${summaryTime}ms)`);
      console.log(`📊 Summary format: ${summaryLength}, Length: ${summary.length} characters`);
      
      // Log memory usage in deployment
      if (config.logging.includeMemory) {
        const used = process.memoryUsage();
        console.log(`💾 Memory usage: RSS ${Math.round(used.rss / 1024 / 1024)}MB, Heap ${Math.round(used.heapUsed / 1024 / 1024)}MB`);
      }

      return {
        extractedText: processedText,
        policyData,
        summary,
      };
    } catch (error) {
      const failTime = Date.now() - startTime;
      console.error(`🔴 Document processing FAILED after ${failTime}ms in ${config.environment} environment`);
      console.error('🔴 Error:', error);
      console.error('🔴 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Provide more specific error messages for deployment issues
      if (error instanceof Error) {
        if (error.message.includes('XAI_API_KEY')) {
          throw new Error('AI service configuration error. Please ensure XAI_API_KEY is set in deployment environment.');
        }
        if (error.message.includes('timeout') || error.message.includes('timed out')) {
          throw new Error(`Processing timed out after ${Math.round(failTime/1000)} seconds. This is a known issue with the deployed environment. Please try: 1) Using a smaller PDF file, 2) Using the Replit preview environment instead, or 3) Waiting a moment and trying again.`);
        }
        if (error.message.includes('fetch failed') || error.message.includes('connection failed')) {
          throw new Error('AI service connection failed. This may be due to network restrictions in the deployed environment. Please try using the Replit preview environment.');
        }
      }
      
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
