const puppeteer = require('puppeteer');
const axios = require('axios');

/**
 * Test Redfin web scraping for property market values
 * Uses 3-step process: 1) Load homepage, 2) Search address, 3) Scrape value
 */

async function getRedfinMarketValue(address) {
  console.log(`Starting Redfin scraping for: ${address}`);
  
  let browser;
  let page;
  
  try {
    // Step 1: Launch browser and load Redfin homepage
    console.log('Step 1: Loading Redfin homepage...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Set realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Go to Redfin homepage
    await page.goto('https://www.redfin.com', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('Step 1: Redfin homepage loaded successfully');
    
    // Step 2: Search for property address
    console.log('Step 2: Searching for property...');
    
    // Wait for any search input to be available
    await page.waitForSelector('input, [role="searchbox"], [type="search"], .search-input, [data-rf-test-id="search-input"]', { timeout: 10000 });
    
    // Debug: Take screenshot to see what we're working with
    await page.screenshot({ path: 'redfin-homepage.png' });
    console.log('Step 1: Redfin homepage loaded successfully');
    
    // Step 2: Search for property address
    console.log('Step 2: Searching for property...');
    
    // Try to find any input field and type the address
    try {
      const searchInputs = await page.$$('input, [role="searchbox"], [type="search"]');
      if (searchInputs.length > 0) {
        await searchInputs[0].type(address, { delay: 100 });
        console.log('Found search input, typing address...');
      } else {
        console.log('No search input found, trying alternative approach...');
        // Try clicking on page and typing
        await page.click('body');
        await page.keyboard.type(address);
      }
    } catch (error) {
      console.log('Error with search input:', error.message);
    }
    
    // Click search button or press Enter
    try {
      await page.click('button[data-rf-test-id="search-button"], .search-button, [data-testid="search-button"]');
    } catch (error) {
      // Fallback: press Enter key
      await page.keyboard.press('Enter');
    }
    
    // Wait for navigation to complete and page to settle
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot after search to see what happened
    await page.screenshot({ path: 'redfin-search-results.png' });
    console.log('Step 2: Search completed, checking for results...');
    
    // Try to find search results with multiple approaches
    console.log('Looking for search results...');
    
    const searchResults = await page.evaluate(() => {
      // Try different selectors for search results
      const selectors = [
        '.property-result',
        '.home-card', 
        '.search-result-item',
        '[data-rf-test-id="search-result-item"]',
        'a[href*="/property/"]',
        '[data-rf-test-id="home-card"]'
      ];
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements && elements.length > 0) {
          console.log(`Found ${elements.length} results with selector: ${selector}`);
          return elements.length;
        }
      }
      
      return 0;
    });
    
    console.log(`Search results found: ${searchResults}`);
    
    if (searchResults === 0) {
      throw new Error('No search results found on page');
    }
    
    // Step 3: Click on first property and scrape market value
    console.log('Step 3: Navigating to property page...');
    
    // Click on the first property result
    try {
      await page.click('.property-result:first-child a, .home-card:first-child a, .search-result-item:first-child a, [data-rf-test-id="search-result-item"]:first-child a, [data-rf-test-id="home-card"]:first-child a');
    } catch (error) {
      console.log('Error clicking property:', error.message);
      // Try alternative approach
      const propertyLinks = await page.$$('a[href*="/property/"]');
      if (propertyLinks.length > 0) {
        await propertyLinks[0].click();
      } else {
        throw new Error('No property links found');
      }
    }
    
    // Wait for property page to load
    await page.waitForSelector('.zestimate, .home-value', { timeout: 15000 });
    
    console.log('Step 3: Property page loaded, scraping market value...');
    
    // Extract market value from the page
    const marketValue = await page.evaluate(() => {
      // Try multiple selectors for market value
      const selectors = [
        '.zestimate .value',
        '.home-value .value',
        '.price-value',
        '[data-rf-test-id="homeValue"] .value',
        '.price .value',
        '.valuation .value',
        '[data-rf-test-id="home-estimate"] .value'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          return element.textContent.trim();
        }
      }
      
      return null;
    });
    
    if (!marketValue) {
      throw new Error('Could not find market value on property page');
    }
    
    // Parse the market value (remove $ and commas)
    const cleanValue = marketValue.replace(/[$,]/g, '');
    const numericValue = parseFloat(cleanValue);
    
    if (isNaN(numericValue)) {
      throw new Error(`Invalid market value format: ${marketValue}`);
    }
    
    console.log(`Step 3: Successfully extracted market value: ${numericValue}`);
    
    return {
      marketValue: numericValue,
      dataSource: 'redfin_scraping',
      confidence: 0.88,
      propertyUrl: page.url(),
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Redfin scraping error:', error.message);
    throw new Error(`Redfin scraping failed: ${error.message}`);
  } finally {
    // Clean up browser resources
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Test function to try scraping all properties
 */
async function testRedfinScraping() {
  const properties = [
    '37391 mission blvd fremont ca',
    '3643 ruidoso st reno nv', 
    '12798 skislope way truckee ca'
  ];
  
  console.log('=== Testing Redfin Scraping for All Properties ===');
  
  for (const address of properties) {
    try {
      console.log(`\n--- Testing: ${address} ---`);
      const result = await getRedfinMarketValue(address);
      console.log(`✅ Success: ${address} -> $${result.marketValue.toLocaleString()} (${result.dataSource})`);
      console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`   Property URL: ${result.propertyUrl}`);
      console.log(`   Timestamp: ${result.timestamp}`);
    } catch (error) {
      console.log(`❌ Failed: ${address} -> ${error.message}`);
    }
    
    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('\n=== Redfin Scraping Test Complete ===');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testRedfinScraping().catch(console.error);
}

module.exports = {
  getRedfinMarketValue,
  testRedfinScraping
};
