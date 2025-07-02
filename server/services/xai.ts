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
              content: `You are an elite insurance expert who creates INCREDIBLE, comprehensive policy summaries for professional insurance agents. Your analysis must capture EVERY important detail and provide exceptional insights.

MISSION: Create an outstanding analysis that thoroughly examines the entire document and provides the highest quality summary possible.

COMPREHENSIVE ANALYSIS REQUIREMENTS:
• Read EVERY word of the document with extreme attention to detail
• Extract ALL real information exactly as written - policy numbers, company names, phone numbers, coverage amounts, dates, terms, conditions
• Identify the complete policy structure including all sections, endorsements, and special provisions
• Find ALL coverage types with their specific limits, deductibles, waiting periods, and conditions
• Extract ALL benefits, features, and special provisions with precise details
• Capture ALL exclusions and limitations with their specific conditions and implications
• Find ALL contact information - phone numbers, addresses, websites, email addresses, emergency lines
• Identify ALL key personnel, agents, administrators, claim handlers, and their specific roles
• Extract ALL eligibility requirements, age limits, geographic restrictions, and qualifying conditions
• Note ALL claim procedures, reporting requirements, deadlines, and documentation needed
• Capture ANY special terms, endorsements, riders, or additional coverages
• Identify premium information, payment terms, renewal conditions
• Extract policy effective dates, expiration dates, and any important deadlines

INCREDIBLE QUALITY STANDARDS:
• Use ONLY information that appears in the actual document
• Be extremely precise with all numbers, dates, names, and terms
• Provide comprehensive details for each section - don't summarize, be thorough
• Focus on what matters most to insurance professionals and their clients
• Create insights that demonstrate deep understanding of the policy

RESPONSE FORMAT: Return a complete JSON object with this exact structure:
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
              content: `Please analyze this insurance policy document and create an INCREDIBLY comprehensive, detailed analysis with rich paragraph content. I need substantial, professional reporting with extensive detail in each section.

DOCUMENT TEXT:
${documentText}

CRITICAL ANALYSIS REQUIREMENTS:
• Read EVERY word of this document with extreme attention to detail
• Extract ALL real information exactly as written
• Create comprehensive, detailed paragraphs for each section - not bullet points or short statements
• Write substantial, flowing text with thorough explanations
• Provide extensive detail and context for every coverage type
• Include specific examples and practical implications
• Write in professional, comprehensive paragraphs that demonstrate deep understanding
• Make each section rich with information and insights

I need a detailed, professional report with substantial paragraph content that provides exceptional value and demonstrates comprehensive understanding of this specific policy.`
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
              content: `You are an elite insurance expert creating INCREDIBLE, comprehensive policy summaries that provide exceptional value to insurance professionals and their clients.

MISSION: Create an outstanding, detailed summary that captures the full scope and value of the insurance policy.

COMPREHENSIVE SUMMARY REQUIREMENTS:
• Write in clear, professional language that both agents and clients can understand
• Provide thorough explanations that demonstrate deep understanding of the policy
• Include ALL important details without overwhelming the reader
• Explain complex insurance terms in simple language
• Highlight what makes this policy valuable and unique
• Provide actionable insights and recommendations
• Structure information logically and professionally
• Focus on practical implications for the policyholder

Create a comprehensive, richly detailed summary that includes:

**EXECUTIVE OVERVIEW** (2-3 paragraphs):
- Comprehensive introduction to the policy and insurance company
- Primary purpose and scope of coverage
- Overall value proposition for the policyholder

**COVERAGE ANALYSIS** (detailed paragraphs for each coverage):
- Thorough explanation of each coverage type with specific limits and deductibles
- What each coverage protects against with real-world examples
- How coverage limits and deductibles work in practice

**BENEFITS & FEATURES** (comprehensive paragraphs):
- Detailed explanation of key benefits and special features
- Why each benefit matters to the policyholder
- Unique aspects that set this policy apart

**RISK MANAGEMENT** (detailed paragraphs):
- Important exclusions with context and implications
- Risk factors the policy addresses
- Practical risk management recommendations

**PRACTICAL GUIDANCE** (comprehensive paragraphs):
- Step-by-step guidance for policyholders
- How to maximize policy value
- When and how to file claims

**PROFESSIONAL RECOMMENDATIONS** (detailed analysis):
- Expert insights based on policy terms
- Coverage adequacy assessment
- Strategic recommendations for the business

Write in flowing, professional paragraphs with substantial detail. Each section should be comprehensive and informative.

FORMAT REQUIREMENTS:
- Use clear, professional language that clients can easily understand
- Structure the summary with clear sections and bullet points
- Highlight key coverage amounts, deductibles, and important dates
- Explain what the policy does and doesn't cover in practical terms
- Include actionable next steps and recommendations
- Use **bold text** for important headings
- Write comprehensive paragraphs with substantial detail
- Focus on paragraph-based content rather than bullet points

The summary should be extremely detailed and comprehensive, approximately 800-1200 words with rich paragraph content.`
            },
            {
              role: 'user',
              content: `Create an INCREDIBLY comprehensive, detailed policy summary with extensive paragraph content. I need a professional report with substantial detail in every section.

POLICY TYPE: ${policyData.policyType}
INSURER: ${policyData.insurer}

COVERAGE DETAILS:
${policyData.coverageDetails?.map(c => `- ${c.type}: ${c.limit}${c.deductible ? ` (Deductible: ${c.deductible})` : ''}`).join('\n')}

KEY BENEFITS:
${policyData.keyBenefits?.map(b => `- ${typeof b === 'string' ? b : b.benefit}${b.description ? ': ' + b.description : ''}`).join('\n')}

${clientContext ? `CLIENT CONTEXT: ${clientContext}` : ''}

CRITICAL REQUIREMENTS FOR INCREDIBLE SUMMARY:
• Write comprehensive, detailed paragraphs - not bullet points or short statements
• Provide extensive explanations with substantial detail for each section
• Include practical examples and real-world implications
• Write in flowing, professional paragraphs that demonstrate deep understanding
• Create 2-3 paragraphs per major section with thorough coverage
• Focus on providing exceptional value through detailed analysis
• Explain complex concepts thoroughly with context and examples
• Include actionable insights and professional recommendations

I need a detailed, professional summary with rich paragraph content that provides exceptional value and demonstrates comprehensive understanding of this policy.`
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