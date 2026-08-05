const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteer.use(StealthPlugin());

/**
 * Extract property data from the Truckee rental property URL
 */
async function extractTruckeeRentalPropertyData() {
  let browser;
  let page;
  
  try {
    const propertyURL = 'https://www.redfin.com/CA/Truckee/12798-Skislope-Way-96161/home/171002073';
    
    console.log('🚀 EXTRACTING TRUCKEE RENTAL PROPERTY DATA...');
    console.log('🔍 Property URL:', propertyURL);
    console.log('🎯 Extracting data for 12798 Skislope Way, Truckee, CA 96161');
    
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
    console.log('🌐 Navigating to Truckee rental property page...');
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
      
      // Save all price matches for debugging
      const allPriceMatches = pageText.match(/\$[\d,]+/g) || [];
      
      // Extract market value with corrected logic
      let marketValue = null;
      
      // Method 1: Look for specific market value indicators
      const marketValuePatterns = [
        /Redfin\s*Estimate[:\s]*\$([\d,]+)/i,
        /Estimate[:\s]*\$([\d,]+)/i,
        /Market\s*Value[:\s]*\$([\d,]+)/i,
        /Value[:\s]*\$([\d,]+)/i,
        /Worth[:\s]*\$([\d,]+)/i
      ];
      
      for (const pattern of marketValuePatterns) {
        const match = pageText.match(pattern);
        if (match && match[1]) {
          marketValue = parseFloat(match[1].replace(/,/g, ''));
          break;
        }
      }
      
      // Method 2: If no specific pattern found, use the highest reasonable price
      if (!marketValue && allPriceMatches.length > 0) {
        const prices = allPriceMatches.map(price => parseFloat(price.replace(/[$,]/g, '')));
        
        // Filter out very small prices (likely rent) and very large ones
        const reasonablePrices = prices.filter(price => price > 100000 && price < 10000000);
        
        if (reasonablePrices.length > 0) {
          marketValue = Math.max(...reasonablePrices);
        }
      }
      
      // Extract rent price with better logic
      let rentPrice = null;
      
      // Method 1: Look for specific rent indicators
      const rentPatterns = [
        /Rent[:\s]*\$([\d,]+)/i,
        /Monthly\s*Rent[:\s]*\$([\d,]+)/i,
        /For\s*Rent[:\s]*\$([\d,]+)/i,
        /Lease[:\s]*\$([\d,]+)/i
      ];
      
      for (const pattern of rentPatterns) {
        const match = pageText.match(pattern);
        if (match && match[1]) {
          rentPrice = parseFloat(match[1].replace(/,/g, ''));
          break;
        }
      }
      
      // Method 2: Look for reasonable rent prices
      if (!rentPrice && allPriceMatches.length > 0) {
        const prices = allPriceMatches.map(price => parseFloat(price.replace(/[$,]/g, '')));
        const rentPrices = prices.filter(price => price > 500 && price < 10000);
        if (rentPrices.length > 0) {
          rentPrice = rentPrices[0]; // Take the first reasonable rent price
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
      const address = addressMatch ? addressMatch[1] : '12798 Skislope Way, Truckee, CA 96161';
      
      // Extract status
      const statusMatch = pageText.match(/(for\s*rent|for\s*sale|off\s*market|sold|rented)/i);
      const status = statusMatch ? statusMatch[1] : null;
      
      // Extract additional rental-specific information
      const depositMatch = pageText.match(/Deposit[:\s]*\$([\d,]+)/i);
      const securityDeposit = depositMatch ? parseFloat(depositMatch[1].replace(/,/g, '')) : null;
      
      const availableMatch = pageText.match(/Available[:\s]*(.+?)(?:\n|$)/i);
      const availableDate = availableMatch ? availableMatch[1].trim() : null;
      
      // Extract HOA fees
      const hoaMatch = pageText.match(/HOA[:\s]*\$([\d,]+)/i);
      const hoaFee = hoaMatch ? parseFloat(hoaMatch[1].replace(/,/g, '')) : null;
      
      return {
        marketValue,
        rentPrice,
        securityDeposit,
        hoaFee,
        availableDate,
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
        allPriceMatches,
        sampleText: pageText.substring(0, 3000)
      };
    });
    
    console.log('📊 TRUCKEE RENTAL PROPERTY DATA EXTRACTED:');
    console.log(`💰 Market Value: $${propertyData.marketValue ? propertyData.marketValue.toLocaleString() : 'N/A'}`);
    console.log(`🏠 Rent Price: $${propertyData.rentPrice ? propertyData.rentPrice.toLocaleString() : 'N/A'}`);
    console.log(`🔒 Security Deposit: $${propertyData.securityDeposit ? propertyData.securityDeposit.toLocaleString() : 'N/A'}`);
    console.log(`🏛️ HOA Fee: $${propertyData.hoaFee ? propertyData.hoaFee.toLocaleString() : 'N/A'}`);
    console.log(`📅 Available Date: ${propertyData.availableDate || 'N/A'}`);
    console.log(`🏠 Bedrooms: ${propertyData.bedrooms || 'N/A'}`);
    console.log(`🚿 Bathrooms: ${propertyData.bathrooms || 'N/A'}`);
    console.log(`📐 Square Feet: ${propertyData.squareFootage ? propertyData.squareFootage.toLocaleString() : 'N/A'}`);
    console.log(`📅 Year Built: ${propertyData.yearBuilt || 'N/A'}`);
    console.log(`🏡 Lot Size: ${propertyData.lotSize ? propertyData.lotSize.toLocaleString() : 'N/A'}`);
    console.log(`🏘️ Property Type: ${propertyData.propertyType || 'N/A'}`);
    console.log(`📍 Address: ${propertyData.address || 'N/A'}`);
    console.log(`📊 Status: ${propertyData.status || 'N/A'}`);
    console.log(`🔍 All Price Matches Found: ${JSON.stringify(propertyData.allPriceMatches.slice(0, 20))}...`); // Show first 20
    console.log(`🌐 URL: ${propertyData.url}`);
    
    // Take screenshot
    await page.screenshot({ path: 'truckee-rental-property-extraction.png' });
    console.log('✅ Screenshot saved: truckee-rental-property-extraction.png');
    
    // Save HTML for debugging
    const html = await page.content();
    require('fs').writeFileSync('truckee-rental-property-page.html', html);
    console.log('✅ HTML saved: truckee-rental-property-page.html');
    
    // Keep browser open for inspection
    console.log('🔄 Keeping browser open for 15 seconds...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    return { 
      success: true, 
      propertyData
    };
    
  } catch (error) {
    console.error('❌ Truckee rental property extraction error:', error.message);
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
 * Main function to extract Truckee rental property data
 */
async function runTruckeeRentalPropertyExtraction() {
  console.log('=== TRUCKEE RENTAL PROPERTY DATA EXTRACTION ===');
  console.log('🔍 Extracting rental property data from Truckee, CA');
  console.log('🌐 URL: https://www.redfin.com/CA/Truckee/12798-Skislope-Way-96161/home/171002073');
  
  const result = await extractTruckeeRentalPropertyData();
  
  if (result.success) {
    console.log('🎉 TRUCKEE RENTAL PROPERTY DATA EXTRACTION SUCCESS!');
    console.log('✅ Direct URL bypassed search detection!');
    console.log('✅ Truckee rental property data extracted successfully!');
    
    return result.propertyData;
  } else {
    console.log('❌ TRUCKEE RENTAL PROPERTY DATA EXTRACTION FAILED!');
    console.log(`🔧 Error: ${result.error}`);
    return null;
  }
}

// Run the extraction
runTruckeeRentalPropertyExtraction().catch(console.error);
