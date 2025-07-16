import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { PolicyData } from '@shared/schema';

export interface PDFOptions {
  clientName?: string;
  policyReference?: string;
  clientLogo?: string; // Base64 encoded image
  includeExplanations: boolean;
  includeTechnicalDetails: boolean;
  includeBranding: boolean;
  includeAgentSignature?: boolean;
  agentProfile?: {
    name: string;
    title: string;
    phone: string;
    email: string;
    license: string;
    signature: string;
    firmName: string;
    firmAddress: string;
    firmPhone: string;
    firmWebsite: string;
  };
}

export class PDFGenerator {
  async generatePolicyPDF(
    policyData: PolicyData,
    summary: string,
    options: PDFOptions
  ): Promise<Buffer> {
    const browser = await puppeteer.launch({
      executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ],
      headless: true,
    });

    try {
      const page = await browser.newPage();
      
      const html = this.generateHTML(policyData, summary, options);
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
        preferCSSPageSize: true,
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private generateHTML(policyData: PolicyData, summary: string, options: PDFOptions): string {
    const logoBase64 = this.getLogoBase64();
    
    // Parse and format the summary content with proper styling
    const formattedSummary = this.parseAndFormatSummary(summary);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Policy Summary - Valley Trust Insurance</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            line-height: 1.8;
            color: #1e293b;
            background: white;
            font-size: 13px;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        .page {
            max-width: 210mm;
            margin: 0 auto;
            padding: 0;
            height: 100vh;
            max-height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            border-bottom: 1px solid #000000;
            margin-bottom: 12px;
            background: #ffffff;
        }
        
        .header-left {
            display: flex;
            align-items: center;
        }
        
        .header-right {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .client-logo-header {
            height: 32px;
            max-width: 80px;
            object-fit: contain;
            border: 1px solid #dee2e6;
            border-radius: 2px;
            padding: 4px;
            background: white;
        }
        
        .client-info-header {
            text-align: right;
        }
        
        .client-name {
            font-size: 16px;
            font-weight: 700;
            color: #000000;
            margin: 0;
            line-height: 1.2;
        }
        
        .analysis-date {
            font-size: 11px;
            color: #666666;
            margin: 2px 0 0 0;
            font-style: italic;
            line-height: 1.2;
        }
        
        .logo {
            height: 32px;
            margin-right: 12px;
        }
        
        .header-text h1 {
            font-size: 16px;
            color: #000000;
            margin-bottom: 3px;
            font-weight: 700;
            letter-spacing: -0.025em;
            text-transform: uppercase;
        }
        
        .header-text p {
            color: #333333;
            font-size: 12px;
            font-style: italic;
            font-weight: 500;
        }
        
        .client-logo-section {
            flex-shrink: 0;
            text-align: center;
            min-width: 120px;
        }
        
        .policy-header {
            text-align: center;
            margin: 10px 0;
            padding: 10px;
            background: #f8f9fa;
            color: #000000;
            border: 1px solid #dee2e6;
            border-radius: 2px;
        }
        
        .policy-header.with-client-logo {
            text-align: left;
            padding: 12px;
        }
        
        .policy-header-with-logo {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 10px;
        }
        
        .policy-main-section {
            flex: 1;
            text-align: center;
        }
        
        .policy-client-details {
            padding-top: 10px;
            margin-top: 10px;
            border-top: 1px solid #dee2e6;
            font-size: 12px;
            color: #333;
        }
        
        .policy-client-details div {
            margin-bottom: 4px;
        }
        
        .policy-client-details strong {
            color: #000000;
            font-weight: 600;
        }
        
        .policy-header h1 {
            font-size: 16px;
            margin-bottom: 4px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .policy-header p {
            font-size: 12px;
            font-style: italic;
            font-weight: 500;
        }
        
        .summary-content {
            padding: 10px 0;
            background: white;
            margin: 10px 0;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            overflow-y: auto;
            min-height: 0;
        }
        
        .summary-wrapper {
            max-width: 100%;
        }
        
        .section-block {
            margin-bottom: 12px;
            page-break-inside: avoid;
        }
        
        .section-header {
            margin-bottom: 8px;
        }
        
        .subheader {
            font-size: 16px;
            color: #000000;
            margin: 0 0 8px 0;
            padding: 6px 0;
            border-bottom: 1px solid #000000;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background: #ffffff;
        }
        
        .section-content {
            margin-top: 0;
        }
        
        .section-paragraph {
            font-size: 16px;
            line-height: 1.7;
            color: #1e293b;
            margin: 0 0 8px 0;
            text-align: justify;
            hyphens: auto;
        }
        
        .main-heading {
            font-size: 18px;
            color: #000000;
            margin: 25px 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 3px solid #000000;
            font-weight: 700;
            letter-spacing: -0.025em;
            text-align: center;
            text-transform: uppercase;
        }
        
        .regular-paragraph {
            font-size: 16px;
            line-height: 1.7;
            color: #1e293b;
            margin-bottom: 10px;
            text-align: justify;
            hyphens: auto;
            text-indent: 0;
        }
        
        .paragraph-break {
            height: 12px;
        }
        
        .bullet-point {
            display: flex;
            align-items: flex-start;
            margin: 8px 0;
            padding-left: 20px;
        }
        
        .bullet-icon {
            color: #000000;
            font-weight: bold;
            margin-right: 12px;
            margin-top: 2px;
            font-size: 16px;
            min-width: 16px;
        }
        
        .bullet-content {
            flex: 1;
            font-size: 16px;
            line-height: 1.6;
            color: #000000;
            text-align: justify;
        }
        
        .coverage-highlights {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 25px 0;
        }
        
        .coverage-box {
            background: #f8f9fa;
            padding: 15px;
            border: 1px solid #dee2e6;
            margin-bottom: 15px;
            border-radius: 4px;
        }
        
        .coverage-box h3 {
            color: #000000;
            margin-bottom: 12px;
            font-size: 16px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .coverage-box ul {
            list-style: none;
        }
        
        .coverage-box li {
            margin: 6px 0;
            color: #000000;
            font-size: 12px;
            line-height: 1.5;
            display: flex;
            align-items: flex-start;
        }
        
        .coverage-box li::before {
            content: "•";
            color: #000000;
            font-weight: bold;
            margin-right: 8px;
            font-size: 12px;
            margin-top: 2px;
        }
        
        .contact-section {
            background: #ffffff;
            padding: 15px;
            margin: 15px 0;
            border: 2px solid #000000;
        }
        
        .contact-section h2 {
            color: #000000;
            margin-bottom: 12px;
            font-size: 16px;
            font-weight: 700;
            text-transform: uppercase;
            border-bottom: 2px solid #000000;
            padding-bottom: 6px;
        }
        
        .contact-section p {
            margin: 6px 0;
            font-size: 12px;
            color: #000000;
        }
        
        .contact-section strong {
            color: #000000;
            font-weight: 700;
        }
        

        
        .agent-signature {
            margin-top: auto;
            padding: 12px 0;
            background: #ffffff;
            text-align: left;
            border-top: 1px solid #000000;
            flex-shrink: 0;
        }
        
        .agent-signature h3 {
            color: #000000;
            font-size: 15px;
            margin-bottom: 8px;
            font-weight: 700;
            text-transform: uppercase;
        }
        
        .agent-signature .signature-content {
            white-space: pre-line;
            font-size: 13px;
            color: #000000;
            line-height: 1.5;
            margin-bottom: 8px;
            font-style: italic;
        }
        
        .agent-signature .agent-details {
            padding-top: 8px;
            margin-top: 8px;
            border-top: 1px solid #000000;
        }
        
        .agent-signature .agent-details p {
            margin: 4px 0;
            font-size: 12px;
            color: #000000;
            font-weight: 500;
        }
        
        .agent-signature .agent-details strong {
            color: #000000;
            font-weight: 700;
        }
        
        @media print {
            body { 
                font-size: 11px; 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .page-break { page-break-before: always; }
            .no-break { page-break-inside: avoid; }
        }
        
        @page {
            margin: 10mm;
            size: A4;
        }
        
        .page-break-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
        }
        
        .section-block {
            page-break-inside: avoid;
        }
    </style>
</head>
<body>
    <div class="page">
        ${options.includeBranding ? `
        <div class="header">
            <div class="header-left">
                <img src="data:image/png;base64,${logoBase64}" alt="Valley Trust Insurance" class="logo">
                <div class="header-text">
                    <h1>Valley Trust Insurance</h1>
                    <p>Professional Policy Analysis & Summary</p>
                </div>
            </div>
            ${options.clientName || options.clientLogo ? `
            <div class="header-right">
                ${options.clientLogo ? `
                <img src="${options.clientLogo}" alt="Client Logo" class="client-logo-header">
                ` : ''}
                ${options.clientName ? `
                <div class="client-info-header">
                    <p class="client-name">${options.clientName}</p>
                    <p class="analysis-date">${new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</p>
                </div>
                ` : ''}
            </div>
            ` : ''}
        </div>
        ` : ''}
        


        ${options.includeTechnicalDetails ? `
        <div class="coverage-highlights">
            <div class="coverage-box">
                <h3>Coverage Summary</h3>
                <ul>
                    ${policyData.coverageDetails?.slice(0, 6).map(coverage => 
                        `<li><strong>${coverage.type}:</strong> ${coverage.limit}${coverage.deductible ? ` (Deductible: ${coverage.deductible})` : ''}</li>`
                    ).join('')}
                </ul>
            </div>
            
            <div class="coverage-box">
                <h3>Key Contacts</h3>
                <ul>
                    ${policyData.importantContacts?.map(contact => {
                        if (typeof contact === 'object' && contact.details) {
                            return `<li><strong>${contact.type}:</strong> ${contact.details}</li>`;
                        }
                        return '';
                    }).filter(Boolean).join('')}
                </ul>
            </div>
        </div>
        ` : ''}

        <div class="summary-content">
            ${formattedSummary}
        </div>

        ${options.includeAgentSignature && options.agentProfile ? `
        <div class="agent-signature">
            <h3>Your Insurance Agent</h3>
            <div class="signature-content">${options.agentProfile.signature}</div>
            <div class="agent-details">
                <p><strong>Agent:</strong> ${options.agentProfile.name}, ${options.agentProfile.title}</p>
                <p><strong>License:</strong> ${options.agentProfile.license}</p>
                <p><strong>Direct Contact:</strong> ${options.agentProfile.phone} | ${options.agentProfile.email}</p>
                <p><strong>Firm:</strong> ${options.agentProfile.firmName}</p>
            </div>
        </div>
        ` : ''}


    </div>
</body>
</html>
    `;
  }

  private parseAndFormatSummary(summary: string): string {
    console.log('PDF Generator: Parsing summary content:');
    console.log('Raw summary:', summary);
    
    // First split by double newlines to get main sections
    const sections = summary.split('\n\n');
    let formattedHtml = '<div class="summary-wrapper">';
    
    console.log('PDF Generator: Found', sections.length, 'sections');
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      
      console.log(`PDF Generator: Processing section ${i}:`, section);
      
      // Skip empty sections
      if (section === '') {
        formattedHtml += '<div class="paragraph-break"></div>';
        continue;
      }
      
      // Handle bracket headers at the start of the section (like [Your Coverage Summary])
      if (section.startsWith('[') && section.includes(']')) {
        const lines = section.split('\n');
        const firstLine = lines[0].trim();
        
        console.log('PDF Generator: Found bracket section, first line:', firstLine);
        
        // Check if first line is a bracket header
        const bracketHeaderMatch = firstLine.match(/^\[([^\]]+)\]$/);
        if (bracketHeaderMatch) {
          const headerText = bracketHeaderMatch[1];
          const remainingContent = lines.slice(1).join('\n').trim();
          
          console.log('PDF Generator: Parsed bracket header:', headerText);
          console.log('PDF Generator: Remaining content:', remainingContent);
          
          formattedHtml += `
            <div class="section-block">
              <div class="section-header">
                <h3 class="subheader">${headerText}</h3>
              </div>
          `;
          
          // Parse the remaining content to separate paragraph from bullet points
          if (remainingContent) {
            const contentLines = remainingContent.split('\n');
            let paragraphLines = [];
            let bulletPoints = [];
            
            for (const line of contentLines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith('• ')) {
                bulletPoints.push(trimmedLine);
              } else if (trimmedLine) {
                paragraphLines.push(trimmedLine);
              }
            }
            
            // Add paragraph content
            if (paragraphLines.length > 0) {
              const paragraphText = paragraphLines.join(' ');
              formattedHtml += `<div class="section-content"><p class="section-paragraph">${paragraphText}</p></div>`;
            }
            
            // Add bullet points
            for (const bullet of bulletPoints) {
              const bulletContent = bullet.substring(1).trim();
              formattedHtml += `
                <div class="bullet-point">
                  <span class="bullet-icon">•</span>
                  <div class="bullet-content">${bulletContent}</div>
                </div>
              `;
            }
          }
          
          formattedHtml += `</div>`;
          continue;
        }
      }
      
      // Check if this section contains bullet points
      if (section.includes('•')) {
        // Split by single newlines to handle individual bullet points
        const lines = section.split('\n');
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          if (trimmedLine === '') continue;
          
          // Handle bullet points
          if (trimmedLine.startsWith('•')) {
            const bulletContent = trimmedLine.substring(1).trim();
            formattedHtml += `
              <div class="bullet-point">
                <span class="bullet-icon">•</span>
                <div class="bullet-content">${bulletContent}</div>
              </div>
            `;
          } else {
            // Handle regular text mixed with bullet points
            formattedHtml += `<p class="regular-paragraph">${trimmedLine}</p>`;
          }
        }
        continue;
      }
      
      // Handle subheaders in brackets [like this] or **[like this]**
      const subheaderMatch = section.match(/^(?:\*\*)?\[([^\]]+)\](?:\*\*)?\s*([\s\S]*)/);
      if (subheaderMatch) {
        const [, subheader, content] = subheaderMatch;
        formattedHtml += `
          <div class="section-block">
            <div class="section-header">
              <h3 class="subheader">${subheader}</h3>
            </div>
            ${content.trim() ? `<div class="section-content"><p class="section-paragraph">${content.trim()}</p></div>` : ''}
          </div>
        `;
        continue;
      }
      
      // Handle standalone bracket headers at the start of a section
      if (section.startsWith('[') && section.includes(']')) {
        const bracketMatch = section.match(/^\[([^\]]+)\]\s*([\s\S]*)/);
        if (bracketMatch) {
          const [, header, content] = bracketMatch;
          formattedHtml += `
            <div class="section-block">
              <div class="section-header">
                <h3 class="subheader">${header}</h3>
              </div>
              ${content.trim() ? `<div class="section-content"><p class="section-paragraph">${content.trim()}</p></div>` : ''}
            </div>
          `;
          continue;
        }
      }
      
      // Handle bold headings (**text**)
      if (section.includes('**')) {
        const parts = section.split('**');
        let processedLine = '';
        
        for (let j = 0; j < parts.length; j++) {
          if (j % 2 === 1) {
            // Bold text - make it a main heading
            processedLine += `<h2 class="main-heading">${parts[j]}</h2>`;
          } else if (parts[j].trim()) {
            // Regular text around the bold
            processedLine += `<p class="regular-paragraph">${parts[j].trim()}</p>`;
          }
        }
        formattedHtml += processedLine;
        continue;
      }
      
      // Handle regular paragraphs
      if (section.length > 0) {
        formattedHtml += `<p class="regular-paragraph">${section}</p>`;
      }
    }
    
    formattedHtml += '</div>';
    return formattedHtml;
  }

  private getLogoBase64(): string {
    try {
      const logoPath = path.resolve(process.cwd(), 'attached_assets', 'Valley-Trust-Insurance-Logo_1751344889285.png');
      const logoBuffer = fs.readFileSync(logoPath);
      return logoBuffer.toString('base64');
    } catch (error) {
      console.warn('Could not load logo file:', error);
      return '';
    }
  }
}

export const pdfGenerator = new PDFGenerator();
