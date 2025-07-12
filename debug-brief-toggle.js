// Debug script to test brief toggle functionality
const fs = require('fs');
const path = require('path');

async function testBriefToggle() {
  console.log('🔍 Testing brief toggle functionality...');
  
  // Test 1: Check if frontend is sending correct parameters
  console.log('\n--- Test 1: Frontend Parameter Check ---');
  const formData = new FormData();
  formData.append('summaryType', 'brief');
  
  // Log what we're sending
  console.log('Sending summaryType:', formData.get('summaryType'));
  
  // Test 2: Check backend route handling
  console.log('\n--- Test 2: Backend Route Check ---');
  
  // Create a simple test file for upload
  const testContent = `
    POLICY DOCUMENT
    
    Policy Number: TEST-123
    Insured: Test Business
    Policy Type: General Liability
    Coverage Limits: $1,000,000
    
    This is a test policy document for verifying brief summary functionality.
    The brief toggle should produce a single comprehensive paragraph instead of 5 separate paragraphs.
  `;
  
  const testFile = new Blob([testContent], { type: 'text/plain' });
  
  const uploadFormData = new FormData();
  uploadFormData.append('document', testFile, 'test-policy.txt');
  uploadFormData.append('summaryType', 'brief');
  
  console.log('Upload form data contains:');
  console.log('- document:', uploadFormData.has('document'));
  console.log('- summaryType:', uploadFormData.get('summaryType'));
  
  try {
    const response = await fetch('http://localhost:5000/api/documents/upload', {
      method: 'POST',
      body: uploadFormData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Upload successful:', result);
    
    // Monitor processing
    const documentId = result.documentId;
    console.log(`\n--- Monitoring Document ${documentId} Processing ---`);
    
    // Check processing status
    let attempts = 0;
    let processed = false;
    
    while (!processed && attempts < 15) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const statusResponse = await fetch(`http://localhost:5000/api/documents/${documentId}/status`);
        const status = await statusResponse.json();
        
        console.log(`Attempt ${attempts + 1}: Processing status:`, status.processed);
        
        if (status.processed) {
          processed = true;
          console.log('\n--- Processing Complete - Fetching Results ---');
          
          const docResponse = await fetch(`http://localhost:5000/api/documents/${documentId}`);
          const doc = await docResponse.json();
          
          console.log('Summary Analysis:');
          console.log('- Summary length:', doc.summary.length, 'characters');
          
          // Count paragraphs (split by double newlines)
          const paragraphs = doc.summary.split('\n\n').filter(p => p.trim().length > 0);
          console.log('- Paragraph count:', paragraphs.length);
          
          // Check for brief format indicators
          const hasBriefHeader = doc.summary.includes('[Executive Policy Analysis]');
          console.log('- Has brief header:', hasBriefHeader);
          
          // Show first 300 characters
          console.log('- First 300 chars:', doc.summary.substring(0, 300));
          
          // Determine if brief toggle worked
          if (paragraphs.length === 1 && hasBriefHeader) {
            console.log('\n✅ BRIEF TOGGLE WORKING - Single paragraph with proper header generated');
          } else if (paragraphs.length > 1) {
            console.log('\n❌ BRIEF TOGGLE NOT WORKING - Multiple paragraphs generated');
            console.log('Expected: 1 paragraph');
            console.log('Actual:', paragraphs.length, 'paragraphs');
          } else {
            console.log('\n⚠️ BRIEF TOGGLE PARTIAL - Single paragraph but missing header');
          }
          
          return;
        }
        
        if (status.processingError) {
          console.error('Processing error:', status.processingError);
          return;
        }
        
      } catch (error) {
        console.error('Status check error:', error);
      }
      
      attempts++;
    }
    
    console.log('\n❌ Processing timeout after 15 attempts');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
if (typeof window === 'undefined') {
  // Node.js environment
  console.log('Note: This test requires running in a browser environment with fetch API');
} else {
  // Browser environment
  testBriefToggle();
}