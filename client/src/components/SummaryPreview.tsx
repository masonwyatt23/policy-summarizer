import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProcessedDocument {
  id: number;
  originalName: string;
  extractedData: any;
  summary: string;
  processed: boolean;
  uploadedAt: string;
}

interface SummaryPreviewProps {
  document: ProcessedDocument | null;
  isLoading: boolean;
}

export function SummaryPreview({ document, isLoading }: SummaryPreviewProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!document || !document.extractedData) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-slate-500">
          <p>No document selected or analysis not complete</p>
        </CardContent>
      </Card>
    );
  }

  const policyData = document.extractedData;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <span className="mr-2">📊</span>Policy Analysis Summary
        </h3>
        
        {/* Executive Summary Card */}
        <div className="mb-8 p-8 bg-gradient-to-br from-valley-primary/5 to-valley-secondary/5 border border-valley-primary/20 rounded-xl shadow-lg">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-valley-primary rounded-xl flex items-center justify-center mr-4">
              <span className="text-white text-xl">📋</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{policyData.policyType}</h3>
              <p className="text-slate-600 text-lg">{policyData.insurer}</p>
            </div>
          </div>
          
          {/* Policy Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {policyData.importantContacts?.policyNumber && (
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Policy Number</p>
                <p className="font-semibold text-slate-900">{policyData.importantContacts.policyNumber}</p>
              </div>
            )}
            {policyData.importantContacts?.agent && (
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Insurance Agent</p>
                <p className="font-semibold text-slate-900">{policyData.importantContacts.agent}</p>
              </div>
            )}
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Policy Term</p>
              <p className="font-semibold text-slate-900">{policyData.eligibility?.maxDuration || "12 months"}</p>
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center bg-white p-4 rounded-lg border border-slate-200">
              <p className="text-2xl font-bold text-valley-primary">
                {policyData.coverageDetails?.length || 0}
              </p>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Coverage Types</p>
            </div>
            <div className="text-center bg-white p-4 rounded-lg border border-slate-200">
              <p className="text-2xl font-bold text-valley-secondary">
                {policyData.keyBenefits?.length || 0}
              </p>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Key Benefits</p>
            </div>
            <div className="text-center bg-white p-4 rounded-lg border border-slate-200">
              <p className="text-2xl font-bold text-emerald-600">
                {policyData.exclusions?.length || 0}
              </p>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Exclusions</p>
            </div>
            <div className="text-center bg-white p-4 rounded-lg border border-slate-200">
              <p className="text-2xl font-bold text-blue-600">✓</p>
              <p className="text-xs text-slate-500 uppercase tracking-wide">AI Analyzed</p>
            </div>
          </div>

          {/* Enhanced AI Summary */}
          {document.summary && (
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-4 flex items-center">
                <span className="mr-2">🤖</span>AI-Generated Professional Summary
              </h4>
              <div className="prose prose-sm max-w-none">
                <div className="text-sm text-slate-900 font-sans leading-relaxed">
                  {document.summary.split('\n').map((line, index) => {
                    // Handle bold text (**text**)
                    if (line.includes('**')) {
                      const parts = line.split('**');
                      return (
                        <p key={index} className="mb-3">
                          {parts.map((part, partIndex) => 
                            partIndex % 2 === 1 ? (
                              <strong key={partIndex} className="font-semibold text-valley-primary">{part}</strong>
                            ) : (
                              part
                            )
                          )}
                        </p>
                      );
                    }
                    // Handle bullet points with enhanced styling
                    else if (line.trim().startsWith('•')) {
                      return (
                        <div key={index} className="flex items-start ml-4 mb-2">
                          <span className="text-valley-primary mr-2 mt-1">•</span>
                          <span className="text-slate-700">{line.trim().substring(1).trim()}</span>
                        </div>
                      );
                    }
                    // Handle empty lines
                    else if (line.trim() === '') {
                      return <div key={index} className="h-3"></div>;
                    }
                    // Regular text
                    else {
                      return (
                        <p key={index} className="mb-3 text-slate-700 leading-relaxed">
                          {line}
                        </p>
                      );
                    }
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Coverage Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
              <span className="mr-2">🛡️</span>Coverage Details
            </h4>
            <div className="space-y-3">
              {policyData.coverageDetails?.map((coverage: any, index: number) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-blue-900">{coverage.type}</span>
                    <span className="text-lg font-bold text-blue-700">{coverage.limit}</span>
                  </div>
                  {coverage.deductible && (
                    <p className="text-sm text-blue-600">Deductible: {coverage.deductible}</p>
                  )}
                  {coverage.description && (
                    <p className="text-sm text-slate-600 mt-2">{coverage.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-4 flex items-center">
              <span className="mr-2">✨</span>Key Benefits
            </h4>
            <div className="space-y-3">
              {policyData.keyBenefits?.map((benefit: any, index: number) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1 text-lg">•</span>
                    <div>
                      <p className="font-medium text-green-900">
                        {typeof benefit === 'string' ? benefit : benefit.benefit}
                      </p>
                      {benefit.description && (
                        <p className="text-sm text-slate-600 mt-1">{benefit.description}</p>
                      )}
                      {benefit.importance && (
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded mt-2 ${
                          benefit.importance === 'critical' ? 'bg-red-100 text-red-800' :
                          benefit.importance === 'high' ? 'bg-orange-100 text-orange-800' :
                          benefit.importance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {benefit.importance} importance
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Why It Matters Section */}
        {policyData.whyItMatters && (
          <div className="border-l-4 border-valley-secondary pl-6 mb-6 bg-valley-secondary/5 p-6 rounded-r-lg">
            <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
              <span className="mr-2">💡</span>Why This Coverage Matters
            </h4>
            <p className="text-slate-700 leading-relaxed">
              {policyData.whyItMatters}
            </p>
          </div>
        )}

        {/* Risk Assessment Section */}
        {policyData.riskAssessment && (
          <div className="bg-amber-50 p-6 rounded-lg border border-amber-200 mb-6">
            <h4 className="font-semibold text-amber-900 mb-4 flex items-center">
              <span className="mr-2">⚠️</span>Risk Assessment & Scenarios
            </h4>
            
            {policyData.riskAssessment.scenarios && policyData.riskAssessment.scenarios.length > 0 && (
              <div className="space-y-4 mb-4">
                <h5 className="font-medium text-amber-800">Coverage Scenarios:</h5>
                {policyData.riskAssessment.scenarios.map((scenario: any, index: number) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="font-medium text-slate-900 mb-2">{scenario.situation}</p>
                    <p className="text-sm text-blue-700 mb-1">
                      <strong>Coverage:</strong> {scenario.coverage}
                    </p>
                    <p className="text-sm text-green-700">
                      <strong>Outcome:</strong> {scenario.outcome}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {policyData.riskAssessment.recommendations && policyData.riskAssessment.recommendations.length > 0 && (
              <div>
                <h5 className="font-medium text-amber-800 mb-2">Risk Management Recommendations:</h5>
                <ul className="space-y-1">
                  {policyData.riskAssessment.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-sm text-amber-700 flex items-start">
                      <span className="mr-2">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Important Exclusions */}
        <div className="bg-red-50 p-6 rounded-lg border border-red-200 mb-6">
          <h4 className="font-semibold text-red-900 mb-4 flex items-center">
            <span className="mr-2">🚫</span>Important Exclusions
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policyData.exclusions?.map((exclusion: any, index: number) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                <p className="font-medium text-red-800 mb-2">
                  {exclusion.category || "General Exclusion"}
                </p>
                <p className="text-sm text-slate-700 mb-2">
                  {typeof exclusion === 'string' ? exclusion : exclusion.description}
                </p>
                {exclusion.impact && (
                  <p className="text-xs text-red-600 font-medium">{exclusion.impact}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
          <h4 className="font-semibold text-slate-900 mb-4 flex items-center">
            <span className="mr-2">📞</span>Important Contact Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policyData.importantContacts?.insurer && (
              <div className="bg-white p-4 rounded-lg">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Insurance Company</p>
                <p className="font-semibold text-slate-900">{policyData.importantContacts.insurer}</p>
              </div>
            )}
            {policyData.importantContacts?.emergencyLine && (
              <div className="bg-white p-4 rounded-lg">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Emergency Line</p>
                <p className="font-semibold text-slate-900">{policyData.importantContacts.emergencyLine}</p>
              </div>
            )}
            {policyData.importantContacts?.administrator && (
              <div className="bg-white p-4 rounded-lg">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Administrator</p>
                <p className="font-semibold text-slate-900">{policyData.importantContacts.administrator}</p>
              </div>
            )}
            {policyData.importantContacts?.claimsEmail && (
              <div className="bg-white p-4 rounded-lg">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Claims Email</p>
                <p className="font-semibold text-slate-900">{policyData.importantContacts.claimsEmail}</p>
              </div>
            )}
          </div>
        </div>

        {/* Client Recommendations */}
        {policyData.clientRecommendations && policyData.clientRecommendations.length > 0 && (
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mt-6">
            <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
              <span className="mr-2">📋</span>Next Steps & Recommendations
            </h4>
            <ul className="space-y-2">
              {policyData.clientRecommendations.map((rec: string, index: number) => (
                <li key={index} className="text-sm text-blue-800 flex items-start">
                  <span className="text-blue-500 mr-2 mt-1">✓</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}