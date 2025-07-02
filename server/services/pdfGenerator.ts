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
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background: white;
        }
        
        .header {
            display: flex;
            align-items: center;
            padding: 20px 0;
            border-bottom: 3px solid #1e3a8a;
            margin-bottom: 30px;
        }
        
        .logo {
            height: 60px;
            margin-right: 20px;
        }
        
        .header-text h1 {
            font-size: 24px;
            color: #1e3a8a;
            margin-bottom: 5px;
        }
        
        .header-text p {
            color: #64748b;
            font-size: 14px;
        }
        
        .policy-title {
            font-size: 28px;
            color: #1e3a8a;
            margin: 30px 0 20px 0;
            border-left: 4px solid #f59e0b;
            padding-left: 15px;
        }
        
        .summary-section {
            background: #f8fafc;
            padding: 25px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
        }
        
        .coverage-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 25px 0;
        }
        
        .coverage-box {
            background: #dbeafe;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #1e3a8a;
        }
        
        .coverage-box h3 {
            color: #1e3a8a;
            margin-bottom: 15px;
            font-size: 16px;
        }
        
        .coverage-box ul {
            list-style: none;
        }
        
        .coverage-box li {
            margin: 8px 0;
            color: #1e40af;
            font-size: 14px;
        }
        
        .coverage-box li::before {
            content: "•";
            color: #f59e0b;
            font-weight: bold;
            margin-right: 8px;
        }
        
        .benefits-section {
            background: #ecfdf5;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #10b981;
        }
        
        .exclusions-section {
            background: #fef2f2;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #ef4444;
        }
        
        .section-title {
            font-size: 18px;
            margin: 25px 0 15px 0;
            color: #1e3a8a;
        }
        
        .contact-info {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .client-info {
            text-align: right;
            margin-bottom: 20px;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 12px;
        }
        
        @media print {
            .page-break {
                page-break-before: always;
            }
        }
    </style>
</head>
<body>
    ${options.includeBranding ? `
    <div class="header">
        <img src="data:image/png;base64,${logoBase64}" alt="Valley Trust Insurance" class="logo">
        <div class="header-text">
            <h1>Valley Trust Insurance</h1>
            <p>Policy Summary & Analysis</p>
        </div>
    </div>
    ` : ''}
    
    ${options.clientName || options.policyReference ? `
    <div class="client-info">
        ${options.clientName ? `<div><strong>Prepared for:</strong> ${options.clientName}</div>` : ''}
        ${options.policyReference ? `<div><strong>Policy Reference:</strong> ${options.policyReference}</div>` : ''}
        <div><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
    </div>
    ` : ''}
    
    <h1 class="policy-title">${policyData.policyType}</h1>
    
    <div class="coverage-grid">
        <div class="coverage-box">
            <h3>Coverage Highlights</h3>
            <ul>
                ${policyData.coverageDetails.map(coverage => 
                    `<li>${coverage.type}: ${coverage.limit}${coverage.deductible ? ` (Deductible: ${coverage.deductible})` : ''}</li>`
                ).join('')}
            </ul>
        </div>
        
        <div class="coverage-box">
            <h3>Eligibility</h3>
            <ul>
                ${policyData.eligibility.ageLimit ? `<li>Age Limit: ${policyData.eligibility.ageLimit}</li>` : ''}
                ${policyData.eligibility.maxDuration ? `<li>Max Duration: ${policyData.eligibility.maxDuration}</li>` : ''}
                ${policyData.eligibility.restrictions ? policyData.eligibility.restrictions.map(r => `<li>${r}</li>`).join('') : ''}
            </ul>
        </div>
    </div>
    
    ${options.includeExplanations ? `
    <div class="summary-section">
        <h2 class="section-title">Why This Coverage Matters</h2>
        <p>${policyData.whyItMatters}</p>
    </div>
    
    <div class="benefits-section">
        <h2 class="section-title">Key Benefits Explained</h2>
        <ul>
            ${policyData.keyBenefits.map(benefit => `<li>${benefit}</li>`).join('')}
        </ul>
    </div>
    ` : ''}
    
    <div class="exclusions-section">
        <h2 class="section-title">Important Exclusions</h2>
        <ul>
            ${policyData.exclusions.map(exclusion => `<li>${exclusion}</li>`).join('')}
        </ul>
    </div>
    
    <div class="contact-info">
        <h2 class="section-title">Contact Information</h2>
        ${policyData.importantContacts.insurer ? `<p><strong>Insurer:</strong> ${policyData.importantContacts.insurer}</p>` : ''}
        ${policyData.importantContacts.administrator ? `<p><strong>Administrator:</strong> ${policyData.importantContacts.administrator}</p>` : ''}
        ${policyData.importantContacts.emergencyLine ? `<p><strong>Emergency Line:</strong> ${policyData.importantContacts.emergencyLine}</p>` : ''}
    </div>
    
    ${options.includeBranding ? `
    <div class="footer">
        <p>This summary was prepared by Valley Trust Insurance for client review purposes.</p>
        <p>Please refer to the complete policy document for full terms and conditions.</p>
    </div>
    ` : ''}
</body>
</html>
    `;
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
