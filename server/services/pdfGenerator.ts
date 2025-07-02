import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { PolicyData } from '@shared/schema';

export interface PDFOptions {
  clientName?: string;
  policyReference?: string;
  includeExplanations: boolean;
  includeTechnicalDetails: boolean;
  includeBranding: boolean;
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
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
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
            line-height: 1.7;
            color: #1e293b;
            background: white;
            font-size: 12px;
        }
        
        .page {
            max-width: 210mm;
            margin: 0 auto;
            padding: 0;
        }
        
        .header {
            display: flex;
            align-items: center;
            padding: 25px 0;
            border-bottom: 3px solid #1e3a8a;
            margin-bottom: 35px;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding-left: 20px;
            padding-right: 20px;
        }
        
        .logo {
            height: 70px;
            margin-right: 25px;
        }
        
        .header-text h1 {
            font-size: 32px;
            color: #1e3a8a;
            margin-bottom: 8px;
            font-weight: 700;
            letter-spacing: -0.025em;
        }
        
        .header-text p {
            color: #64748b;
            font-size: 16px;
            font-style: italic;
        }
        
        .client-info {
            text-align: right;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .client-info div {
            margin-bottom: 8px;
            font-size: 14px;
            color: #475569;
        }
        
        .client-info strong {
            color: #1e3a8a;
            font-weight: 600;
        }
        
        .policy-header {
            text-align: center;
            margin: 40px 0;
            padding: 30px;
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: white;
            border-radius: 15px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .policy-header h1 {
            font-size: 36px;
            margin-bottom: 10px;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .policy-header p {
            font-size: 18px;
            opacity: 0.9;
            font-style: italic;
        }
        
        .summary-content {
            padding: 35px;
            background: white;
            border-radius: 15px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border: 1px solid #e2e8f0;
            margin: 30px 0;
        }
        
        .summary-content h2 {
            font-size: 24px;
            color: #1e3a8a;
            margin: 35px 0 20px 0;
            padding-bottom: 12px;
            border-bottom: 3px solid #f59e0b;
            font-weight: 700;
            letter-spacing: -0.025em;
        }
        
        .summary-content h3 {
            font-size: 20px;
            color: #1e40af;
            margin: 28px 0 16px 0;
            font-weight: 600;
            line-height: 1.3;
        }
        
        .summary-content p {
            font-size: 14px;
            line-height: 1.8;
            color: #374151;
            margin-bottom: 18px;
            text-align: justify;
            hyphens: auto;
        }
        
        .bullet-point {
            display: flex;
            align-items: flex-start;
            margin: 12px 0;
            padding-left: 10px;
        }
        
        .bullet-point .bullet {
            color: #f59e0b;
            font-weight: bold;
            font-size: 16px;
            margin-right: 12px;
            margin-top: 2px;
        }
        
        .bullet-point .content {
            flex: 1;
            font-size: 14px;
            line-height: 1.7;
            color: #374151;
            text-align: justify;
        }
        
        .coverage-highlights {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
            margin: 35px 0;
        }
        
        .coverage-box {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            padding: 25px;
            border-radius: 12px;
            border-left: 5px solid #1e3a8a;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .coverage-box h3 {
            color: #1e3a8a;
            margin-bottom: 18px;
            font-size: 18px;
            font-weight: 600;
        }
        
        .coverage-box ul {
            list-style: none;
        }
        
        .coverage-box li {
            margin: 10px 0;
            color: #1e40af;
            font-size: 13px;
            line-height: 1.6;
            display: flex;
            align-items: flex-start;
        }
        
        .coverage-box li::before {
            content: "•";
            color: #f59e0b;
            font-weight: bold;
            margin-right: 10px;
            font-size: 14px;
            margin-top: 2px;
        }
        
        .contact-section {
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            padding: 30px;
            border-radius: 12px;
            margin: 30px 0;
            border: 1px solid #cbd5e1;
        }
        
        .contact-section h2 {
            color: #1e3a8a;
            margin-bottom: 20px;
            font-size: 20px;
            font-weight: 600;
        }
        
        .contact-section p {
            margin: 8px 0;
            font-size: 14px;
            color: #475569;
        }
        
        .contact-section strong {
            color: #1e3a8a;
            font-weight: 600;
        }
        
        .footer {
            margin-top: 50px;
            padding: 25px 0;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            background: #f8fafc;
        }
        
        .footer p {
            color: #64748b;
            font-size: 12px;
            margin: 8px 0;
            line-height: 1.6;
        }
        
        .footer .signature {
            margin-top: 20px;
            font-style: italic;
            color: #1e3a8a;
            font-weight: 600;
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
            margin: 20mm;
            size: A4;
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
        
        ${options.clientName || options.policyReference ? `
        <div class="client-info">
            ${options.clientName ? `<div><strong>Prepared for:</strong> ${options.clientName}</div>` : ''}
            ${options.policyReference ? `<div><strong>Policy Reference:</strong> ${options.policyReference}</div>` : ''}
            <div><strong>Analysis Date:</strong> ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}</div>
        </div>
        ` : ''}
        
        <div class="policy-header">
            <h1>${policyData.policyType} Policy</h1>
            <p>Comprehensive Coverage Analysis</p>
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

        ${options.includeBranding ? `
        <div class="footer">
            <p><strong>Valley Trust Insurance Group</strong></p>
            <p>829 Greenville Ave, Staunton, VA 24401 | (540) 885-5531</p>
            <p>jake@valleytrustinsurance.com | www.valleytrustinsurance.com</p>
            <div class="signature">
                <p>Professional Insurance Analysis & Consultation</p>
            </div>
        </div>
        ` : ''}
    </div>
</body>
</html>
    `;
  }

  private parseAndFormatSummary(summary: string): string {
    const lines = summary.split('\n');
    let formattedHtml = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (line === '') {
        formattedHtml += '<div style="height: 12px;"></div>';
        continue;
      }
      
      // Handle bold headings (**text**)
      if (line.includes('**')) {
        const parts = line.split('**');
        let processedLine = '';
        
        for (let j = 0; j < parts.length; j++) {
          if (j % 2 === 1) {
            // Bold text - make it a heading
            processedLine += `<h2>${parts[j]}</h2>`;
          } else if (parts[j].trim()) {
            // Regular text around the bold
            processedLine += `<p>${parts[j].trim()}</p>`;
          }
        }
        formattedHtml += processedLine;
        continue;
      }
      
      // Handle bullet points
      if (line.startsWith('•')) {
        const bulletContent = line.substring(1).trim();
        formattedHtml += `
          <div class="bullet-point">
            <span class="bullet">•</span>
            <div class="content">${bulletContent}</div>
          </div>
        `;
        continue;
      }
      
      // Handle regular paragraphs
      if (line.length > 0) {
        formattedHtml += `<p>${line}</p>`;
      }
    }
    
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
