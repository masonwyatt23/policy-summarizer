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
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            border-bottom: 1px solid #000000;
            margin-bottom: 12px;
            background: #ffffff;
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
            padding: 15px 0;
            background: white;
            margin: 15px 0;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
        }
        
        .summary-wrapper {
            max-width: 100%;
        }
        
        .section-block {
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        
        .section-header {
            margin-bottom: 8px;
        }
        
        .subheader {
            font-size: 14px;
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
            font-size: 14px;
            line-height: 1.7;
            color: #1e293b;
            margin: 0 0 12px 0;
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
            font-size: 14px;
            line-height: 1.7;
            color: #1e293b;
            margin-bottom: 14px;
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
            font-size: 14px;
            min-width: 16px;
        }
        
        .bullet-content {
            flex: 1;
            font-size: 14px;
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
        
        .footer {
            margin-top: auto;
            padding: 12px 0 8px 0;
            text-align: center;
            background: #ffffff;
            border-top: 1px solid #000000;
            page-break-inside: avoid;
            flex-shrink: 0;
        }
        
        .footer p {
            color: #000000;
            font-size: 12px;
            margin: 4px 0;
            line-height: 1.4;
            font-weight: 500;
        }
        
        .footer .signature {
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px solid #000000;
        }
        
        .footer .signature p {
            font-style: italic;
            color: #000000;
            font-weight: 600;
            font-size: 11px;
            margin: 2px 0;
            line-height: 1.3;
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
            <img src="data:image/png;base64,${logoBase64}" alt="Valley Trust Insurance" class="logo">
            <div class="header-text">
                <h1>Valley Trust Insurance</h1>
                <p>Professional Policy Analysis & Summary</p>
            </div>
        </div>
        ` : ''}
        
        <div class="policy-header${options.clientLogo ? ' with-client-logo' : ''}">
            ${options.clientLogo ? `
            <div class="policy-header-with-logo">
                <div class="client-logo-section">
                    <img src="${options.clientLogo}" alt="Client Logo" style="max-height: 50px; max-width: 120px; object-fit: contain; border: 1px solid #dee2e6; border-radius: 2px; padding: 6px; background: white;">
                </div>
                <div class="policy-main-section">
                    <h1>${policyData.policyType} Policy</h1>
                    <p>Comprehensive Coverage Analysis</p>
                </div>
            </div>
            ` : `
            <h1>${policyData.policyType} Policy</h1>
            <p>Comprehensive Coverage Analysis</p>
            `}
            ${options.clientName || options.policyReference ? `
            <div class="policy-client-details">
                ${options.clientName ? `<div><strong>Prepared for:</strong> ${options.clientName}</div>` : ''}
                ${options.policyReference ? `<div><strong>Policy Reference:</strong> ${options.policyReference}</div>` : ''}
                <div><strong>Analysis Date:</strong> ${new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</div>
            </div>
            ` : ''}
        </div>

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

        ${options.includeBranding ? `
        <div class="footer">
            <p><strong>${options.agentProfile?.firmName || 'Valley Trust Insurance Group'}</strong></p>
            <p>${options.agentProfile?.firmAddress || '829 Greenville Ave, Staunton, VA 24401'} | ${options.agentProfile?.firmPhone || '(540) 885-5531'}</p>
            <p>${options.agentProfile?.firmWebsite || 'https://valleytrustinsurance.com'}</p>
            <div class="signature">
                <p>Anchoring You Through Life's Tough Storms</p>
                <p>There is no insurance solution we cannot solve, and no customer we cannot help.</p>
            </div>
        </div>
        ` : ''}
    </div>
</body>
</html>
    `;
  }

  private parseAndFormatSummary(summary: string): string {
    const paragraphs = summary.split('\n\n');
    let formattedHtml = '<div class="summary-wrapper">';
    
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      
      // Skip empty paragraphs
      if (paragraph === '') {
        formattedHtml += '<div class="paragraph-break"></div>';
        continue;
      }
      
      // Handle subheaders in brackets [like this] or **[like this]**
      const subheaderMatch = paragraph.match(/^(?:\*\*)?\[([^\]]+)\](?:\*\*)?\s*([\s\S]*)/);
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
      
      // Handle bold headings (**text**)
      if (paragraph.includes('**')) {
        const parts = paragraph.split('**');
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
      
      // Handle bullet points
      if (paragraph.startsWith('•')) {
        const bulletContent = paragraph.substring(1).trim();
        formattedHtml += `
          <div class="bullet-point">
            <span class="bullet-icon">•</span>
            <div class="bullet-content">${bulletContent}</div>
          </div>
        `;
        continue;
      }
      
      // Handle regular paragraphs
      if (paragraph.length > 0) {
        formattedHtml += `<p class="regular-paragraph">${paragraph}</p>`;
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
