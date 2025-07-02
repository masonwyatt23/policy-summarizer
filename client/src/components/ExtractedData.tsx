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
          <div className="h-6 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-muted h-32 rounded-lg"></div>
              <div className="bg-muted h-24 rounded-lg"></div>
            </div>
            <div className="space-y-4">
              <div className="bg-muted h-24 rounded-lg"></div>
              <div className="bg-muted h-32 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!document || !document.extractedData) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>No extracted data available. Please process a document first.</p>
      </div>
    );
  }

  const policyData = document.extractedData;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Extracted Policy Data</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Coverage Limits */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-foreground mb-3">Coverage Limits</h3>
            <div className="space-y-2 text-sm">
              {policyData.coverageDetails?.map((coverage: any, index: number) => (
                <div key={index} className="flex justify-between">
                  <span className="text-muted-foreground">{coverage.type}:</span>
                  <span className="font-medium text-foreground">{coverage.limit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Policy Terms */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-foreground mb-3">Policy Terms</h3>
            <div className="space-y-2 text-sm">
              {policyData.eligibility?.maxDuration && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Maximum Duration:</span>
                  <span className="font-medium text-foreground">{policyData.eligibility.maxDuration}</span>
                </div>
              )}
              {policyData.eligibility?.ageLimit && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age Limit:</span>
                  <span className="font-medium text-foreground">{policyData.eligibility.ageLimit}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Policy Type:</span>
                <span className="font-medium text-foreground">{policyData.policyType}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Important Exclusions */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-foreground mb-3">Important Exclusions</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              {policyData.exclusions?.map((exclusion: any, index: number) => (
                <li key={index}>• {typeof exclusion === 'string' ? exclusion : exclusion.description}</li>
              ))}
            </ul>
          </div>

          {/* Contact Information */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-foreground mb-3">Contact Information</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              {policyData.importantContacts?.insurer && (
                <p><strong className="text-foreground">Insurer:</strong> {policyData.importantContacts.insurer}</p>
              )}
              {policyData.importantContacts?.administrator && (
                <p><strong className="text-foreground">Administrator:</strong> {policyData.importantContacts.administrator}</p>
              )}
              {policyData.importantContacts?.emergencyLine && (
                <p><strong className="text-foreground">Emergency Line:</strong> {policyData.importantContacts.emergencyLine}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
