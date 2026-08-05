const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteer.use(StealthPlugin());

/**
 * Stealth Redfin Property Search with Bot Detection Evasion
 */

/**
 * Search Redfin property with stealth techniques
 */
async function searchRedfinStealth(address, city, state, zipCode) {
  let browser;
  let page;
  
  try {
    console.log('Starting stealth Redfin property search...');
    
    // Launch browser with stealth settings
    browser = await puppeteer.launch({
      headless: false,  // Show browser (less suspicious)
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    
    page = await browser.newPage();
    
    // Set realistic viewport
    await page.setViewport({ width: 1366, height: 768 });
    
    // Set realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Enable request interception to modify headers
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      // Block unnecessary requests to look more human
      if (request.resourceType() === 'image' || 
          request.resourceType() === 'stylesheet' ||
          request.resourceType() === 'font') {
        request.abort();
      } else {
        request.continue();
      }
    });
    
    // Add random delays and human-like behavior
    const randomDelay = (min, max) => new Promise(resolve => setTimeout(resolve, min + Math.random() * (max - min)));
    
    // Go to Redfin homepage
    await page.goto('https://www.redfin.com', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('Redfin homepage loaded');
    
    // Wait a bit like a human would
    await randomDelay(1000, 3000);
    
    // Random mouse movement
    await page.mouse.move(500 + Math.random() * 300, 300 + Math.random() * 200);
    await randomDelay(500, 1500);
    
    // Wait for search input
    await page.waitForSelector('input[placeholder*="Address"], input[placeholder*="search"], .search-input', { timeout: 10000 });
    
    // Type the full address with human-like delays
    const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;
    const searchInput = await page.$('input[placeholder*="Address"], input[placeholder*="search"], .search-input');
    
    // Click on search input like a human
    await searchInput.click();
    await randomDelay(200, 500);
    
    // Type with human-like delays
    for (let i = 0; i < fullAddress.length; i++) {
      await page.keyboard.type(fullAddress[i]);
      await randomDelay(50, 150);
    }
    
    console.log('Typed address:', fullAddress);
    
    // Wait for suggestions
    await randomDelay(1000, 2000);
    
    // Random scroll to look more human
    await page.evaluate(() => window.scrollBy(0, Math.random() * 100));
    await randomDelay(500, 1000);
    
    // Submit search
    await page.keyboard.press('Enter');
    console.log('Pressed Enter to search');
    
    // Wait for search results
    await randomDelay(3000, 5000);
    
    // Take screenshot to see what we got
    await page.screenshot({ path: 'redfin-stealth-results.png' });
    
    // Check if we're on a results page or error page
    const currentUrl = page.url();
    console.log('Current URL after search:', currentUrl);
    
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    // Look for property results with multiple approaches
    let foundProperty = false;
    
    // Approach 1: Look for property cards
    try {
      const propertyCards = await page.$$('.HomeCard, .home-card, .property-card, .listing-card');
      if (propertyCards.length > 0) {
        console.log(`Found ${propertyCards.length} property cards`);
        await propertyCards[0].click();
        foundProperty = true;
      }
    } catch (error) {
      console.log('No property cards found');
    }
    
    // Approach 2: Look for property links
    if (!foundProperty) {
      try {
        const propertyLinks = await page.$$('a[href*="/home/"], a[href*="/property/"]');
        if (propertyLinks.length > 0) {
          console.log(`Found ${propertyLinks.length} property links`);
          await propertyLinks[0].click();
          foundProperty = true;
        }
      } catch (error) {
        console.log('No property links found');
      }
    }
    
    // Approach 3: Try direct URL if still no property
    if (!foundProperty) {
      console.log('Trying direct property URL...');
      const formattedAddress = `${address.replace(/\s+/g, '-').toLowerCase()}-${city.toLowerCase()}-${state.toLowerCase()}-${zipCode}`;
      const directUrl = `https://www.redfin.com/${state.toLowerCase()}/${city.toLowerCase()}/${formattedAddress}/home`;
      console.log('Direct URL:', directUrl);
      await page.goto(directUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      foundProperty = true;
    }
    
    // Wait for property page to load
    await randomDelay(3000, 5000);
    
    // Check for error indicators
    const hasErrorIndicators = await page.evaluate(() => {
      const bodyText = document.body.innerText.toLowerCase();
      return bodyText.includes('error') || 
             bodyText.includes('page not found') ||
             bodyText.includes('access denied') ||
             bodyText.includes('blocked') ||
             bodyText.includes('unavailable') ||
             document.body.innerText.length < 1000;
    });
    
    if (hasErrorIndicators) {
      console.log('❌ Error page detected even with stealth');
      await page.screenshot({ path: 'redfin-stealth-error.png' });
      throw new Error('Redfin still detected automation');
    }
    
    // Take screenshot of property page
    await page.screenshot({ path: 'redfin-stealth-property.png' });
    
    console.log('Property page loaded, extracting data...');
    
    // Extract property data with better validation
    const propertyData = await page.evaluate(() => {
      const data = {};
      const pageText = document.body.innerText;
      
      console.log('Page text length:', pageText.length);
      
      // More robust price extraction
      const priceMatches = pageText.match(/\$[\d,]+/g);
      if (priceMatches && priceMatches.length > 0) {
        // Filter out unrealistic prices (too low or too high)
        const validPrices = priceMatches
          .map(p => parseFloat(p.replace(/[$,]/g, '')))
          .filter(p => p >= 10000 && p <= 10000000); // Reasonable price range
        
        if (validPrices.length > 0) {
          data.price = validPrices[0]; // Use first valid price
          console.log('Found valid price:', validPrices[0]);
        }
      }
      
      // Extract other property details
      const bedMatches = pageText.match(/(\d+)\s*beds?/i);
      if (bedMatches) {
        data.bedrooms = parseInt(bedMatches[1]);
        console.log('Found bedrooms:', bedMatches[1]);
      }
      
      const bathMatches = pageText.match(/(\d+(?:\.\d+)?)\s*baths?/i);
      if (bathMatches) {
        data.bathrooms = parseFloat(bathMatches[1]);
        console.log('Found bathrooms:', bathMatches[1]);
      }
      
      const sqftMatches = pageText.match(/(\d+(?:,\d+)*)\s*sq\s*ft/i);
      if (sqftMatches) {
        data.squareFootage = parseInt(sqftMatches[1].replace(/,/g, ''));
        console.log('Found sqft:', sqftMatches[1]);
      }
      
      const yearMatches = pageText.match(/\b(19|20)\d{2}\b/g);
      if (yearMatches && yearMatches.length > 0) {
        data.yearBuilt = parseInt(yearMatches[yearMatches.length - 1]);
        console.log('Found year built:', yearMatches[yearMatches.length - 1]);
      }
      
      return data;
    });
    
    console.log('Stealth Redfin data:', propertyData);
    
    // Validate extracted data
    if (!propertyData.price || propertyData.price < 10000) {
      throw new Error('Invalid or missing price data');
    }
    
    return propertyData;
    
  } catch (error) {
    console.error('Stealth Redfin search error:', error.message);
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
 * Test stealth Redfin search
 */
async function testStealthRedfin() {
  const property = { address: '37391 mission blvd', city: 'fremont', state: 'ca', zipCode: '94536' };
  
  console.log('=== Testing Stealth Redfin Search ===');
  
  try {
    const result = await searchRedfinStealth(property.address, property.city, property.state, property.zipCode);
    
    console.log(`✅ Stealth Success: ${property.address}`);
    console.log(`   Price: $${result.price ? result.price.toLocaleString() : 'N/A'}`);
    console.log(`   Bedrooms: ${result.bedrooms || 'N/A'}`);
    console.log(`   Bathrooms: ${result.bathrooms || 'N/A'}`);
    console.log(`   Square Feet: ${result.squareFootage ? result.squareFootage.toLocaleString() : 'N/A'}`);
    console.log(`   Year Built: ${result.yearBuilt || 'N/A'}`);
    
  } catch (error) {
    console.log(`❌ Stealth Failed: ${property.address} -> ${error.message}`);
  }
  
  console.log('\n=== Stealth Redfin Test Complete ===');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testStealthRedfin().catch(console.error);
}

module.exports = {
  searchRedfinStealth,
  testStealthRedfin
};
