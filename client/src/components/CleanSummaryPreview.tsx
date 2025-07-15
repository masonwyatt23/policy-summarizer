import { ProcessedDocument } from '@/lib/api';

interface CleanSummaryPreviewProps {
  document: ProcessedDocument | null;
  isLoading: boolean;
  editedSummary?: string;
}

export function CleanSummaryPreview({ document, isLoading, editedSummary }: CleanSummaryPreviewProps) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border p-8">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mb-6"></div>
          <div className="space-y-3">
            <div className="h-3 bg-muted rounded"></div>
            <div className="h-3 bg-muted rounded w-5/6"></div>
            <div className="h-3 bg-muted rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const summaryToDisplay = editedSummary || document?.summary || '';
  
  if (!document || !summaryToDisplay) {
    return (
      <div className="bg-muted/50 rounded-lg border border-border p-8 text-center">
        <p className="text-base text-muted-foreground">No summary available. Upload and process a document to see the analysis.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border">
      {/* Header */}
      <div className="border-b border-border px-8 py-6">
        <h2 className="text-3xl font-bold text-foreground mb-2">Policy Summary</h2>
        <p className="text-lg text-muted-foreground">Professional analysis of your insurance policy</p>
      </div>

      {/* Summary Content */}
      <div className="px-8 py-6">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <div className="text-foreground leading-relaxed space-y-4">
            {summaryToDisplay.split('\n\n').map((paragraph, index) => {
              // Skip empty lines
              if (paragraph.trim() === '') {
                return <div key={index} className="h-2"></div>;
              }

              // Check if paragraph starts with a subheader [like this] or **[like this]**
              const subheaderMatch = paragraph.match(/^(?:\*\*)?\[([^\]]+)\](?:\*\*)?\s*([\s\S]*)/);
              
              if (subheaderMatch) {
                const [, subheader, content] = subheaderMatch;
                
                // Check if content contains bullet points
                if (content.includes('\n•')) {
                  const [intro, ...bullets] = content.split('\n•');
                  return (
                    <div key={index} className="space-y-3">
                      <h3 className="text-xl font-semibold text-foreground border-b-2 border-valley-primary pb-2 mb-3 text-valley-primary">
                        {subheader}
                      </h3>
                      {intro.trim() && (
                        <p className="text-lg text-muted-foreground leading-relaxed">
                          {intro.trim()}
                        </p>
                      )}
                      <div className="space-y-2 ml-4">
                        {bullets.map((bullet, bulletIndex) => (
                          <div key={bulletIndex} className="flex items-start space-x-3">
                            <span className="text-valley-primary mt-1 font-semibold">•</span>
                            <span className="text-lg text-muted-foreground flex-1">
                              {bullet.trim()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div key={index} className="space-y-3">
                    <h3 className="text-xl font-semibold text-foreground border-b-2 border-valley-primary pb-2 mb-3 text-valley-primary">
                      {subheader}
                    </h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {content.trim()}
                    </p>
                  </div>
                );
              }

              // Handle bold headings (**text**)
              if (paragraph.includes('**')) {
                const parts = paragraph.split('**');
                return (
                  <div key={index} className="space-y-2">
                    {parts.map((part, partIndex) => {
                      if (partIndex % 2 === 1) {
                        // Bold text
                        return (
                          <h3 key={partIndex} className="text-xl font-semibold text-foreground mt-6 mb-3">
                            {part}
                          </h3>
                        );
                      } else if (part.trim()) {
                        // Regular text
                        return (
                          <p key={partIndex} className="text-lg text-muted-foreground mb-3">
                            {part}
                          </p>
                        );
                      }
                      return null;
                    })}
                  </div>
                );
              }

              // Handle bullet points
              if (paragraph.trim().startsWith('•')) {
                return (
                  <div key={index} className="flex items-start space-x-3 py-1">
                    <span className="text-valley-primary mt-1 font-semibold">•</span>
                    <span className="text-lg text-muted-foreground flex-1">
                      {paragraph.trim().substring(1).trim()}
                    </span>
                  </div>
                );
              }

              // Handle regular paragraphs
              return (
                <p key={index} className="text-lg text-muted-foreground mb-4 leading-relaxed">
                  {paragraph}
                </p>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-8 py-4 bg-muted/30">
        <p className="text-base text-muted-foreground text-center">
          Generated by Valley Trust Insurance Document Analysis System
        </p>
      </div>
    </div>
  );
}