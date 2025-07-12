// Test script to verify brief toggle functionality
const fs = require('fs');
const path = require('path');

async function testBriefToggle() {
  console.log('Testing brief toggle functionality...');
  
  // Create a test FormData with brief summaryType
  const testFileContent = Buffer.from('Test policy document content');
  const formData = new FormData();
  formData.append('document', new Blob([testFileContent], { type: 'application/pdf' }), 'test.pdf');
  formData.append('summaryType', 'brief');
  
  try {
    const response = await fetch('http://localhost:5000/api/documents/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      console.error('Upload failed:', await response.text());
      return;
    }
    
    const result = await response.json();
    console.log('Upload successful:', result);
    
    // Poll for processing completion
    const documentId = result.documentId;
    let processed = false;
    let attempts = 0;
    
    while (!processed && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(`http://localhost:5000/api/documents/${documentId}/status`);
      const status = await statusResponse.json();
      
      if (status.processed) {
        processed = true;
        console.log('Processing complete, fetching document...');
        
        const docResponse = await fetch(`http://localhost:5000/api/documents/${documentId}`);
        const doc = await docResponse.json();
        
        console.log('Summary format check:');
        console.log('Summary length:', doc.summary.length);
        console.log('Number of paragraphs:', doc.summary.split('\n\n').length);
        console.log('First 200 chars:', doc.summary.substring(0, 200));
        
        // Check if it's actually a single paragraph
        const paragraphs = doc.summary.split('\n\n').filter(p => p.trim().length > 0);
        console.log('Actual paragraph count:', paragraphs.length);
        
        if (paragraphs.length === 1) {
          console.log('✅ Brief toggle working correctly - single paragraph generated');
        } else {
          console.log('❌ Brief toggle not working - multiple paragraphs generated');
        }
        
        return;
      }
      
      attempts++;
    }
    
    console.log('Processing timeout');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testBriefToggle();