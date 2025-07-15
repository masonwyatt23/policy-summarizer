import type { PolicyData } from '@shared/schema';

// xAI service for intelligent policy analysis
export class XAIService {
  private apiKey: string;
  private baseUrl = 'https://api.x.ai/v1';

  constructor() {
    this.apiKey = process.env.XAI_API_KEY!;
    if (!this.apiKey) {
      console.error('🔴 XAI_API_KEY is missing in environment variables');
      throw new Error('XAI_API_KEY environment variable is required. Please ensure it is set in the deployment environment.');
    }
    console.log('✅ XAI service initialized with API key');
  }

  async analyzePolicy(documentText: string): Promise<PolicyData> {
    const isDeployed = !!process.env.REPL_ID;
    console.log(`🚀 xAI Analysis: Processing ${documentText.length} characters with Grok in ${isDeployed ? 'DEPLOYED' : 'PREVIEW'} environment`);

    // For deployment, truncate very large documents to prevent timeouts
    if (isDeployed && documentText.length > 40000) {
      console.warn(`⚠️ Truncating document from ${documentText.length} to 40000 characters for deployment`);
      documentText = documentText.substring(0, 40000);
    }

    try {
      console.log(`🔌 Making XAI API request to: ${this.baseUrl}/chat/completions`);
      
      // Add timeout to prevent hanging requests in deployment
      const timeoutDuration = isDeployed ? 120000 : 60000; // 2 minutes for deployment, 1 minute for preview
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutDuration);
      console.log(`⏱️ XAI request timeout set to ${timeoutDuration/1000} seconds`);

      let response;
      try {
        response = await fetch(`${this.baseUrl}/chat/completions`, {
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

        clearTimeout(timeout);
      } catch (fetchError) {
        clearTimeout(timeout);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error('🔴 XAI request timed out');
          throw new Error('AI service request timed out. This may be a temporary network issue. Please try again.');
        }
        throw fetchError;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ XAI API error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`XAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ XAI API response received (${data.usage?.total_tokens || 'unknown'} tokens)`);

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('❌ Invalid XAI response structure:', data);
        throw new Error('Invalid response structure from XAI API');
      }

      const content = data.choices[0].message.content;
      console.log(`📝 XAI response content length: ${content.length}`);

      // Parse the JSON response
      let policyData: PolicyData;
      try {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          policyData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          policyData = JSON.parse(content);
        }
      } catch (parseError) {
        console.error('❌ Failed to parse XAI response as JSON:', parseError);
        console.error('❌ Raw content:', content);
        throw new Error('Failed to parse XAI response as JSON');
      }

      console.log(`✅ Successfully parsed policy data with ${policyData.verifiedCoverageDetails?.length || 0} coverage items`);
      return policyData;

    } catch (error) {
      console.error('❌ XAI analysis failed:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`XAI request timed out after ${timeoutDuration/1000} seconds`);
        }
        if (error.message.includes('fetch failed')) {
          throw new Error('Network connection failed while calling XAI API');
        }
      }
      
      throw error;
    }
  }

  async generateEnhancedSummary(policyData: PolicyData, clientContext: string = '', summaryLength: 'short' | 'detailed' = 'detailed'): Promise<string> {
    const isDeployed = !!process.env.REPL_ID;
    
    try {
      console.log(`🔌 Generating ${summaryLength} summary with XAI`);
      
      // Add timeout to prevent hanging requests
      const timeoutDuration = isDeployed ? 120000 : 60000; // 2 minutes for deployment, 1 minute for preview
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutDuration);

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
              content: summaryLength === 'short' ? 
                `You are an experienced insurance agent (20+ years) explaining a policy to a client in simple terms.

Create a single paragraph summary with a header in brackets [Your Coverage Summary] that:
• Uses everyday language, not insurance jargon
• Explains what the policy covers in practical terms
• Mentions key exclusions the client should know about
• Sounds like a friendly, knowledgeable agent explaining to a neighbor

Keep it 150-200 words in one flowing paragraph.` :
                `You are an elite business consultant with 20+ years of experience transforming insurance policies into strategic business intelligence. Your summaries are legendary for their ability to turn complex policy details into actionable business insights that drive client confidence and growth.

Create a comprehensive 5-paragraph summary with descriptive headers in brackets [like this]. Each paragraph should be 80-120 words of sophisticated business intelligence that demonstrates deep understanding of the client's industry and specific needs.

PARAGRAPH STRUCTURE:
1. [Policy Foundation & Strategic Value] - Establish the policy's role in business strategy, quantify protection value, and position as competitive advantage
2. [Core Liability Protection & Business Enablement] - Detail liability coverage with focus on revenue protection and operational confidence
3. [Property & Operational Safeguards] - Explain property coverage emphasizing business continuity and growth enablement
4. [Coverage Boundaries & Strategic Risk Management] - Transform exclusions into strategic business intelligence, identify opportunities for risk reduction and cost savings
5. [Partnership Support & Business Confidence] - Provide reassurance about Valley Trust's ongoing support and expertise

CRITICAL REQUIREMENTS:
• Write from perspective of highly intelligent, experienced insurance agent (20+ years)
• Focus on ROI, competitive advantages, and strategic business value
• Transform exclusions into actionable business intelligence
• Quantify financial protection and demonstrate practical scenarios
• Show how coverage drives business confidence and enables growth
• Use sophisticated business language that demonstrates expertise
• Include specific examples of how coverage protects revenue and operations
• Position as transformative business consulting, not just policy explanation

STRICT FINAL PARAGRAPH REQUIREMENTS:
• DO NOT schedule meetings or policy reviews
• DO NOT request immediate action items or appointments
• FOCUS ONLY on reassurance, support availability, and contact information
• Emphasize Valley Trust's ongoing partnership and expertise
• Invite questions and office visits for personalized assistance
• Provide comfort about coverage adequacy and professional support`
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

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Summary generation failed: ${response.status}`);
      }

      const data = await response.json();
      const summary = data.choices[0].message.content;
      
      console.log(`✅ Generated ${summaryLength} summary (${summary.length} chars)`);
      return summary;

    } catch (error) {
      console.error('❌ Summary generation failed:', error);
      throw error;
    }
  }
}

export const xaiService = new XAIService();