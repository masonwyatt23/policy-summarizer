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
              content: `You are an elite business insurance consultant creating transformative policy summaries that help clients understand the exceptional value and strategic protection their coverage provides.

MISSION: Create an extraordinary summary that demonstrates ROI, builds confidence, and provides actionable business intelligence while maintaining perfect accuracy.

CLIENT-FOCUSED EXCELLENCE REQUIREMENTS:
• DEMONSTRATE the substantial business value and ROI this policy delivers
• ILLUSTRATE protection with specific, relatable business scenarios and examples
• QUANTIFY the financial protection and risk mitigation provided
• EMPHASIZE the competitive advantages and peace of mind this coverage creates
• TRANSLATE complex insurance terms into clear business benefits
• PRESENT exclusions as valuable knowledge that helps optimize business operations
• PROVIDE actionable insights and immediate next steps
• BUILD confidence through expert analysis and professional guidance
• FOCUS on how this policy enables business growth and success

**ENHANCED 5-PARAGRAPH BUSINESS INTELLIGENCE SUMMARY**:
Create an exceptional 5-paragraph summary that reads like premium business consulting. Each paragraph should be rich with insights, practical value, and actionable intelligence (80-120 words each).

**Enhanced Paragraph Structure:**
1. **Strategic Policy Foundation**: Executive-level overview of the comprehensive protection platform, highlighting the insurer's stability, coverage sophistication, and how this policy positions the business for confident growth and expansion
2. **Liability Shield & Business Protection**: Detailed analysis of liability coverages with specific dollar amounts, real-world scenarios, competitive advantages, and how this protection enables customer-facing operations without fear
3. **Asset Protection & Continuity Assurance**: Comprehensive explanation of property, income, and operational continuity coverage with practical examples of how this protects cash flow, enables recovery, and maintains business reputation
4. **Strategic Coverage Boundaries & Operational Intelligence**: Professional analysis of coverage scope, presenting exclusions as valuable business intelligence that helps optimize operations and identify additional opportunities
5. **Expert Recommendations & Partnership Value**: Specific, actionable recommendations for maximizing policy value, immediate optimization steps, and complete Valley Trust partnership benefits including direct access to expertise

VALUE-FOCUSED ENHANCEMENTS:
- Emphasize financial protection amounts and business impact
- Include specific industry scenarios and practical applications  
- Highlight competitive advantages this coverage provides
- Demonstrate how coverage enables business confidence and growth
- Present exclusions as strategic business intelligence
- Provide immediate, actionable next steps
- Focus on partnership value and ongoing support`
            },
            {
              role: 'user',
              content: `Create an EXTRAORDINARY, transformative policy summary that demonstrates exceptional business value and provides strategic insights that will genuinely impact this client's success. This should read like premium business consulting that builds confidence and drives action.

POLICY ANALYSIS DATA:
${JSON.stringify(policyData, null, 2)}

CLIENT BUSINESS INTELLIGENCE:
• Business Type: ${policyData.insuredName?.includes('GRILLE') || policyData.insuredName?.includes('DEPOT') ? 'Restaurant/Bar operation with high-risk liquor service and customer interaction' : 'Business operation with customer-facing activities'}
• Industry Success Factors: Customer confidence, operational continuity, financial protection, reputation management
• Strategic Protection Needs: Comprehensive liability shield, asset protection, income continuity, competitive advantages
• Business Growth Enablers: Risk management that allows confident expansion and customer-facing operations

ENHANCED SUMMARY REQUIREMENTS:
• CREATE exactly 5 exceptional paragraphs demonstrating substantial business value and strategic protection (400-600 words total)
• WRITE with executive-level sophistication and actionable business intelligence
• START each paragraph with compelling subheader in brackets [like this] that captures business value
• QUANTIFY financial protection and demonstrate ROI wherever possible
• ILLUSTRATE coverage with specific, relatable business scenarios that show real-world impact
• EMPHASIZE competitive advantages and confidence this coverage provides
• TRANSFORM exclusions into strategic business intelligence and operational guidance

BUSINESS VALUE NARRATIVE APPROACH:
• Paragraph 1: [Strategic Protection Platform] - Executive overview emphasizing insurer strength, coverage sophistication, total protection value, and business growth enablement
• Paragraph 2: [Comprehensive Liability Shield] - Liability protection with specific amounts, real scenarios, customer confidence benefits, and operational freedom this enables
• Paragraph 3: [Asset Protection & Business Continuity] - Property, income, and cyber protection with cash flow impact, recovery capabilities, and reputation preservation
• Paragraph 4: [Strategic Risk Management & Opportunity Identification] - Transform coverage boundaries into actionable business intelligence with specific operational improvements, revenue opportunities, cost-saving strategies, and competitive advantages
• Paragraph 5: [Your Valley Trust Partnership & Support] - Reassurance about excellent protection, ongoing support commitment, clear contact information, and professional closing that reinforces partnership

EXCEPTIONAL CLIENT VALUE FEATURES:
• Demonstrate how this policy enables business confidence and growth
• Quantify the financial protection and competitive advantages provided
• Present practical scenarios that show coverage impact on daily operations
• Transform technical details into clear business benefits and strategic advantages
• Provide immediate, actionable insights that improve business operations
• Show how this coverage positions the business for success and expansion

KEY BUSINESS BENEFITS TO HIGHLIGHT:
${policyData.keyBenefits?.map(b => `- ${typeof b === 'string' ? b : b.benefit}${b.description ? ': ' + b.description : ''}`).join('\n')}

${clientContext ? `ADDITIONAL CLIENT CONTEXT: ${clientContext}` : ''}

EXCEPTIONAL BUSINESS INTELLIGENCE REQUIREMENTS:
• Write 5 substantial paragraphs with executive-level business insights (80-120 words each)
• Start each paragraph with a descriptive subheader in bracket format [like this]
• Demonstrate tangible business value and competitive advantages throughout
• Include specific financial protection amounts and practical business scenarios
• Present coverage as strategic business intelligence that drives operational success
• Build confidence through expert analysis and actionable recommendations
• End with supportive contact information and partnership reassurance

CRITICAL FOCUS FOR FINAL TWO PARAGRAPHS:

**Paragraph 4 [Strategic Risk Management & Opportunity Identification] MUST INCLUDE:**
- Specific operational improvements this coverage enables
- Revenue opportunities created by having this protection
- Cost-saving strategies and efficiency gains
- Competitive advantages over uninsured or underinsured competitors
- Specific business growth opportunities this coverage unlocks
- Transform any exclusions into actionable business intelligence and opportunity identification

**Paragraph 5 [Your Valley Trust Partnership & Support] MUST INCLUDE:**
- Reassurance that their new policy provides excellent protection for their business
- Emphasis on Valley Trust's commitment to ongoing support and service
- Clear contact information for questions, claims, or guidance (phone, email, office visits)
- Invitation to reach out anytime with questions or concerns
- Mention of being welcome to visit the office for personalized assistance
- Professional closing that reinforces the partnership and available support

ENHANCED PARAGRAPH 4 EXAMPLES OF VALUE TO INCLUDE:
• "This coverage enables you to confidently pursue larger contracts that require proof of insurance..."
• "With this protection, you can expand customer-facing operations without fear of liability exposure..."
• "The cyber coverage allows you to offer online services and digital payments with confidence..."
• "Understanding these coverage boundaries helps optimize your operational procedures to maximize protection..."

ENHANCED PARAGRAPH 5 EXAMPLES OF SUPPORT MESSAGING:
• "Your new ErieSecure Business policy provides comprehensive protection perfectly tailored to your operations..."
• "Valley Trust Insurance Group remains committed to your ongoing success and peace of mind..."
• "For any questions about your coverage, claims assistance, or policy guidance, contact us at (540) 885-5531..."
• "Jake Schindler and our team are always available via phone, email at jake@valleytrustinsurance.com, or visit our office..."
• "We encourage you to reach out anytime - you're always welcome at our Staunton office for personalized assistance..."

Create a transformative 5-paragraph business intelligence summary where the final two paragraphs deliver exceptional client value with actionable insights and immediate business benefits that drive real operational improvements and partnership engagement.`
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