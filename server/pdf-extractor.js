const pdfParse = require('pdf-parse');

/**
 * Extract text content from PDF buffer
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<Object>} Extracted text and metadata
 */
async function extractPDFText(pdfBuffer) {
  try {
    console.log('Starting PDF extraction...');
    console.log('PDF buffer size:', pdfBuffer.length);
    
    const data = await pdfParse(pdfBuffer);
    
    console.log('PDF parse result:', {
      numpages: data.numpages,
      pages: data.pages ? data.pages.length : 0,
      hasText: !!data.text,
      textLength: data.text ? data.text.length : 0,
      info: data.info,
      metadata: data.metadata
    });
    
    // Log each page content for debugging
    if (data.pages && data.pages.length > 0) {
      console.log('Page contents:');
      data.pages.forEach((page, index) => {
        console.log(`Page ${index + 1}:`, {
          text: page.text ? page.text.substring(0, 200) : 'No text',
          textLength: page.text ? page.text.length : 0
        });
      });
    }
    
    const extractedText = {
      text: data.text || '',
      pages: data.numpages || 0,
      info: data.info || {},
      metadata: data.metadata || {}
    };
    
    console.log('Final extraction result:', {
      success: true,
      textLength: extractedText.text.length,
      pages: extractedText.pages,
      hasText: extractedText.text.length > 0
    });
    
    return extractedText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    throw new Error('Failed to extract text from PDF');
  }
}

module.exports = { extractPDFText };
