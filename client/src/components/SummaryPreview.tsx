import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Maximize2 } from 'lucide-react';
import { ProcessedDocument } from '@/lib/api';
import logoPath from '@assets/Valley-Trust-Insurance-Logo_1751344889285.png';

interface SummaryPreviewProps {
  document: ProcessedDocument | null;
  isLoading: boolean;
}

export function SummaryPreview({ document, isLoading }: SummaryPreviewProps) {
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!document || !document.extractedData) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p>Upload and process a document to see the summary preview.</p>
      </div>
    );
  }

  const policyData = document.extractedData;

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Policy Summary Preview</h2>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Header with Logo */}
        <div className="bg-slate-50 p-6 rounded-lg mb-6">
          <div className="flex items-start space-x-4">
            <img src={logoPath} alt="Valley Trust Insurance" className="h-12 w-auto" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {policyData.policyType || 'Insurance Policy'}
              </h3>
              <p className="text-sm text-slate-600">Policy Summary for Client Review</p>
            </div>
          </div>
        </div>

        {/* Generated Summary Text */}
        {document.summary && (
          <div className="mb-6 p-6 bg-white border border-slate-200 rounded-lg shadow-sm">
            <h4 className="font-semibold text-slate-900 mb-4 flex items-center">
              <span className="mr-2">📄</span>AI-Generated Summary
            </h4>
            <div className="prose prose-sm max-w-none">
              <div className="text-sm text-slate-900 font-sans leading-relaxed bg-slate-50 p-4 rounded border">
                {document.summary.split('\n').map((line, index) => {
                  // Handle bold text (**text**)
                  if (line.includes('**')) {
                    const parts = line.split('**');
                    return (
                      <p key={index} className="mb-2">
                        {parts.map((part, partIndex) => 
                          partIndex % 2 === 1 ? (
                            <strong key={partIndex} className="font-semibold text-slate-900">{part}</strong>
                          ) : (
                            part
                          )
                        )}
                      </p>
                    );
                  }
                  // Handle bullet points
                  else if (line.trim().startsWith('•')) {
                    return (
                      <div key={index} className="ml-4 mb-1 text-slate-700">
                        {line.trim()}
                      </div>
                    );
                  }
                  // Handle empty lines
                  else if (line.trim() === '') {
                    return <div key={index} className="h-2"></div>;
                  }
                  // Regular text
                  else {
                    return (
                      <p key={index} className="mb-2 text-slate-700">
                        {line}
                      </p>
                    );
                  }
                })}
              </div>
            </div>
          </div>
        )}

        {/* Coverage Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
              <span className="mr-2">🛡️</span>Coverage Highlights
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {policyData.coverageDetails?.map((coverage: any, index: number) => (
                <li key={index}>
                  • {coverage.type}: {coverage.limit}
                  {coverage.deductible && ` (Deductible: ${coverage.deductible})`}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2 flex items-center">
              <span className="mr-2">👥</span>Eligibility
            </h4>
            <ul className="text-sm text-green-800 space-y-1">
              {policyData.eligibility?.ageLimit && (
                <li>• Age: {policyData.eligibility.ageLimit}</li>
              )}
              {policyData.eligibility?.maxDuration && (
                <li>• Duration: {policyData.eligibility.maxDuration}</li>
              )}
              {policyData.eligibility?.restrictions?.map((restriction: string, index: number) => (
                <li key={index}>• {restriction}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Why It Matters Section */}
        {policyData.whyItMatters && (
          <div className="border-l-4 border-valley-secondary pl-4 mb-4">
            <h4 className="font-semibold text-slate-900 mb-2">Why This Coverage Matters</h4>
            <p className="text-slate-700 text-sm leading-relaxed">
              {policyData.whyItMatters}
            </p>
          </div>
        )}

        {/* Key Benefits */}
        {policyData.keyBenefits && policyData.keyBenefits.length > 0 && (
          <div className="border-l-4 border-valley-primary pl-4">
            <h4 className="font-semibold text-slate-900 mb-2">Key Benefits Explained</h4>
            <div className="space-y-2 text-sm text-slate-700">
              {policyData.keyBenefits.map((benefit: any, index: number) => (
                <p key={index}>• {typeof benefit === 'string' ? benefit : benefit.benefit}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
