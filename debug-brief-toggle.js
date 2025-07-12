const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testBriefToggle() {
  // Create test file
  const testContent = `TEST POLICY DOCUMENT FOR BRIEF TOGGLE
  
Policy Number: BRIEF-TEST-001
Insured: Brief Toggle Test Company
Policy Type: General Liability Insurance
Coverage Amount: $1,000,000 per occurrence
Annual Premium: $2,400
Policy Period: 01/01/2025 - 01/01/2026

COVERAGE DETAILS:
- General Liability: $1,000,000 per occurrence, $2,000,000 aggregate
- Product Liability: $1,000,000 per occurrence  
- Professional Liability: $500,000 per claim
- Cyber Liability: $100,000 per incident

EXCLUSIONS:
- Intentional acts and criminal activity
- War, terrorism, and nuclear incidents
- Pollution (except sudden and accidental)
- Employment practices liability
- Professional services outside scope of business

CONTACT INFORMATION:
Valley Trust Insurance Group
Phone: (540) 885-5531
Email: jake@valleytrustinsurance.com
Address: 123 Insurance Way, Waynesboro, VA 22980

This is a comprehensive test document designed to verify the brief toggle functionality works correctly.`;

  fs.writeFileSync('test-brief.txt', testContent);
  
  // Test normal mode first
  console.log('Testing Normal Mode...');
  await testUpload('normal');
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test brief mode
  console.log('\nTesting Brief Mode...');
  await testUpload('brief');
  
  // Clean up
  fs.unlinkSync('test-brief.txt');
}

async function testUpload(summaryType) {
  const formData = new FormData();
  formData.append('document', fs.createReadStream('test-brief.txt'));
  formData.append('summaryType', summaryType);
  
  try {
    console.log(`Making upload request with summaryType: ${summaryType}`);
    
    const response = await fetch('http://localhost:5000/api/documents/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Add basic auth header for testing (this won't work in production)
        'Authorization': 'Bearer test-token'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Upload failed (${response.status}): ${errorText}`);
      return;
    }
    
    const result = await response.json();
    console.log(`Upload result:`, result);
    
    // Poll for completion
    if (result.documentId) {
      console.log(`Polling for completion of document ${result.documentId}...`);
      await pollForCompletion(result.documentId);
    }
  } catch (error) {
    console.error('Upload error:', error.message);
  }
}

async function pollForCompletion(documentId) {
  for (let i = 0; i < 30; i++) {
    try {
      const response = await fetch(`http://localhost:5000/api/documents/${documentId}/status`);
      
      if (!response.ok) {
        console.error(`Status check failed: ${response.status}`);
        break;
      }
      
      const status = await response.json();
      console.log(`Status: ${status.processed ? 'COMPLETED' : 'PROCESSING'}`);
      
      if (status.processed) {
        if (status.processingError) {
          console.error(`Processing error: ${status.processingError}`);
        } else {
          console.log(`Summary length: ${status.summary?.length || 0} characters`);
          console.log(`Summary paragraphs: ${status.summary?.split('\n\n').length || 0}`);
          console.log(`First 100 chars: ${status.summary?.substring(0, 100) || 'N/A'}`);
        }
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Polling error:', error.message);
      break;
    }
  }
}

testBriefToggle().catch(console.error);