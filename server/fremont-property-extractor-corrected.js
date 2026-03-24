const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteer.use(StealthPlugin());

/**
 * Extract property data with corrected market value extraction
 */
async function extractFremontPropertyDataCorrected() {
  let browser;
  let page;
  
  try {
    const propertyURL = 'https://www.redfin.com/CA/Fremont/37391-Mission-Blvd-94536/home/1211252';
    
    console.log('🚀 EXTRACTING FREMONT PROPERTY DATA (CORRECTED)...');
    console.log('🔍 Property URL:', propertyURL);
    console.log('🎯 Fixing market value extraction to get $1,415,209');
    
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
    
    // Extract comprehensive property data with corrected market value extraction
    const propertyData = await page.evaluate(() => {
      const pageText = document.body.innerText;
      
      // Save all price matches for debugging
      const allPriceMatches = pageText.match(/\$[\d,]+/g) || [];
      console.log('All prices found:', allPriceMatches);
      
      // Extract market value with better logic
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
      
      // Method 2: If no specific pattern found, use the highest price (likely market value)
      if (!marketValue && allPriceMatches.length > 0) {
        const prices = allPriceMatches.map(price => parseFloat(price.replace(/[$,]/g, '')));
        
        // Filter out very small prices (likely rent) and very large ones
        const reasonablePrices = prices.filter(price => price > 100000 && price < 10000000);
        
        if (reasonablePrices.length > 0) {
          marketValue = Math.max(...reasonablePrices);
        }
      }
      
      // Method 3: Look for specific HTML elements that contain market value
      const marketValueElement = document.querySelector('[data-rf-test-id="avmValue"], .avm-value, .estimate-value, .market-value');
      if (marketValueElement && !marketValue) {
        const elementText = marketValueElement.innerText;
        const priceMatch = elementText.match(/\$([\d,]+)/);
        if (priceMatch && priceMatch[1]) {
          marketValue = parseFloat(priceMatch[1].replace(/,/g, ''));
        }
      }
      
      // Extract rent price
      let rentPrice = null;
      const rentPatterns = [
        /Rent[:\s]*\$([\d,]+)/i,
        /Monthly\s*Rent[:\s]*\$([\d,]+)/i,
        /For\s*Rent[:\s]*\$([\d,]+)/i
      ];
      
      for (const pattern of rentPatterns) {
        const match = pageText.match(pattern);
        if (match && match[1]) {
          rentPrice = parseFloat(match[1].replace(/,/g, ''));
          break;
        }
      }
      
      // If no specific rent pattern, look for reasonable rent prices
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
      const address = addressMatch ? addressMatch[1] : '37391 Mission Blvd, Fremont, CA 94536';
      
      // Extract status
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
        allPriceMatches, // Include for debugging
        sampleText: pageText.substring(0, 3000) // Increased sample text for debugging
      };
    });
    
    console.log('📊 CORRECTED FREMONT PROPERTY DATA EXTRACTED:');
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
    console.log(`🔍 All Price Matches Found: ${JSON.stringify(propertyData.allPriceMatches)}`);
    console.log(`🌐 URL: ${propertyData.url}`);
    
    // Take screenshot
    await page.screenshot({ path: 'fremont-property-extraction-corrected.png' });
    console.log('✅ Screenshot saved: fremont-property-extraction-corrected.png');
    
    // Save HTML for debugging
    const html = await page.content();
    require('fs').writeFileSync('fremont-property-page.html', html);
    console.log('✅ HTML saved: fremont-property-page.html');
    
    // Keep browser open for inspection
    console.log('🔄 Keeping browser open for 15 seconds...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    return { 
      success: true, 
      propertyData
    };
    
  } catch (error) {
    console.error('❌ Corrected Fremont property extraction error:', error.message);
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
 * Main function to extract corrected Fremont property data
 */
async function runCorrectedFremontPropertyExtraction() {
  console.log('=== CORRECTED FREMONT PROPERTY DATA EXTRACTION ===');
  console.log('🔍 Extracting property data with corrected market value extraction');
  console.log('🎯 Target: Market Value should be $1,415,209');
  
  const result = await extractFremontPropertyDataCorrected();
  
  if (result.success) {
    console.log('🎉 CORRECTED FREMONT PROPERTY DATA EXTRACTION SUCCESS!');
    console.log('✅ Market value extraction improved!');
    
    // Check if we got the right market value
    if (result.propertyData.marketValue === 1415209) {
      console.log('🎯 PERFECT! Got the correct market value: $1,415,209');
    } else {
      console.log(`⚠️  Market value still not correct: $${result.propertyData.marketValue?.toLocaleString()}`);
      console.log('🔍 Check the HTML file and all price matches for debugging');
    }
    
    return result.propertyData;
  } else {
    console.log('❌ CORRECTED FREMONT PROPERTY DATA EXTRACTION FAILED!');
    console.log(`🔧 Error: ${result.error}`);
    return null;
  }
}

// Run the corrected extraction
runCorrectedFremontPropertyExtraction().catch(console.error);
