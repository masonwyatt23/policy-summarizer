import type { PolicyData } from '@shared/schema';
import { getDeploymentConfig } from './deploymentConfig';

// Optimized xAI service specifically for deployment environments
export class XAIServiceOptimized {
  private apiKey: string;
  private baseUrl = 'https://api.x.ai/v1';

  constructor() {
    this.apiKey = process.env.XAI_API_KEY!;
    if (!this.apiKey) {
      throw new Error('XAI_API_KEY environment variable is required');
    }
    console.log('✅ XAI service initialized with API key');
  }

  async analyzePolicy(documentText: string): Promise<PolicyData> {
    const config = getDeploymentConfig();
    console.log(`🚀 XAI Analysis: Processing ${documentText.length} characters in ${config.environment} environment`);

    // Aggressive text truncation for deployment
    let processedText = documentText;
    if (config.isDeployed && documentText.length > config.textLimits.maxCharacters) {
      console.warn(`⚠️ Truncating text from ${documentText.length} to ${config.textLimits.maxCharacters} characters for deployment`);
      processedText = documentText.substring(0, config.textLimits.maxCharacters);
    }

    // Use chunked processing for very large documents in deployment
    if (config.processing.useChunking && processedText.length > config.textLimits.chunkSize) {
      console.log(`📦 Using chunked processing for document (${processedText.length} chars)`);
      return await this.analyzeWithChunking(processedText);
    }

    // Use aggressive retry mechanism
    return await this.performAnalysisWithRetry(processedText);
  }

  private async analyzeWithChunking(documentText: string): Promise<PolicyData> {
    const config = getDeploymentConfig();
    const chunks = this.splitIntoChunks(documentText, config.textLimits.chunkSize);
    console.log(`📦 Split document into ${chunks.length} chunks for processing`);

    const results: PolicyData[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      console.log(`📦 Processing chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`);
      
      try {
        const chunkResult = await this.performAnalysisWithRetry(chunks[i], true);
        results.push(chunkResult);
        
        // Add delay between chunks to prevent overwhelming the API
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ Chunk ${i + 1} failed:`, error);
        // Continue processing other chunks
      }
    }

    return this.mergeChunkResults(results);
  }

  private async performAnalysisWithRetry(documentText: string, isChunk: boolean = false): Promise<PolicyData> {
    const config = getDeploymentConfig();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= config.retries.maxAttempts; attempt++) {
      try {
        console.log(`🔄 Analysis attempt ${attempt}/${config.retries.maxAttempts}`);
        return await this.performSingleAnalysis(documentText, isChunk);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`❌ Attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < config.retries.maxAttempts) {
          const delay = config.retries.exponentialBackoff 
            ? config.retries.delayMs * Math.pow(2, attempt - 1)
            : config.retries.delayMs;
          
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Analysis failed after all retries');
  }

  private async performSingleAnalysis(documentText: string, isChunk: boolean = false): Promise<PolicyData> {
    const config = getDeploymentConfig();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeouts.xaiRequest);

    try {
      console.log(`🔌 Making XAI API request (${documentText.length} chars)`);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'grok-2-1212',
          messages: [
            {
              role: 'system',
              content: this.getOptimizedSystemPrompt(isChunk, config.processing.simplifiedPrompts)
            },
            {
              role: 'user',
              content: `Extract key insurance policy information in JSON format:\n\n${documentText}`
            }
          ],
          max_tokens: config.processing.simplifiedPrompts ? 3000 : 6000,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`XAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Parse JSON response
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const policyData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      console.log(`✅ Successfully parsed policy data`);
      
      return policyData;

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timed out after ${config.timeouts.xaiRequest/1000} seconds`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private getOptimizedSystemPrompt(isChunk: boolean, simplified: boolean): string {
    const chunkNote = isChunk ? 'NOTE: This is a chunk of a larger document. Focus only on information in this chunk.' : '';
    
    if (simplified) {
      return `You are an insurance document analyzer. Extract key information and return JSON.

${chunkNote}

Extract ONLY information explicitly stated in the document. Return JSON with this structure:
{
  "policyType": "string",
  "insurer": "string",
  "policyNumber": "string",
  "coverage": [{"type": "string", "limit": "string", "deductible": "string"}],
  "benefits": [{"title": "string", "description": "string"}],
  "exclusions": [{"description": "string"}],
  "explanation": "string - brief key points"
}`;
    }

    return `You are a precise insurance document analyzer. Extract key information and return JSON.

${chunkNote}

REQUIREMENTS:
• Extract ONLY information explicitly stated in the document
• Note inconsistencies in names, numbers, dates
• Include ALL exclusions and limitations
• Mark missing information as "Not specified"

Return JSON with this structure:
{
  "policyType": "string",
  "insurer": "string", 
  "policyNumber": "string",
  "policyPeriod": "string",
  "insuredName": "string",
  "coverage": [{"type": "string", "limit": "string", "deductible": "string"}],
  "benefits": [{"title": "string", "description": "string"}],
  "exclusions": [{"description": "string"}],
  "explanation": "string - brief explanation of key coverage points"
}`;
  }

  private splitIntoChunks(text: string, chunkSize: number): string[] {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, i + chunkSize));
    }
    return chunks;
  }

