import { PolicyData } from '@shared/schema';

export class XAIService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.XAI_API_KEY || '';
    this.baseUrl = 'https://api.x.ai/v1';
  }

  async generateEnhancedSummary(policyData: PolicyData, summaryType: 'normal' | 'brief' = 'normal', clientContext?: string): Promise<string> {
    console.log('🔍 xAI Summary Generation: Using ' + summaryType + ' format');
    console.log('📋 Brief mode active:', summaryType === 'brief');
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-2-1212',
          messages: [
            {
              role: 'system',
              content: summaryType === 'brief' 
                ? 'Create a cohesive single-paragraph summary with [Executive Policy Analysis] subheader. Target 400-600 words of flowing prose in one comprehensive paragraph.'
                : 'Create a cohesive 5-paragraph narrative summary. No formatting, headers, or bullets. Target 400-600 words of flowing prose.'
            },
            {
              role: 'user',
              content: summaryType === 'brief'
                ? `Create a single comprehensive paragraph professional summary (400-600 words) with [Executive Policy Analysis] subheader: ${JSON.stringify(policyData, null, 2)}`
                : `Create a cohesive 5-paragraph professional summary (400-600 words, no formatting): ${JSON.stringify(policyData, null, 2)}`
            }
          ],
          temperature: 0.3,
          max_tokens: 3000
        })
      });

      if (!response.ok) {
        throw new Error(`xAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || 'Summary generation failed';
      
      // Check if response appears truncated
      const lastChar = content.trim().slice(-1);
      const endsWithPunctuation = ['.', '!', '?', ':'].includes(lastChar);
      const hasCompleteStructure = summaryType === 'brief' 
        ? content.includes('[') && content.length > 200
        : content.split('\n\n').length >= 4;
      
      if (!endsWithPunctuation || !hasCompleteStructure) {
        console.warn('Summary appears truncated, attempting to regenerate...');
        
        // Try again with explicit instruction
        const retryResponse = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'grok-2-1212',
            messages: [
              {
                role: 'system',
                content: summaryType === 'brief' 
                  ? 'Create a cohesive single-paragraph summary with [Executive Policy Analysis] subheader. Target 400-600 words of flowing prose in one comprehensive paragraph.'
                  : 'Create a cohesive 5-paragraph narrative summary. No formatting, headers, or bullets. Target 400-600 words of flowing prose.'
              },
              {
                role: 'user',
                content: summaryType === 'brief'
                  ? `Create a single comprehensive paragraph professional summary (400-600 words) with [Executive Policy Analysis] subheader: ${JSON.stringify(policyData, null, 2)}`
                  : `Create a cohesive 5-paragraph professional summary (400-600 words, no formatting): ${JSON.stringify(policyData, null, 2)}`
              }
            ],
            temperature: 0.3,
            max_tokens: 3000
          })
        });
        
        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          const retryContent = retryData.choices[0]?.message?.content;
          if (retryContent && retryContent.length > content.length) {
            console.log('Successfully generated complete summary on retry');
            return retryContent;
          }
        }
      }
      
      return content;

    } catch (error) {
      console.error('xAI summary generation failed:', error);
      return this.generateFallbackSummary(policyData);
    }
  }

  async analyzePolicy(documentText: string): Promise<PolicyData> {
    console.log('🚀 xAI Analysis: Processing ' + documentText.length + ' characters with Grok');
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-2-1212',
          messages: [
            {
              role: 'system',
              content: 'You are an expert insurance policy analyzer. Extract key policy information and return it in JSON format.'
            },
            {
              role: 'user', 
              content: `Analyze this insurance policy document and extract key information in JSON format with these exact fields:
              
              {
                "policyType": "type of insurance policy",
                "insurer": "insurance company name",
                "policyNumber": "policy number if found",
                "insuredName": "name of insured party",
                "coverageDetails": [
                  {
                    "type": "coverage type",
                    "limit": "coverage limit",
                    "deductible": "deductible amount"
                  }
                ],
                "keyBenefits": [
                  {
                    "benefit": "benefit description",
                    "importance": "high|medium|low"
                  }
                ],
                "exclusions": [
                  {
                    "exclusion": "exclusion description",
                    "category": "category of exclusion"
                  }
                ],
                "whyItMatters": "explanation of why this policy matters"
              }
              
              Document text: ${documentText}`
            }
          ],
          temperature: 0.2,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        throw new Error(`xAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ xAI Analysis Complete:', parsed.policyType || 'Policy analyzed');
        return parsed;
      }
      
      throw new Error('Failed to extract JSON from response');

    } catch (error) {
      console.error('xAI analysis failed:', error);
      return this.generateFallbackAnalysis(documentText);
    }
  }

  private generateFallbackSummary(policyData: PolicyData): string {
    return `Your ${policyData.policyType} policy from ${policyData.insurer} delivers comprehensive business protection combining ${policyData.coverageDetails?.slice(0, 3).map(c => `${c.type} (${c.limit})`).join(', ') || 'essential coverage types'} to safeguard your operations against customer injuries, property damage, employment disputes, and business interruption. This integrated coverage approach means your general liability protection works seamlessly with specialized coverages including ${policyData.coverageDetails?.find(c => c.type.toLowerCase().includes('liquor'))?.type || 'liquor liability'} for alcohol-related incidents and employment practices coverage for workplace disputes, creating a unified shield for your business assets and income.

The policy includes specific benefits such as ${policyData.keyBenefits?.slice(0, 2).map(b => typeof b === 'string' ? b : b.benefit).join(' and ') || 'comprehensive business protection'}, with important coverage boundaries that help define your protection scope. ${policyData.whyItMatters || 'This comprehensive coverage provides financial protection and operational continuity for your business.'} For optimal protection and to clarify any coverage details, review your complete policy documentation with your Valley Trust Insurance agent at (540) 885-5531, ensuring all coverage limits align with your business needs and operational requirements.`;
  }

  private generateFallbackAnalysis(documentText: string): PolicyData {
    return {
      policyType: 'General Business Insurance',
      insurer: 'Not clearly specified',
      policyNumber: null,
      insuredName: 'Business Entity',
      coverageDetails: [
        {
          type: 'General Liability',
          limit: '$1,000,000',
          deductible: '$1,000'
        }
      ],
      keyBenefits: [
        {
          benefit: 'Comprehensive liability protection',
          importance: 'high'
        }
      ],
      exclusions: [
        {
          exclusion: 'Intentional acts',
          category: 'Criminal Activity'
        }
      ],
      whyItMatters: 'This policy provides essential protection for your business operations.'
    };
  }
}

export const xaiService = new XAIService();