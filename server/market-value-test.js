const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteer.use(StealthPlugin());

/**
 * Test Market Value Extraction from Redfin
 */
async function testMarketValueExtraction() {
  let browser;
  let page;
  
  try {
    console.log('🚀 Starting market value extraction test...');
    
    // Launch stealth browser
    browser = await puppeteer.launch({
      headless: false,  // Show browser
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    
    page = await browser.newPage();
    
    // Set realistic browser settings
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('✅ Browser setup complete');
    
    // Go to Redfin
    await page.goto('https://www.redfin.com', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });
    
    console.log('✅ Redfin loaded');
    
    // Skip search and go directly to property URL
    console.log('� Going directly to property URL...');
    const propertyUrl = 'https://www.redfin.com/ca/fremont/37391-mission-blvd/home';
    console.log('� Direct URL:', propertyUrl);
    
    await page.goto(propertyUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });
    
    console.log('✅ Navigated to property URL');
    
    // Wait for property page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check current URL to verify we're on the right property page
    const currentUrl = page.url();
    console.log('📍 Current property page URL:', currentUrl);
    
    // Verify the URL contains property information
    if (currentUrl.includes('37391') || currentUrl.includes('mission') || currentUrl.includes('home')) {
      console.log('✅ Confirmed: We are on the correct property page');
    } else {
      console.log('⚠️  Warning: URL does not seem to match the property address');
      console.log('🔍 May need to navigate to property page manually');
    }
    
    // Check page title
    const pageTitle = await page.title();
    console.log('📄 Property page title:', pageTitle);
    
    // Take screenshot of property page
    await page.screenshot({ path: 'market-value-property-page.png' });
    console.log('✅ Property page screenshot saved');
    
    // Save HTML for debugging
    const htmlContent = await page.content();
    const fs = require('fs');
    fs.writeFileSync('market-value-property-page.html', htmlContent);
    console.log('✅ HTML saved for debugging');
    
    // Extract market value and property data
    console.log('🔍 Extracting market value and property data...');
    
    const propertyData = await page.evaluate(() => {
      const data = {};
      const pageText = document.body.innerText;
      
      console.log('Page text sample:', pageText.substring(0, 1000));
      
      // Extract price/market value - multiple approaches
      const pricePatterns = [
        /\$[\d,]+/g,  // Any dollar amount
        /price[:\s]*\$[\d,]+/i,  // Price: $123,456
        /market value[:\s]*\$[\d,]+/i,  // Market Value: $123,456
        /estimated value[:\s]*\$[\d,]+/i,  // Estimated Value: $123,456
        /home value[:\s]*\$[\d,]+/i,  // Home Value: $123,456
        /\$[\d,]+\s*(?:USD|dollars?)/i  // $123,456 USD
      ];
      
      let allPrices = [];
      for (const pattern of pricePatterns) {
        const matches = pageText.match(pattern);
        if (matches) {
          allPrices = allPrices.concat(matches);
        }
      }
      
      // Process and filter prices
      if (allPrices.length > 0) {
        const uniquePrices = [...new Set(allPrices)];
        const validPrices = uniquePrices
          .map(p => parseFloat(p.replace(/[^0-9]/g, '')))
          .filter(p => p >= 10000 && p <= 10000000); // Reasonable range
        
        if (validPrices.length > 0) {
          data.allPrices = validPrices;
          data.price = validPrices[0]; // First valid price
          console.log('Found prices:', validPrices);
        }
      }
      
      // Extract bedrooms
      const bedMatches = pageText.match(/(\d+)\s*beds?/i);
      if (bedMatches) {
        data.bedrooms = parseInt(bedMatches[1]);
      }
      
      // Extract bathrooms
      const bathMatches = pageText.match(/(\d+(?:\.\d+)?)\s*baths?/i);
      if (bathMatches) {
        data.bathrooms = parseFloat(bathMatches[1]);
      }
      
      // Extract square footage
      const sqftMatches = pageText.match(/(\d+(?:,\d+)*)\s*sq\s*ft/i);
      if (sqftMatches) {
        data.squareFootage = parseInt(sqftMatches[1].replace(/,/g, ''));
      }
      
      // Extract year built
      const yearMatches = pageText.match(/\b(19|20)\d{2}\b/g);
      if (yearMatches && yearMatches.length > 0) {
        data.yearBuilt = parseInt(yearMatches[yearMatches.length - 1]);
      }
      
      // Extract lot size
      const lotMatches = pageText.match(/(\d+(?:,\d+)*)\s*sq\s*ft\s*lot/i);
      if (lotMatches) {
        data.lotSize = parseInt(lotMatches[1].replace(/,/g, ''));
      }
      
      // Extract property type
      const typeMatches = pageText.match(/\b(single\s*family|condo|townhouse|apartment|multi\s*family)\b/i);
      if (typeMatches) {
        data.propertyType = typeMatches[1];
      }
      
      // Extract last sold price
      const soldPriceMatches = pageText.match(/sold\s*for\s*\$[\d,]+/i);
      if (soldPriceMatches) {
        const soldPriceText = soldPriceMatches[0].match(/\$[\d,]+/)[0];
        data.lastSoldPrice = parseFloat(soldPriceText.replace(/[$,]/g, ''));
      }
      
      // Extract last sold date
      const soldDateMatches = pageText.match(/sold\s*on\s*(\d{1,2}\/\d{1,2}\/\d{4}|\w+\s+\d{1,2},\s*\d{4})/i);
      if (soldDateMatches) {
        data.lastSoldDate = soldDateMatches[1];
      }
      
      // Look for specific Redfin data attributes
      try {
        const priceElements = document.querySelectorAll('[data-rf-test-id*="price"], [data-rf-test-id*="value"]');
        priceElements.forEach(el => {
          const text = el.textContent;
          if (text && text.includes('$')) {
            console.log('Price element found:', text);
          }
        });
      } catch (error) {
        console.log('Error looking for data attributes:', error);
      }
      
      return data;
    });
    
    console.log('📊 Extracted Property Data:', propertyData);
    
    // Validate extracted data
    if (propertyData.price && propertyData.price >= 10000) {
      console.log('🎉 SUCCESS: Market value extracted!');
      console.log(`💰 Market Value: $${propertyData.price.toLocaleString()}`);
      console.log(`🏠 Bedrooms: ${propertyData.bedrooms || 'N/A'}`);
      console.log(`🚿 Bathrooms: ${propertyData.bathrooms || 'N/A'}`);
      console.log(`📐 Square Feet: ${propertyData.squareFootage ? propertyData.squareFootage.toLocaleString() : 'N/A'}`);
      console.log(`📅 Year Built: ${propertyData.yearBuilt || 'N/A'}`);
      console.log(`📏 Lot Size: ${propertyData.lotSize ? propertyData.lotSize.toLocaleString() : 'N/A'}`);
      console.log(`🏘️ Property Type: ${propertyData.propertyType || 'N/A'}`);
      console.log(`💵 Last Sold: ${propertyData.lastSoldDate || 'N/A'} ($${propertyData.lastSoldPrice ? propertyData.lastSoldPrice.toLocaleString() : 'N/A'})`);
      
      return propertyData;
    } else {
      console.log('❌ No valid market value found');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Market value extraction error:', error.message);
    throw error;
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
 * Run the market value extraction test
 */
async function runMarketValueTest() {
  console.log('=== Testing Market Value Extraction ===');
  
  try {
    const result = await testMarketValueExtraction();
    
    if (result) {
      console.log('🎉 Market Value Extraction TEST PASSED!');
      console.log('✅ Real property data successfully extracted from Redfin!');
    } else {
      console.log('❌ Market Value Extraction TEST FAILED!');
      console.log('🔧 Need to improve data extraction logic');
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  }
  
  console.log('\n=== Market Value Extraction Test Complete ===');
}

// Run the test if this file is executed directly
if (require.main === module) {
  runMarketValueTest().catch(console.error);
}

module.exports = {
  testMarketValueExtraction,
  runMarketValueTest
};
