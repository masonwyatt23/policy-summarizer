import { ProcessedDocument } from '@/lib/api';

interface ExtractedDataProps {
  document: ProcessedDocument | null;
  isLoading: boolean;
}

export function ExtractedData({ document, isLoading }: ExtractedDataProps) {
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-slate-200 h-32 rounded-lg"></div>
              <div className="bg-slate-200 h-24 rounded-lg"></div>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-200 h-24 rounded-lg"></div>
              <div className="bg-slate-200 h-32 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!document || !document.extractedData) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p>No extracted data available. Please process a document first.</p>
      </div>
    );
  }

  const policyData = document.extractedData;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-6">Extracted Policy Data</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Coverage Limits */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-slate-900 mb-3">Coverage Limits</h3>
            <div className="space-y-2 text-sm">
              {policyData.coverageDetails?.map((coverage: any, index: number) => (
                <div key={index} className="flex justify-between">
                  <span className="text-slate-600">{coverage.type}:</span>
                  <span className="font-medium">{coverage.limit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Policy Terms */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-slate-900 mb-3">Policy Terms</h3>
            <div className="space-y-2 text-sm">
              {policyData.eligibility?.maxDuration && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Maximum Duration:</span>
                  <span className="font-medium">{policyData.eligibility.maxDuration}</span>
                </div>
              )}
              {policyData.eligibility?.ageLimit && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Age Limit:</span>
                  <span className="font-medium">{policyData.eligibility.ageLimit}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">Policy Type:</span>
                <span className="font-medium">{policyData.policyType}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Important Exclusions */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-slate-900 mb-3">Important Exclusions</h3>
            <ul className="text-sm text-slate-600 space-y-1">
              {policyData.exclusions?.map((exclusion: any, index: number) => (
                <li key={index}>• {typeof exclusion === 'string' ? exclusion : exclusion.description}</li>
              ))}
            </ul>
          </div>

          {/* Contact Information */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-slate-900 mb-3">Contact Information</h3>
            <div className="text-sm text-slate-600 space-y-1">
              {policyData.importantContacts?.insurer && (
                <p><strong>Insurer:</strong> {policyData.importantContacts.insurer}</p>
              )}
              {policyData.importantContacts?.administrator && (
                <p><strong>Administrator:</strong> {policyData.importantContacts.administrator}</p>
              )}
              {policyData.importantContacts?.emergencyLine && (
                <p><strong>Emergency Line:</strong> {policyData.importantContacts.emergencyLine}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
