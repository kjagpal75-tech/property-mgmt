const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteer.use(StealthPlugin());

/**
 * Extract property data from the provided Redfin URL
 */
async function extractFremontPropertyData() {
  let browser;
  let page;
  
  try {
    const propertyURL = 'https://www.redfin.com/CA/Fremont/37391-Mission-Blvd-94536/home/1211252';
    
    console.log('🚀 EXTRACTING FREMONT PROPERTY DATA...');
    console.log('🔍 Property URL:', propertyURL);
    
    browser = await puppeteer.launch({
      headless: false,  // Show browser so you can see navigation
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('✅ Browser setup complete');
    
    // Navigate directly to property URL
    console.log('🌐 Navigating to Fremont property page...');
    await page.goto(propertyURL, {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });
    
    console.log('✅ Navigated to property page');
    
    // Wait for page to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Extract comprehensive property data
    const propertyData = await page.evaluate(() => {
      const pageText = document.body.innerText;
      
      // Extract market value (look for various price patterns)
      const pricePatterns = [
        /\$[\d,]+/g,  // General price pattern
        /Est\.?\s*value[:\s]*\$[\d,]+/i,  // Estimated value
        /Redfin\s*Estimate[:\s]*\$[\d,]+/i,  // Redfin estimate
        /Market\s*Value[:\s]*\$[\d,]+/i,  // Market value
        /List\s*Price[:\s]*\$[\d,]+/i,  // List price
        /Rent[:\s]*\$[\d,]+/i,  // Rent price
      ];
      
      let marketValue = null;
      let rentPrice = null;
      
      for (const pattern of pricePatterns) {
        const matches = pageText.match(pattern);
        if (matches && matches.length > 0) {
          for (const match of matches) {
            const price = parseFloat(match.replace(/[$,]/g, ''));
            if (price > 1000000) {  // Likely market value
              marketValue = price;
            } else if (price > 1000 && price < 10000) {  // Likely rent
              rentPrice = price;
            }
          }
        }
      }
      
      // Extract bedrooms
      const bedMatch = pageText.match(/(\d+)\s*beds?/i);
      const bedrooms = bedMatch ? parseInt(bedMatch[1]) : null;
      
      // Extract bathrooms
      const bathMatch = pageText.match(/(\d+(?:\.\d+)?)\s*baths?/i);
      const bathrooms = bathMatch ? parseFloat(bathMatch[1]) : null;
      
      // Extract square footage
      const sqftMatch = pageText.match(/(\d+(?:,\d+)*)\s*sq\s*ft/i);
      const squareFootage = sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, '')) : null;
      
      // Extract year built
      const yearMatch = pageText.match(/\b(19|20)\d{2}\b/g);
      const yearBuilt = yearMatch ? parseInt(yearMatch[yearMatch.length - 1]) : null;
      
      // Extract lot size
      const lotMatch = pageText.match(/(\d+(?:,\d+)*)\s*sq\s*ft\s*lot/i);
      const lotSize = lotMatch ? parseInt(lotMatch[1].replace(/,/g, '')) : null;
      
      // Extract property type
      const typeMatch = pageText.match(/(single\s*family|condo|townhouse|multi\s*family|apartment)/i);
      const propertyType = typeMatch ? typeMatch[1] : null;
      
      // Extract address
      const addressMatch = pageText.match(/(\d+\s+[\w\s]+,\s*[A-Z]{2}\s*\d{5})/);
      const address = addressMatch ? addressMatch[1] : '37391 Mission Blvd, Fremont, CA 94536';
      
      // Extract status (for rent, for sale, etc.)
      const statusMatch = pageText.match(/(for\s*rent|for\s*sale|off\s*market|sold)/i);
      const status = statusMatch ? statusMatch[1] : null;
      
      return {
        marketValue,
        rentPrice,
        bedrooms,
        bathrooms,
        squareFootage,
        yearBuilt,
        lotSize,
        propertyType,
        address,
        status,
        url: window.location.href,
        title: document.title,
        sampleText: pageText.substring(0, 2000)
      };
    });
    
    console.log('📊 FREMONT PROPERTY DATA EXTRACTED:');
    console.log(`💰 Market Value: $${propertyData.marketValue ? propertyData.marketValue.toLocaleString() : 'N/A'}`);
    console.log(`🏠 Rent Price: $${propertyData.rentPrice ? propertyData.rentPrice.toLocaleString() : 'N/A'}`);
    console.log(`🏠 Bedrooms: ${propertyData.bedrooms || 'N/A'}`);
    console.log(`🚿 Bathrooms: ${propertyData.bathrooms || 'N/A'}`);
    console.log(`📐 Square Feet: ${propertyData.squareFootage ? propertyData.squareFootage.toLocaleString() : 'N/A'}`);
    console.log(`📅 Year Built: ${propertyData.yearBuilt || 'N/A'}`);
    console.log(`🏡 Lot Size: ${propertyData.lotSize ? propertyData.lotSize.toLocaleString() : 'N/A'}`);
    console.log(`🏘️ Property Type: ${propertyData.propertyType || 'N/A'}`);
    console.log(`📍 Address: ${propertyData.address || 'N/A'}`);
    console.log(`📊 Status: ${propertyData.status || 'N/A'}`);
    console.log(`🌐 URL: ${propertyData.url}`);
    
    // Take screenshot
    await page.screenshot({ path: 'fremont-property-extraction.png' });
    console.log('✅ Screenshot saved: fremont-property-extraction.png');
    
    // Keep browser open for inspection
    console.log('🔄 Keeping browser open for 15 seconds...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    return { 
      success: true, 
      propertyData
    };
    
  } catch (error) {
    console.error('❌ Fremont property extraction error:', error.message);
    return { success: false, error: error.message };
  } finally {
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Main function to extract Fremont property data
 */
async function runFremontPropertyExtraction() {
  console.log('=== FREMONT PROPERTY DATA EXTRACTION ===');
  console.log('🔍 Extracting property data from 37391 Mission Blvd, Fremont, CA 94536');
  console.log('🌐 URL: https://www.redfin.com/CA/Fremont/37391-Mission-Blvd-94536/home/1211252');
  
  const result = await extractFremontPropertyData();
  
  if (result.success) {
    console.log('🎉 FREMONT PROPERTY DATA EXTRACTION SUCCESS!');
    console.log('✅ Direct URL bypassed search detection!');
    console.log('✅ Property data extracted successfully!');
    
    // Return the property data for use
    return result.propertyData;
  } else {
    console.log('❌ FREMONT PROPERTY DATA EXTRACTION FAILED!');
    console.log(`🔧 Error: ${result.error}`);
    return null;
  }
}

// Run the extraction
runFremontPropertyExtraction().catch(console.error);
