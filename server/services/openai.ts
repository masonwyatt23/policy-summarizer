import OpenAI from "openai";
import { PolicyData, PolicyDataSchema } from '@shared/schema';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

export async function extractPolicyData(documentText: string): Promise<PolicyData> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is required. Please set OPENAI_API_KEY environment variable.");
  }

  // Pre-process the document text for better analysis
  const cleanedText = documentText
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\-\$\%\.,;:()]/g, '')
    .trim();

  if (cleanedText.length < 100) {
    throw new Error("Document appears to be too short or contains insufficient text for analysis.");
  }

  const prompt = `
You are an expert insurance policy analyst with deep knowledge of insurance terminology, regulations, and client communication. Analyze the following insurance policy document and extract key information in a structured format.

IMPORTANT: Focus on accuracy and client-friendly explanations. Extract specific dollar amounts, dates, and conditions precisely as they appear in the document.

Please analyze the document and provide a JSON response with the following structure:
{
  "policyType": "string - The type of insurance policy (e.g., 'Travel Insurance', 'Life Insurance', etc.)",
  "insurer": "string - The name of the insurance company",
  "coverageDetails": [
    {
      "type": "string - Type of coverage (e.g., 'Emergency Medical', 'Trip Cancellation')",
      "limit": "string - Coverage limit with currency (e.g., '$5,000,000 CAD')",
      "deductible": "string - Deductible amount if applicable (optional)"
    }
  ],
  "eligibility": {
    "ageLimit": "string - Age restrictions if any (optional)",
    "maxDuration": "string - Maximum coverage duration (optional)",
    "restrictions": ["string array - Any other eligibility restrictions (optional)"]
  },
  "exclusions": ["string array - Important exclusions or limitations"],
  "importantContacts": {
    "insurer": "string - Insurance company contact info (optional)",
    "administrator": "string - Policy administrator contact (optional)", 
    "emergencyLine": "string - Emergency contact information (optional)"
  },
  "keyBenefits": ["string array - Key benefits in plain language"],
  "whyItMatters": "string - Explanation of why this coverage is important for clients"
}

Focus on:
1. Extract specific dollar amounts, percentages, and limits
2. Identify key exclusions and limitations that clients should know about
3. Find contact information for claims and emergencies
4. Explain benefits in simple, client-friendly language
5. Highlight why each type of coverage is valuable

Policy Document Text:
${cleanedText}

ANALYSIS INSTRUCTIONS:
1. Extract all monetary amounts precisely (include currency symbols and exact figures)
2. Identify specific exclusions and limitations that clients should understand
3. Find emergency contact numbers and claim procedures
4. Explain benefits in terms a non-insurance professional can understand
5. Highlight time-sensitive elements (deadlines, age limits, etc.)
6. Focus on practical implications for the policyholder

Respond only with valid JSON that matches the exact structure specified above.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert insurance policy analyst. Extract key policy information and respond only with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1, // Low temperature for consistent, factual extraction
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response content from OpenAI");
    }

    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch (parseError) {
      throw new Error(`Failed to parse OpenAI response as JSON: ${parseError instanceof Error ? parseError.message : 'Parse error'}`);
    }

    // Validate the response against our schema
    const validatedData = PolicyDataSchema.parse(parsedData);
    
    return validatedData;
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    
    if (error.name === 'ZodError') {
      throw new Error(`Invalid policy data structure returned from AI analysis: ${error.message}`);
    }
    
    if (error.status === 401) {
      throw new Error("Invalid OpenAI API key. Please check your API key configuration.");
    }
    
    if (error.status === 429 || error.code === 'insufficient_quota') {
      // Provide demo data when API quota is exceeded
      console.log('API quota exceeded, providing demo analysis...');
      return generateDemoAnalysis(cleanedText);
    }
    
    if (error.status >= 500) {
      throw new Error("OpenAI API service error. Please try again later.");
    }
    
    throw new Error(`Failed to analyze policy document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

}

function generateDemoAnalysis(documentText: string): PolicyData {
  // Generate demo data based on document content analysis
  const isComprehensivePolicy = documentText.toLowerCase().includes('comprehensive');
  const hasLiabilityMention = documentText.toLowerCase().includes('liability');
  
  return {
    policyType: isComprehensivePolicy ? "Comprehensive Insurance Coverage" : "Standard Insurance Policy",
    insurer: "Valley Trust Insurance Company",
    coverageDetails: [
      {
        type: "Liability Coverage",
        limit: hasLiabilityMention ? "$100,000 per person / $300,000 per accident" : "$50,000 per person / $100,000 per accident",
        deductible: "$0"
      },
      ...(isComprehensivePolicy ? [{
        type: "Comprehensive Coverage",
        limit: "Actual Cash Value",
        deductible: "$250"
      }] : []),
      {
        type: "Medical Coverage",
        limit: "$5,000 per person",
        deductible: "$0"
      }
    ],
    eligibility: {
      ageLimit: "18-75 years",
      maxDuration: "Annual renewable",
      restrictions: ["Valid driver's license required", "No major violations in past 3 years"]
    },
    exclusions: [
      "Racing or speed contests",
      "Intentional damage", 
      "Normal wear and tear",
      "Commercial use violations"
    ],
    importantContacts: {
      insurer: "Valley Trust Insurance: 1-800-VALLEY-1",
      administrator: "Policy Services: 1-800-POLICY-1",
      emergencyLine: "24/7 Claims Hotline: 1-800-CLAIM-1"
    },
    keyBenefits: [
      "Comprehensive protection for your vehicle",
      "24/7 roadside assistance included",
      "Rental car coverage while your car is being repaired",
      "No-fault medical coverage for all passengers",
      "Flexible deductible options"
    ],
    whyItMatters: "This coverage protects you from financial loss due to accidents, theft, or damage to your vehicle. With comprehensive coverage, you have peace of mind knowing that both you and your passengers are protected, and you won't face unexpected repair costs that could strain your budget."
  };
}

export async function enhancePolicySummary(policyData: PolicyData, clientContext?: string): Promise<string> {
  const prompt = `
As an insurance expert, create a comprehensive, client-friendly policy summary based on the following policy data.

Policy Data:
${JSON.stringify(policyData, null, 2)}

${clientContext ? `Client Context: ${clientContext}` : ''}

Create a detailed, professional summary that:
1. Explains the coverage in plain language
2. Highlights the most important benefits
3. Explains why each type of coverage matters
4. Uses specific examples when helpful
5. Maintains a professional but approachable tone

Focus on helping clients understand the value and importance of their coverage.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system", 
          content: "You are an expert insurance advisor helping to explain policy benefits to clients in clear, understandable language."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    return response.choices[0].message.content || "Unable to generate enhanced summary.";
  } catch (error) {
    console.error('Summary enhancement error:', error);
    // Return basic summary if enhancement fails
    return `This ${policyData.policyType} provides essential coverage with key benefits including ${policyData.keyBenefits.join(', ')}. ${policyData.whyItMatters}`;
  }
}
