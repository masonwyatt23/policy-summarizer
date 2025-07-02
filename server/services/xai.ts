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

**YOUR COMPREHENSIVE PROTECTION OVERVIEW** (2-3 substantial paragraphs):
- Explain what this ErieSecure Business policy means for the client's business
- Describe the comprehensive protection it provides for their specific industry
- Highlight why this coverage is essential for their peace of mind
- Use the actual insured name and business type from the document

**UNDERSTANDING YOUR COVERAGE** (detailed explanations for each major coverage):
- Explain each coverage type in practical terms the client can understand
- Use real-world examples relevant to their business (restaurant/bar)
- Include verified limits where available, noting "coverage limits to be confirmed" where not specified
- Focus on the protection each coverage provides rather than just listing numbers

**KEY BENEFITS THAT PROTECT YOUR BUSINESS** (engaging explanations):
- Explain how liquor liability protects against alcohol-related incidents
- Describe cyber protection in terms of data breach and customer trust
- Detail employment practices coverage for workplace disputes
- Present each benefit as valuable protection, not just a policy feature

**IMPORTANT COVERAGE CONSIDERATIONS** (professional but not alarming):
- Present exclusions as standard boundaries that help define coverage
- Explain what each major exclusion means in practical terms
- Frame as "understanding your coverage boundaries" rather than limitations

**WHY THIS POLICY IS RIGHT FOR YOUR BUSINESS** (compelling value proposition):
- Connect specific coverages to their restaurant/bar operations
- Explain how comprehensive coverage protects their investment
- Emphasize peace of mind and business continuity
- Include any special features that make this policy particularly valuable

**NEXT STEPS AND RECOMMENDATIONS** (actionable guidance):
- Professional recommendations for maximizing coverage value
- Items to verify with complete policy documentation if needed
- How to work with their Valley Trust Insurance agent

FORMAT REQUIREMENTS:
- Use warm, professional language that builds client confidence
- Write in flowing paragraphs with rich detail (800-1200 words total)
- Focus on value and protection rather than technical details
- Use **bold text** for section headings
- Maintain complete accuracy while emphasizing benefits
- Create an engaging narrative that explains why this coverage matters
- Each section should contain substantial, detailed paragraphs`
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
• CREATE a compelling narrative that explains why this coverage is perfect for their business
• EXPLAIN each coverage type using real-world scenarios they can relate to
• EMPHASIZE the peace of mind and business protection this policy provides
• USE the verified information while focusing on value rather than technicalities
• TRANSFORM coverage details into benefits that matter to the business owner
• INCLUDE specific examples of how each coverage protects their operations

KEY COVERAGE HIGHLIGHTS TO EXPLAIN:
• $1M+ General Liability - Customer injuries, property damage protection
• $1M+ Liquor Liability - Critical for bar/restaurant operations  
• $250K Employment Practices - Workplace dispute protection
• $50K Cyber Protection - Data breach and digital security
• Business Property Protection - Equipment, inventory coverage
• Income Protection - Business interruption coverage

Remember: Focus on INCREDIBLE value explanation, not just listing coverages. Make the client truly understand why this policy is perfect for protecting their restaurant/bar business. Write with enthusiasm and expertise while maintaining accuracy.

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