  private mergeChunkResults(results: PolicyData[]): PolicyData {
    if (results.length === 0) {
      return this.getDefaultPolicyData();
    }

    const merged = { ...results[0] };
    
    for (let i = 1; i < results.length; i++) {
      const result = results[i];
      
      // Merge arrays
      if (result.coverage) {
        merged.coverage = [...(merged.coverage || []), ...result.coverage];
      }
      if (result.benefits) {
        merged.benefits = [...(merged.benefits || []), ...result.benefits];
      }
      if (result.exclusions) {
        merged.exclusions = [...(merged.exclusions || []), ...result.exclusions];
      }
      
      // Use longer explanation
      if (result.explanation && result.explanation.length > merged.explanation.length) {
        merged.explanation = result.explanation;
      }
    }

    return merged;
  }

  private getDefaultPolicyData(): PolicyData {
    return {
      policyType: 'Unable to determine',
      insurer: 'Unable to determine',
      policyNumber: 'Unable to determine',
      policyPeriod: 'Unable to determine',
      insuredName: 'Unable to determine',
      coverage: [],
      benefits: [],
      exclusions: [],
      explanation: 'Document processing failed - unable to extract policy information'
    };
  }

  async generateEnhancedSummary(policyData: PolicyData, clientContext: string = '', summaryLength: 'short' | 'detailed' = 'detailed'): Promise<string> {
    const config = getDeploymentConfig();
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.timeouts.xaiRequest);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'grok-2-1212',
          messages: [
            {
              role: 'system',
              content: this.getSummaryPrompt(summaryLength, config.processing.simplifiedPrompts)
            },
            {
              role: 'user',
              content: `Generate a ${summaryLength} policy summary from this data:\n\n${JSON.stringify(policyData, null, 2)}`
            }
          ],
          max_tokens: summaryLength === 'short' ? 1000 : 3000,
          temperature: 0.2
        })
      });

      if (!response.ok) {
        throw new Error(`Summary generation failed: ${response.status}`);
      }

      const data = await response.json();
      const summary = data.choices[0].message.content;
      
      console.log(`✅ Generated ${summaryLength} summary (${summary.length} chars)`);
      return summary;

    } catch (error) {
      console.error('❌ Summary generation failed:', error);
      return this.generateFallbackSummary(policyData, summaryLength);
    }
  }

  private getSummaryPrompt(summaryLength: 'short' | 'detailed', simplified: boolean): string {
    if (summaryLength === 'short') {
      return `You are an experienced insurance agent (20+ years) explaining a policy to a client in simple terms.

Create a single paragraph summary with a header in brackets [Your Coverage Summary] that:
• Uses everyday language, not insurance jargon
• Explains what the policy covers in practical terms
• Mentions key exclusions the client should know about
• Sounds like a friendly, knowledgeable agent explaining to a neighbor

Keep it 150-200 words in one flowing paragraph.`;
    }

    return `You are an experienced insurance agent (20+ years) creating a comprehensive policy summary for a client.

Create a professional 5-paragraph summary with descriptive headers in brackets [like this] that:
• Uses clear, accessible language
• Explains coverage in practical business terms
• Highlights key benefits and exclusions
• Provides actionable insights
• Sounds authoritative but friendly

Target 400-600 words total across 5 substantial paragraphs.`;
  }

  private generateFallbackSummary(policyData: PolicyData, summaryLength: 'short' | 'detailed'): string {
    const coverageList = policyData.coverage?.map(c => `${c.type} (${c.limit})`).join(', ') || 'Coverage details not available';
    const exclusionsList = policyData.exclusions?.map(e => e.description).join(', ') || 'Exclusions not available';
    
    if (summaryLength === 'short') {
      return `[Your Coverage Summary] This ${policyData.policyType || 'insurance policy'} from ${policyData.insurer || 'your insurance company'} provides coverage for ${coverageList}. Key exclusions include: ${exclusionsList}. Please review the complete policy for full details.`;
    }

    return `[Policy Overview] This ${policyData.policyType || 'insurance policy'} from ${policyData.insurer || 'your insurance company'} provides comprehensive coverage for your business needs.

[Coverage Details] Your policy includes: ${coverageList}.

[Key Benefits] This policy provides protection for your business operations and assets.

[Important Exclusions] Please be aware of these exclusions: ${exclusionsList}.

[Next Steps] Review the complete policy documents for full terms and conditions. Contact your agent with any questions.`;
  }
}

export const xaiService = new XAIServiceOptimized();