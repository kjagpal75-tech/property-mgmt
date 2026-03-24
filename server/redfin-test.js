const puppeteer = require('puppeteer');

/**
 * Redfin Property Search Test
 * Uses browser automation to get real property data from Redfin
 */

/**
 * Search Redfin property by address
 */
async function searchRedfinProperty(address, city, state, zipCode) {
  let browser;
  let page;
  
  try {
    console.log('Starting Redfin property search for:', address);
    
    // Launch browser
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
    
    console.log('Redfin homepage loaded');
    
    // Wait for search input
    await page.waitForSelector('input[placeholder*="Address"], input[placeholder*="search"], .search-input', { timeout: 10000 });
    
    // Type the full address
    const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;
    await page.type('input[placeholder*="Address"], input[placeholder*="search"], .search-input', fullAddress, { delay: 100 });
    
    console.log('Typed address:', fullAddress);
    
    // Wait for suggestions and click first result or press Enter
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to click first suggestion or press Enter
    try {
      await page.click('.suggestion-item, .search-suggestion, [data-rf-test-id="search-suggestion"]');
      console.log('Clicked search suggestion');
    } catch (error) {
      // Fallback: press Enter
      await page.keyboard.press('Enter');
      console.log('Pressed Enter to search');
    }
    
    // Wait for search results page
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot to see what we get
    await page.screenshot({ path: 'redfin-search-results.png' });
    
    console.log('Search results page loaded, checking for results...');
    
    // Try multiple approaches to find results
    let foundResults = false;
    
    // Approach 1: Look for any clickable elements that might be properties
    try {
      await page.waitForSelector('a[href*="/home/"], a[href*="/property/"], .HomeCard, .home-card, .property-card, .listing-card', { timeout: 5000 });
      console.log('Found property links/cards');
      foundResults = true;
    } catch (error) {
      console.log('No property cards found, trying alternative approach...');
    }
    
    // Approach 2: Look for any links that might go to property pages
    if (!foundResults) {
      try {
        const propertyLinks = await page.$$('a[href*="/home/"], a[href*="/property/"]');
        if (propertyLinks.length > 0) {
          console.log(`Found ${propertyLinks.length} property links`);
          await propertyLinks[0].click();
          foundResults = true;
        }
      } catch (error) {
        console.log('No property links found');
      }
    }
    
    // Approach 3: Look for any element with property-related text
    if (!foundResults) {
      try {
        const elements = await page.$$('div, a, article, section');
        for (const element of elements) {
          const text = await element.textContent();
          if (text && (text.includes('bed') || text.includes('bath') || text.includes('sqft') || text.includes('$'))) {
            console.log('Found element with property text, clicking...');
            await element.click();
            foundResults = true;
            break;
          }
        }
      } catch (error) {
        console.log('No property elements found');
      }
    }
    
    // If still no results, try direct URL approach
    if (!foundResults) {
      console.log('No results found, trying direct property URL...');
      const formattedAddress = `${address.replace(/\s+/g, '-').toLowerCase()}-${city.toLowerCase()}-${state.toLowerCase()}-${zipCode}`;
      const directUrl = `https://www.redfin.com/${state.toLowerCase()}/${city.toLowerCase()}/${formattedAddress}/home`;
      console.log('Trying direct URL:', directUrl);
      await page.goto(directUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      foundResults = true;
    }
    
    // Wait for property page to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if we're on an error page or actual property page
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    // Check for error indicators
    const hasErrorIndicators = await page.evaluate(() => {
      const bodyText = document.body.innerText.toLowerCase();
      return bodyText.includes('error') || 
             bodyText.includes('page not found') ||
             bodyText.includes('access denied') ||
             bodyText.includes('blocked') ||
             bodyText.includes('unavailable') ||
             document.body.innerText.length < 1000; // Very short page likely error
    });
    
    if (hasErrorIndicators) {
      console.log('❌ Error page detected, saving for debugging...');
      await page.screenshot({ path: 'redfin-error-page.png' });
      throw new Error('Redfin redirected to error page');
    }
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'redfin-property-page.png' });
    
    // Save HTML content for debugging
    const htmlContent = await page.content();
    const fs = require('fs');
    fs.writeFileSync('redfin-property-page.html', htmlContent);
    console.log('Saved HTML to redfin-property-page.html');
    
    console.log('Property page loaded, extracting data...');
    
    // Extract property data using text-based approach
    const propertyData = await page.evaluate(() => {
      const data = {};
      
      // Get all text content from the page
      const pageText = document.body.innerText;
      
      console.log('Page text length:', pageText.length);
      console.log('Page text sample:', pageText.substring(0, 500));
      
      // Try to find price using text matching
      const priceMatches = pageText.match(/\$[\d,]+/g);
      if (priceMatches && priceMatches.length > 0) {
        // Usually the first price is the main property price
        const priceText = priceMatches[0];
        data.price = parseFloat(priceText.replace(/[$,]/g, ''));
        console.log('Found price:', priceText);
      }
      
      // Try to find bedrooms
      const bedMatches = pageText.match(/(\d+)\s*beds?/i);
      if (bedMatches) {
        data.bedrooms = parseInt(bedMatches[1]);
        console.log('Found bedrooms:', bedMatches[1]);
      }
      
      // Try to find bathrooms
      const bathMatches = pageText.match(/(\d+(?:\.\d+)?)\s*baths?/i);
      if (bathMatches) {
        data.bathrooms = parseFloat(bathMatches[1]);
        console.log('Found bathrooms:', bathMatches[1]);
      }
      
      // Try to find square footage
      const sqftMatches = pageText.match(/(\d+(?:,\d+)*)\s*sq\s*ft/i);
      if (sqftMatches) {
        data.squareFootage = parseInt(sqftMatches[1].replace(/,/g, ''));
        console.log('Found sqft:', sqftMatches[1]);
      }
      
      // Try to find year built
      const yearMatches = pageText.match(/\b(19|20)\d{2}\b/g);
      if (yearMatches && yearMatches.length > 0) {
        // Usually the most recent year is the year built
        data.yearBuilt = parseInt(yearMatches[yearMatches.length - 1]);
        console.log('Found year built:', yearMatches[yearMatches.length - 1]);
      }
      
      // Try to find lot size
      const lotMatches = pageText.match(/(\d+(?:,\d+)*)\s*sq\s*ft\s*lot/i);
      if (lotMatches) {
        data.lotSize = parseInt(lotMatches[1].replace(/,/g, ''));
        console.log('Found lot size:', lotMatches[1]);
      }
      
      // Try to find property type
      const typeMatches = pageText.match(/\b(single\s*family|condo|townhouse|apartment|multi\s*family)\b/i);
      if (typeMatches) {
        data.propertyType = typeMatches[1];
        console.log('Found property type:', typeMatches[1]);
      }
      
      // Try to find last sold price
      const soldPriceMatches = pageText.match(/sold\s*for\s*\$[\d,]+/i);
      if (soldPriceMatches) {
        const soldPriceText = soldPriceMatches[0].match(/\$[\d,]+/)[0];
        data.lastSoldPrice = parseFloat(soldPriceText.replace(/[$,]/g, ''));
        console.log('Found sold price:', soldPriceText);
      }
      
      // Try to find last sold date
      const soldDateMatches = pageText.match(/sold\s*on\s*(\d{1,2}\/\d{1,2}\/\d{4}|\w+\s+\d{1,2},\s*\d{4})/i);
      if (soldDateMatches) {
        data.lastSoldDate = soldDateMatches[1];
        console.log('Found sold date:', soldDateMatches[1]);
      }
      
      return data;
    });
    
    console.log('Extracted Redfin data:', propertyData);
    
    return propertyData;
    
  } catch (error) {
    console.error('Redfin search error:', error.message);
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
 * Test function for single property debugging
 */
async function testSingleProperty() {
  const property = { address: '37391 mission blvd', city: 'fremont', state: 'ca', zipCode: '94536' };
  
  console.log('=== Testing Single Redfin Property ===');
  console.log(`--- Testing: ${property.address}, ${property.city}, ${property.state} ---`);
  
  try {
    const result = await searchRedfinProperty(property.address, property.city, property.state, property.zipCode);
    
    console.log(`✅ Success: ${property.address}`);
    console.log(`   Price: $${result.price ? result.price.toLocaleString() : 'N/A'}`);
    console.log(`   Bedrooms: ${result.bedrooms || 'N/A'}`);
    console.log(`   Bathrooms: ${result.bathrooms || 'N/A'}`);
    console.log(`   Square Feet: ${result.squareFootage ? result.squareFootage.toLocaleString() : 'N/A'}`);
    console.log(`   Year Built: ${result.yearBuilt || 'N/A'}`);
    console.log(`   Lot Size: ${result.lotSize ? result.lotSize.toLocaleString() : 'N/A'}`);
    console.log(`   Property Type: ${result.propertyType || 'N/A'}`);
    console.log(`   Last Sold: ${result.lastSoldDate || 'N/A'} ($${result.lastSoldPrice ? result.lastSoldPrice.toLocaleString() : 'N/A'})`);
    
  } catch (error) {
    console.log(`❌ Failed: ${property.address} -> ${error.message}`);
  }
  
  console.log('\n=== Single Redfin Property Test Complete ===');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testSingleProperty().catch(console.error);
}

module.exports = {
  searchRedfinProperty,
  testSingleProperty
};
