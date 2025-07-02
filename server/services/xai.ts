import type { PolicyData } from '@shared/schema';

// xAI service for intelligent policy analysis
export class XAIService {
  private apiKey: string;
  private baseUrl = 'https://api.x.ai/v1';

  constructor() {
    this.apiKey = process.env.XAI_API_KEY!;
    if (!this.apiKey) {
      throw new Error('XAI_API_KEY environment variable is required');
    }
  }

  async analyzePolicy(documentText: string): Promise<PolicyData> {
    console.log(`🚀 xAI Analysis: Processing ${documentText.length} characters with Grok`);

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
              content: `You are an expert insurance policy analyzer. Your job is to read insurance policy documents and extract accurate, detailed information to create comprehensive summaries for clients.

CRITICAL REQUIREMENTS:
1. Extract REAL policy numbers, insurer names, coverage amounts, and dates from the document
2. Identify the exact policy type (Travel, Health, Auto, Home, Life, Business, etc.)
3. Find actual coverage limits, deductibles, and benefits mentioned in the document
4. Extract real contact information (phone numbers, emails, addresses)
5. Identify genuine exclusions and limitations from the policy text
6. Create accurate, client-friendly explanations based on the actual policy content

RESPONSE FORMAT: Return a JSON object with this exact structure:
{
  "policyType": "string - actual policy type found in document",
  "insurer": "string - actual insurance company name",
  "coverageDetails": [
    {
      "type": "string - coverage type",
      "limit": "string - coverage amount",
      "description": "string - what this covers",
      "deductible": "string - if mentioned"
    }
  ],
  "keyBenefits": [
    {
      "benefit": "string - benefit title",
      "description": "string - detailed description",
      "importance": "critical|high|medium|low"
    }
  ],
  "eligibility": ["string - requirements from document"],
  "exclusions": [
    {
      "description": "string - actual exclusion from document",
      "category": "string - type of exclusion",
      "impact": "string - impact explanation"
    }
  ],
  "importantContacts": [
    {
      "type": "string - contact type",
      "phone": "string - actual phone from document",
      "email": "string - actual email from document"
    }
  ],
  "whyItMatters": "string - clear explanation of policy value",
  "riskAssessment": {
    "highRiskFactors": ["string - risk factors"],
    "recommendations": ["string - actionable recommendations"],
    "scenarios": [
      {
        "scenario": "string - situation",
        "impact": "string - financial impact",
        "mitigation": "string - how policy helps"
      }
    ]
  },
  "clientRecommendations": ["string - next steps for client"]
}`
            },
            {
              role: 'user',
              content: `Please analyze this insurance policy document and extract accurate information to create a comprehensive summary. Focus on finding real data from the document, not generic information.

DOCUMENT TEXT:
${documentText}

Please read through this entire document carefully and extract the real policy information, coverage details, exclusions, and contact information. Generate a detailed, accurate analysis based on what's actually written in this specific policy document.`
            }
          ],
          temperature: 0.1,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('xAI API error:', response.status, errorText);
        throw new Error(`xAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from xAI');
      }

      // Parse the JSON response
      let policyData: PolicyData;
      try {
        policyData = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse xAI response as JSON:', content);
        // Fallback: try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          policyData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not parse xAI response');
        }
      }

      console.log('✅ xAI Analysis Complete:', policyData.policyType);
      return policyData;

    } catch (error) {
      console.error('xAI analysis failed:', error);
      throw error;
    }
  }

  async generateEnhancedSummary(policyData: PolicyData, clientContext?: string): Promise<string> {
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
              content: `You are an expert insurance advisor creating client-friendly policy summaries. Create a comprehensive, easy-to-understand summary that explains the policy in plain language while highlighting the most important aspects.

FORMAT REQUIREMENTS:
- Use clear, professional language that clients can easily understand
- Structure the summary with clear sections and bullet points
- Highlight key coverage amounts, deductibles, and important dates
- Explain what the policy does and doesn't cover in practical terms
- Include actionable next steps and recommendations
- Use **bold text** for important information
- Use bullet points (•) for lists

The summary should be detailed but readable, approximately 300-500 words.`
            },
            {
              role: 'user',
              content: `Create a comprehensive, client-friendly summary for this insurance policy:

POLICY TYPE: ${policyData.policyType}
INSURER: ${policyData.insurer}

COVERAGE DETAILS:
${policyData.coverageDetails?.map(c => `- ${c.type}: ${c.limit}${c.deductible ? ` (Deductible: ${c.deductible})` : ''}`).join('\n')}

KEY BENEFITS:
${policyData.keyBenefits?.map(b => `- ${typeof b === 'string' ? b : b.benefit}${b.description ? ': ' + b.description : ''}`).join('\n')}

${clientContext ? `CLIENT CONTEXT: ${clientContext}` : ''}

Please create a professional, comprehensive summary that explains this policy clearly and highlights what matters most to the client.`
            }
          ],
          temperature: 0.3,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error(`xAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Summary generation failed';

    } catch (error) {
      console.error('xAI summary generation failed:', error);
      return this.generateFallbackSummary(policyData);
    }
  }

  private generateFallbackSummary(policyData: PolicyData): string {
    return `**${policyData.policyType} Policy Summary**

This ${policyData.policyType.toLowerCase()} policy from ${policyData.insurer} provides comprehensive coverage designed to protect you from financial loss.

**Key Coverage:**
${policyData.coverageDetails?.map(c => `• ${c.type}: ${c.limit}`).join('\n') || '• Coverage details as specified in your policy'}

**Important Benefits:**
${policyData.keyBenefits?.map(b => `• ${typeof b === 'string' ? b : b.benefit}`).join('\n') || '• Benefits as outlined in your policy documents'}

**What This Means for You:**
${policyData.whyItMatters || 'This policy provides financial protection and peace of mind for covered events.'}

**Next Steps:**
• Review your policy documents thoroughly
• Keep important contact information accessible
• Contact your agent with any questions
• Report claims promptly when needed

For specific coverage questions or to file a claim, contact your insurance provider using the information provided in your policy documents.`;
  }
}

export const xaiService = new XAIService();