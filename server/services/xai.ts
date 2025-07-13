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

    // Truncate text if too long to prevent timeouts
    const maxLength = 150000; // 150k chars limit
    const processedText = documentText.length > maxLength 
      ? documentText.substring(0, maxLength) + '\n\n[DOCUMENT TRUNCATED FOR PROCESSING]'
      : documentText;

    try {
      const fetchPromise = fetch(`${this.baseUrl}/chat/completions`, {
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
              content: `You are an expert insurance document analyzer who extracts key policy information accurately and thoroughly. Your goal is to find and extract all important policy details that are present in the document.

INFORMATION EXTRACTION PRIORITIES:
• ALWAYS extract basic policy information: insured name, policy number, policy period, insurer name
• THOROUGHLY scan for coverage types, limits, deductibles, and key benefits
• IDENTIFY all exclusions and limitations mentioned in the document
• EXTRACT contact information for agents, companies, and customer service
• FIND business details, addresses, and operational information
• LOCATE policy effective dates, renewal dates, and billing information

EXTRACTION APPROACH:
• Search the entire document systematically for key information
• Look for information in headers, footers, declaration pages, and coverage sections
• Extract business names from "Named Insured", "Insured", or company name fields
• Find policy numbers from document headers, footers, or identification sections
• Identify policy periods from effective dates and expiration dates
• Extract coverage limits from declarations, schedules, or coverage sections

ACCURACY STANDARDS:
• Extract information exactly as written in the document
• Note variations if the same information appears differently in multiple places
• Include all exclusions and limitations found
• Report missing information only when truly not present anywhere
• Provide comprehensive coverage details when available

RESPONSE FORMAT: Return a complete JSON object with this exact structure:
{
  "policyType": "string - type of insurance policy (e.g., 'Business General Liability', 'Commercial Auto')",
  "insurer": "string - insurance company name as written",
  "policyNumber": "string - policy number as found in document",
  "policyPeriod": "string - policy effective dates",
  "insuredName": "string - business/person name being insured",
  "documentInconsistencies": [
    {
      "field": "string - field name if inconsistent",
      "variations": ["string - different values found"],
      "recommendation": "string - what should be verified"
    }
  ],
  "verifiedCoverageDetails": [
    {
      "type": "string - coverage type",
      "formCode": "string - form code if mentioned",
      "limit": "string - coverage amount",
      "deductible": "string - deductible amount"
    }
  ],
  "unverifiedInformation": [
    "string - information that appears unclear or incomplete"
  ],
  "exclusions": [
    {
      "description": "string - exclusion description",
      "formCode": "string - exclusion form code if mentioned"
    }
  ],
  "missingInformation": [
    "string - critical information not found in document"
  ],
  "importantContacts": [
    {
      "type": "string - contact type",
      "details": "string - contact information"
    }
  ],
  "documentAccuracyNotes": "string - overall assessment of document quality",
  "recommendedVerifications": ["string - items that should be verified"]
}`
            },
            {
              role: 'user',
              content: `Please analyze this insurance policy document and extract all key policy information. I need a thorough analysis that finds all available information in the document.

DOCUMENT TEXT:
${processedText}

EXTRACTION REQUIREMENTS:
• FIND and extract the insured business name - look in headers, "Named Insured" fields, or company information
• LOCATE the policy number - check headers, footers, or identification sections
• IDENTIFY policy effective dates and periods
• EXTRACT all coverage types and limits mentioned
• FIND the insurance company name
• LOCATE any agent or contact information
• IDENTIFY all exclusions and limitations
• EXTRACT deductibles and coverage amounts
• FIND business addresses and operational details

SEARCH STRATEGY:
• Scan the entire document systematically for key information
• Look for information in multiple locations (headers, footers, declarations, schedules)
• Extract business names from any mention of "Named Insured", "Insured", or company references
• Find policy numbers from any identification or reference sections
• Identify dates from effective date fields, renewal information, or term specifications
• Extract coverage details from schedules, declarations, or coverage sections

Be thorough and comprehensive - extract all information that is present in the document.`
            }
          ],
          temperature: 0.1,
          max_tokens: 8000
        })
      });

      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('xAI API timeout')), 45000)
      );

      const response = await Promise.race([fetchPromise, timeoutPromise]);

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
      const fetchPromise = fetch(`${this.baseUrl}/chat/completions`, {
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

**CRITICAL: PARAGRAPH 5 MUST AVOID:**
- Do NOT suggest scheduling follow-up meetings or policy reviews
- Do NOT request immediate action items or appointments
- Do NOT ask them to verify business information or policy details
- Do NOT mention policy optimization reviews or coverage assessments
- Focus ONLY on reassurance, support availability, and contact information

ENHANCED PARAGRAPH 4 EXAMPLES OF VALUE TO INCLUDE:
• "This coverage enables you to confidently pursue larger contracts that require proof of insurance..."
• "With this protection, you can expand customer-facing operations without fear of liability exposure..."
• "The cyber coverage allows you to offer online services and digital payments with confidence..."
• "Understanding these coverage boundaries helps optimize your operational procedures to maximize protection..."

ENHANCED PARAGRAPH 5 EXAMPLES OF SUPPORT MESSAGING:
• "Your new ErieSecure Business policy provides comprehensive protection perfectly tailored to your operations, giving you the confidence to focus on what you do best..."
• "Valley Trust Insurance Group remains committed to your ongoing success and peace of mind, standing ready to support you whenever questions arise..."
• "Should you have any questions about your coverage, need claims assistance, or simply want policy guidance, we're here to help at (540) 885-5531..."
• "Jake Schindler and our team are always available via phone, email at jake@valleytrustinsurance.com, or you're welcome to visit our office at 829 Greenville Ave in Staunton..."
• "We encourage you to reach out anytime with questions or concerns - you're always welcome for personalized assistance and expert guidance..."

Create a transformative 5-paragraph business intelligence summary where the final two paragraphs deliver exceptional client value with actionable insights and immediate business benefits that drive real operational improvements and partnership engagement.`
            }
          ],
          temperature: 0.3,
          max_tokens: 3000
        })
      });

      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('xAI summary timeout')), 45000)
      );

      const response = await Promise.race([fetchPromise, timeoutPromise]);

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

  async generateBriefSummary(policyData: PolicyData, documentText: string): Promise<string> {
    console.log('🚀 xAI Brief Summary: Creating concise single-paragraph summary');

    try {
      const fetchPromise = fetch(`${this.baseUrl}/chat/completions`, {
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
              content: `You are an expert insurance consultant creating ultra-concise policy summaries for busy business owners. Your goal is to deliver maximum value in minimum words.

BRIEF SUMMARY REQUIREMENTS:
• Create ONE comprehensive paragraph (150-200 words MAXIMUM)
• Focus on the most critical coverage highlights and business value
• Include essential policy details: insured name, policy type, key limits
• Highlight the most important exclusions that could impact the business
• Provide actionable insights about coverage value and protection
• Use clear, professional language that busy owners can quickly understand
• ABSOLUTELY NO section headers, bullet points, or formatting - just flowing narrative text
• STRICTLY LIMIT to 150-200 words - be concise and impactful

CONTENT PRIORITIES:
1. Business name and policy type identification
2. Most significant coverage protections and limits
3. Critical exclusions or limitations to be aware of
4. Key business value and protection benefits
5. Brief mention of contact information if available

WRITING STYLE:
• Professional yet accessible tone
• Clear, concise sentences
• Focus on practical business impact
• Avoid insurance jargon
• Emphasize value and protection
• KEEP IT SHORT - maximum 200 words

Create a paragraph that a busy business owner can read in 30 seconds and immediately understand the value and protection they have.`
            },
            {
              role: 'user',
              content: `Based on the following policy analysis, create a concise single-paragraph summary:

POLICY ANALYSIS:
Insured Name: ${policyData.insuredName}
Policy Type: ${policyData.policyType}
Insurer: ${policyData.insurer}
Policy Number: ${policyData.policyNumber}
Policy Period: ${policyData.policyPeriod}

Coverage Details: ${policyData.verifiedCoverageDetails?.map(c => `${c.type}: ${c.limit}`).join(', ')}
Key Exclusions: ${policyData.exclusions?.map(e => e.description).join(', ')}

Create a brief, comprehensive paragraph that captures the essential coverage details and business value in exactly 150-200 words. Focus on what matters most to the business owner.`
            }
          ],
          temperature: 0.3,
          max_tokens: 300
        })
      });

      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('xAI brief summary timeout')), 30000)
      );

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        throw new Error(`xAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || 'Brief summary generation failed';
      
      console.log('✅ xAI Brief Summary: Generated concise summary');
      return content;

    } catch (error) {
      console.error('xAI brief summary generation failed:', error);
      return this.generateFallbackBriefSummary(policyData);
    }
  }

  private generateFallbackBriefSummary(policyData: PolicyData): string {
    const coverageHighlights = policyData.verifiedCoverageDetails?.slice(0, 3).map(c => `${c.type} (${c.limit})`).join(', ') || 'comprehensive business protection';
    const policyType = policyData.policyType || 'Business Insurance Policy';
    const insurer = policyData.insurer || 'your insurance provider';
    
    return `Your ${policyType} from ${insurer} provides essential business protection including ${coverageHighlights}, safeguarding your operations against customer injuries, property damage, and business interruption. This coverage enables confident business operations with key benefits like ${policyData.keyBenefits?.slice(0, 2).map(b => typeof b === 'string' ? b : b.benefit).join(' and ') || 'liability protection and asset coverage'}. Important exclusions may apply, so review your complete policy documentation for specific terms and conditions. For questions about your coverage or to optimize your protection, contact Valley Trust Insurance at (540) 885-5531 or jake@valleytrustinsurance.com to ensure your policy aligns with your business needs.`;
  }

  private generateFallbackSummary(policyData: PolicyData): string {
    return `Your ${policyData.policyType} policy from ${policyData.insurer} delivers comprehensive business protection combining ${policyData.coverageDetails?.slice(0, 3).map(c => `${c.type} (${c.limit})`).join(', ') || 'essential coverage types'} to safeguard your operations against customer injuries, property damage, employment disputes, and business interruption. This integrated coverage approach means your general liability protection works seamlessly with specialized coverages including ${policyData.coverageDetails?.find(c => c.type.toLowerCase().includes('liquor'))?.type || 'liquor liability'} for alcohol-related incidents and employment practices coverage for workplace disputes, creating a unified shield for your business assets and income.

The policy includes specific benefits such as ${policyData.keyBenefits?.slice(0, 2).map(b => typeof b === 'string' ? b : b.benefit).join(' and ') || 'comprehensive business protection'}, with important coverage boundaries that help define your protection scope. ${policyData.whyItMatters || 'This comprehensive coverage provides financial protection and operational continuity for your business.'} For optimal protection and to clarify any coverage details, review your complete policy documentation with your Valley Trust Insurance agent at (540) 885-5531, ensuring all coverage limits align with your business needs and operational requirements.`;
  }
}

export const xaiService = new XAIService();