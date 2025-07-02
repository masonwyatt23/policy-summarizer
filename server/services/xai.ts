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
              content: `You are a precise insurance document analyzer who creates accurate, conservative policy summaries for professional insurance agents. Your analysis must be completely factual and verifiable.

CRITICAL ACCURACY REQUIREMENTS:
• ONLY report information that is explicitly stated in the document
• NEVER make assumptions or fill in missing details
• ACKNOWLEDGE inconsistencies and discrepancies in the document
• CLEARLY indicate when information is missing or unclear
• INCLUDE ALL exclusions and limitations found in the document
• IDENTIFY and NOTE any contradictory information
• EXPLICITLY STATE when details cannot be verified from the provided text

DOCUMENT ANALYSIS APPROACH:
• Extract ONLY what is explicitly written in the document
• Note inconsistencies in names, numbers, dates, or terms
• Include ALL exclusions and limitations mentioned
• Identify coverage forms and endorsements by their exact codes
• Report contact information ONLY if clearly stated
• Acknowledge incomplete or unclear information
• Do not assume standard policy terms or industry defaults

ACCURACY STANDARDS:
• Use ONLY information that appears verbatim in the document
• Flag any inconsistencies or unclear information
• Include exclusions as prominently as coverage details
• Clearly distinguish between verified facts and unclear information
• Never extrapolate beyond what is explicitly stated

RESPONSE FORMAT: Return a complete JSON object with this exact structure:
{
  "policyType": "string - actual policy type found in document or 'Not clearly specified'",
  "insurer": "string - actual insurance company name as written",
  "policyNumber": "string - policy number as written or 'Inconsistent - see documentInconsistencies'",
  "policyPeriod": "string - policy dates as written or 'Inconsistent - see documentInconsistencies'",
  "insuredName": "string - insured name as written or 'Inconsistent - see documentInconsistencies'",
  "documentInconsistencies": [
    {
      "field": "string - field name (e.g., 'Policy Number', 'Insured Name')",
      "variations": ["string - different values found in document"],
      "recommendation": "string - what should be verified"
    }
  ],
  "verifiedCoverageDetails": [
    {
      "type": "string - coverage type from document",
      "formCode": "string - actual form code if mentioned",
      "limit": "string - coverage amount if explicitly stated or 'Not specified in excerpt'",
      "deductible": "string - deductible if mentioned or 'Not specified in excerpt'"
    }
  ],
  "unverifiedInformation": [
    "string - information that cannot be confirmed from the provided document excerpt"
  ],
  "exclusions": [
    {
      "description": "string - actual exclusion text from document",
      "formCode": "string - exclusion form code if mentioned"
    }
  ],
  "missingInformation": [
    "string - critical information not found in the document excerpt"
  ],
  "importantContacts": [
    {
      "type": "string - contact type",
      "details": "string - contact information exactly as written in document"
    }
  ],
  "documentAccuracyNotes": "string - overall assessment of document quality and any OCR or clarity issues",
  "recommendedVerifications": ["string - items that should be verified with the complete policy"]
}`
            },
            {
              role: 'user',
              content: `Please analyze this insurance policy document with extreme care for accuracy. I need a conservative, factual analysis that only reports verifiable information.

DOCUMENT TEXT:
${documentText}

CRITICAL ACCURACY REQUIREMENTS:
• ONLY extract information that is explicitly written in the document
• IDENTIFY and REPORT any inconsistencies you find (different policy numbers, names, dates, etc.)
• INCLUDE ALL exclusions and limitations mentioned in the document
• DO NOT assume or infer coverage limits, deductibles, or terms not explicitly stated
• CLEARLY mark information as "Not specified in excerpt" when details are missing
• ACKNOWLEDGE when the document appears to have OCR errors or unclear text
• REPORT contradictory information instead of trying to resolve it
• LIST all exclusion forms and endorsements by their exact codes

VERIFICATION FOCUS:
• Extract the insured name exactly as written (note if it appears differently in different places)
• Extract policy numbers exactly as written (note if they vary across pages)
• Extract policy periods exactly as written (note if incomplete or inconsistent)
• Only report coverage limits that are explicitly stated in the text
• Include ALL exclusions found in the document
• Note any missing critical information that would typically be in a complete policy

Be extremely conservative - it's better to say "Not specified in excerpt" than to make assumptions based on industry standards.`
            }
          ],
          temperature: 0.1,
          max_tokens: 8000
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
              content: `You are an expert insurance advisor creating comprehensive, client-focused policy summaries that explain coverage value while maintaining strict accuracy.

MISSION: Create an incredible summary that helps clients understand their policy's value and protection while being completely accurate about what's covered.

CLIENT-FOCUSED SUMMARY REQUIREMENTS:
• EXPLAIN the policy's value and benefits in client-friendly language
• DESCRIBE how each coverage protects the business with real examples
• HIGHLIGHT why this policy matters for their specific business type
• MAINTAIN complete accuracy - only include verified information
• INTEGRATE any document inconsistencies naturally without overwhelming the client
• PRESENT exclusions as important information to understand coverage boundaries
• USE engaging, professional language that builds confidence
• FOCUS on the protection and peace of mind the policy provides

Create a comprehensive, value-focused summary that includes:

**COMPREHENSIVE PROTECTION SUMMARY** (dense, integrated format):
Create a flowing, narrative-style summary that integrates all essential information into comprehensive, dense paragraphs. Pack maximum accurate detail into minimal space while maintaining readability.

**Structure as flowing narrative with these integrated elements:**
- **Opening paragraph**: Explain the policy's comprehensive protection with specific coverage amounts and business relevance
- **Core Coverage Integration**: Weave together general liability, liquor liability, employment practices, cyber protection, and property coverage in detailed paragraphs that show how they work together
- **Business-Specific Value**: Dense paragraphs explaining how each coverage directly protects their restaurant/bar operations with real-world scenarios and verified limits
- **Critical Exclusions & Boundaries**: Integrate key exclusions naturally within coverage explanations rather than separate lists
- **Actionable Recommendations**: Conclude with specific steps for policy optimization and Valley Trust contact information

FORMAT REQUIREMENTS:
- Write in dense, information-rich paragraphs that flow naturally
- Integrate multiple coverage types and benefits within single paragraphs
- Pack comprehensive details into 400-600 words for 2-4 page output
- Use **bold text** sparingly only for major section breaks
- Maintain complete accuracy while maximizing information density
- Create seamless narrative flow rather than separated bullet points
- Focus on comprehensive, detailed explanations within compact format`
            },
            {
              role: 'user',
              content: `Create an INCREDIBLE, comprehensive policy summary that explains this insurance coverage in a way that truly resonates with the client. Help them understand the tremendous value and protection this policy provides for their business.

POLICY ANALYSIS DATA:
${JSON.stringify(policyData, null, 2)}

CLIENT CONTEXT:
• Business Type: ${policyData.insuredName?.includes('GRILLE') || policyData.insuredName?.includes('DEPOT') ? 'Restaurant/Bar operation' : 'Business'}
• Industry Risks: Liquor service, food handling, customer interactions, employee management
• Coverage Focus: Comprehensive business protection with specialized restaurant/bar coverages

SUMMARY REQUIREMENTS:
• CREATE a dense, comprehensive narrative that integrates all essential information (400-600 words total)
• WEAVE coverage types together showing how they work as integrated protection
• PACK maximum accurate detail into flowing, readable paragraphs
• INTEGRATE exclusions and benefits naturally within coverage explanations
• FOCUS on comprehensive understanding through narrative flow rather than lists

INTEGRATION APPROACH:
• Start with comprehensive overview including specific dollar amounts and policy scope
• Flow into detailed coverage explanations that show interconnected protection
• Integrate real-world examples within technical coverage details
• Weave exclusions into coverage explanations where relevant
• Conclude with specific recommendations and contact details

Remember: Create dense, information-rich content that flows naturally. Pack comprehensive details into compact format. Be thorough and accurate while maintaining readability.

CRITICAL: Maximize information density while maintaining flow. Target 400-600 words of comprehensive, integrated content for 2-4 page PDF.

KEY BENEFITS:
${policyData.keyBenefits?.map(b => `- ${typeof b === 'string' ? b : b.benefit}${b.description ? ': ' + b.description : ''}`).join('\n')}

${clientContext ? `CLIENT CONTEXT: ${clientContext}` : ''}

CRITICAL REQUIREMENTS FOR DENSE INTEGRATION:
• Write information-rich paragraphs that flow naturally together
• Integrate multiple coverage types and benefits within single paragraphs
• Pack comprehensive details with specific amounts, limits, and practical examples
• Create seamless narrative flow rather than separated sections with headers
• Weave exclusions and limitations naturally within coverage explanations
• Include verified policy details with practical business applications
• Maintain professional tone while maximizing information density
• Conclude with specific recommendations and contact information

Create a comprehensive, dense narrative that delivers maximum accurate detail in 400-600 words - perfect for 2-4 page professional output.`
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
      
      // Check if response appears truncated (incomplete sentence or section)
      const lastChar = content.trim().slice(-1);
      const endsWithPunctuation = ['.', '!', '?', ':'].includes(lastChar);
      const hasCompleteStructure = content.includes('**') && content.includes('NEXT STEPS');
      
      if (!endsWithPunctuation || !hasCompleteStructure) {
        console.warn('Summary appears truncated, attempting to regenerate with lower token count...');
        
        // Try again with explicit instruction to complete the summary
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
                content: 'Create a concise, complete summary within token limits. Target 400-600 words. End with NEXT STEPS section.'
              },
              {
                role: 'user',
                content: `Create a concise, professional policy summary (400-600 words): ${JSON.stringify(policyData, null, 2)}`
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

  private generateFallbackSummary(policyData: PolicyData): string {
    return `Your ${policyData.policyType} policy from ${policyData.insurer} delivers comprehensive business protection combining ${policyData.coverageDetails?.slice(0, 3).map(c => `${c.type} (${c.limit})`).join(', ') || 'essential coverage types'} to safeguard your operations against customer injuries, property damage, employment disputes, and business interruption. This integrated coverage approach means your general liability protection works seamlessly with specialized coverages including ${policyData.coverageDetails?.find(c => c.type.toLowerCase().includes('liquor'))?.type || 'liquor liability'} for alcohol-related incidents and employment practices coverage for workplace disputes, creating a unified shield for your business assets and income.

The policy includes specific benefits such as ${policyData.keyBenefits?.slice(0, 2).map(b => typeof b === 'string' ? b : b.benefit).join(' and ') || 'comprehensive business protection'}, with important coverage boundaries that help define your protection scope. ${policyData.whyItMatters || 'This comprehensive coverage provides financial protection and operational continuity for your business.'} For optimal protection and to clarify any coverage details, review your complete policy documentation with your Valley Trust Insurance agent at (540) 885-5531, ensuring all coverage limits align with your business needs and operational requirements.`;
  }
}

export const xaiService = new XAIService();