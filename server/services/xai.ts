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

**YOUR PROTECTION OVERVIEW** (1 concise paragraph):
- Clearly explain what this policy means for their business in 3-4 sentences
- Focus on the most essential protection it provides

**KEY COVERAGE HIGHLIGHTS** (brief, focused explanations):
- Cover the 4-5 most important coverage types with practical examples
- Keep each coverage explanation to 2-3 sentences maximum
- Focus on real-world protection rather than technical details

**IMPORTANT BENEFITS** (concise value points):
- Highlight 3-4 key benefits using bullet points or brief paragraphs
- Emphasize practical protection for their specific business type
- Keep descriptions clear and direct

**COVERAGE BOUNDARIES** (essential exclusions only):
- List only the most important exclusions clients should understand
- Present as helpful boundaries, not limitations
- Keep explanations brief and professional

**NEXT STEPS** (actionable recommendations):
- 2-3 clear recommendations for maximizing coverage value
- Contact information for their Valley Trust Insurance agent

FORMAT REQUIREMENTS:
- Use professional, confident language that builds trust
- Target 400-600 words total for digestible 2-4 page PDF
- Focus on essential information rather than comprehensive detail
- Use **bold text** for section headings
- Maintain complete accuracy while being concise
- Create clear, actionable content that clients can quickly understand`
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
• CREATE a clear, focused summary that highlights essential protection (400-600 words total)
• EXPLAIN the most important coverage types concisely with practical examples
• EMPHASIZE key benefits without overwhelming detail
• KEEP explanations brief and actionable for busy business owners
• FOCUS on what matters most to their specific business type

TOP COVERAGE PRIORITIES TO HIGHLIGHT:
• General Liability - Customer protection essentials
• Liquor Liability - Critical for restaurant/bar operations  
• Employment Practices - Workplace protection basics
• Cyber Protection - Digital security fundamentals
• Property & Income Protection - Business continuity

Remember: Focus on clear value communication, not exhaustive detail. Help the client quickly understand their essential protection. Be professional, confident, and concise.

CRITICAL: Keep the summary digestible and focused. Target 400-600 words total for 2-4 page PDF. Include all required sections but keep them brief and impactful.

KEY BENEFITS:
${policyData.keyBenefits?.map(b => `- ${typeof b === 'string' ? b : b.benefit}${b.description ? ': ' + b.description : ''}`).join('\n')}

${clientContext ? `CLIENT CONTEXT: ${clientContext}` : ''}

CRITICAL REQUIREMENTS FOR CONCISE SUMMARY:
• Write clear, focused paragraphs that get to the point quickly
• Keep each section brief and essential - avoid unnecessary detail
• Include practical examples without excessive explanation
• Write professional content that busy business owners can quickly understand
• Create 1-2 concise paragraphs per section maximum
• Focus on key value points rather than comprehensive analysis
• Explain important concepts clearly and directly
• Include actionable insights and essential recommendations only

Create a professional, concise summary that busy business owners can quickly read and understand - targeting 400-600 words total.`
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