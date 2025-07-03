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

**5-PARAGRAPH COHESIVE SUMMARY** (detailed narrative format):
Create a comprehensive 5-paragraph summary that flows like a professional business document. Each paragraph should be substantial (80-120 words), detailed, and explanatory, building upon the previous one to create a complete understanding.

**Paragraph Structure:**
1. **Policy Overview & Foundation**: Comprehensive introduction explaining the policy type, insurer, business being covered, and overall protection philosophy with specific amounts
2. **Core Liability Protection**: Detailed explanation of general liability, liquor liability, and employment practices coverage with specific limits, deductibles, and real-world protection scenarios
3. **Property & Operational Coverage**: Thorough coverage of business property protection, income protection, cyber coverage, and specialized endorsements with practical applications
4. **Coverage Boundaries & Important Considerations**: Professional explanation of key exclusions, limitations, and coverage boundaries that define the policy scope, presented as helpful guidance
5. **Professional Recommendations & Next Steps**: Specific recommendations for policy optimization, verification steps, and complete contact information for Valley Trust Insurance

FORMAT REQUIREMENTS:
- Write 5 substantial, flowing paragraphs (400-600 words total)
- Each paragraph should be comprehensive and detailed
- START each paragraph with a descriptive subheader enclosed in brackets [like this]
- NO other section headers, bullet points, or bold formatting besides the subheaders
- Create seamless narrative flow between paragraphs
- Pack maximum accurate detail into readable, explanatory content
- Focus on comprehensive understanding through detailed exposition`
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
• CREATE exactly 5 comprehensive paragraphs that flow seamlessly together (400-600 words total)
• WRITE in professional business document style with substantial, detailed paragraphs
• START each paragraph with a descriptive subheader enclosed in brackets [like this]
• ELIMINATE all other section headers, bullet points, and bold formatting
• INTEGRATE all coverage details, limits, exclusions, and recommendations into flowing narrative
• FOCUS on comprehensive explanations that build understanding progressively

NARRATIVE APPROACH:
• Paragraph 1: [Policy Foundation] - Policy foundation with insurer, coverage amounts, and business protection overview
• Paragraph 2: [Core Liability Protection] - Core liability coverages (general, liquor, employment) with specific limits and real-world applications
• Paragraph 3: [Property & Operational Coverage] - Property, income, and cyber protection with detailed coverage explanations and practical benefits
• Paragraph 4: [Coverage Boundaries & Exclusions] - Coverage boundaries and exclusions woven naturally into comprehensive explanation
• Paragraph 5: [Recommendations & Contact Information] - Professional recommendations and complete Valley Trust contact information

Remember: Write like a professional business consultant explaining complex insurance in clear, flowing prose. Each paragraph should be substantial and informative.

CRITICAL: Create 5 cohesive paragraphs with descriptive subheaders in brackets at the start of each paragraph. Pure narrative flow that comprehensively explains the policy.

KEY BENEFITS:
${policyData.keyBenefits?.map(b => `- ${typeof b === 'string' ? b : b.benefit}${b.description ? ': ' + b.description : ''}`).join('\n')}

${clientContext ? `CLIENT CONTEXT: ${clientContext}` : ''}

CRITICAL REQUIREMENTS FOR 5-PARAGRAPH NARRATIVE:
• Write exactly 5 substantial paragraphs with seamless flow between them
• Each paragraph should be 80-120 words of comprehensive, detailed content
• NO formatting whatsoever - no headers, bullets, bold text, or section breaks
• Write in professional business prose that reads like a consultant's report
• Integrate all technical details naturally within explanatory narrative
• Build understanding progressively from foundation to specific recommendations
• Maintain authoritative, confident tone while explaining complex coverage clearly
• End with complete contact information integrated into final paragraph

Create a cohesive 5-paragraph business document that comprehensively explains the policy in flowing, professional prose - exactly 400-600 words total.`
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
      const hasCompleteStructure = content.split('\n\n').length >= 4; // Check for multiple paragraphs
      
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
                content: 'Create a cohesive 5-paragraph narrative summary. No formatting, headers, or bullets. Target 400-600 words of flowing prose.'
              },
              {
                role: 'user',
                content: `Create a cohesive 5-paragraph professional summary (400-600 words, no formatting): ${JSON.stringify(policyData, null, 2)}`
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