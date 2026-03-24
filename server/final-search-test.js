const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteer.use(StealthPlugin());

/**
 * Test proper search submission with mouse movements
 */
async function testProperSearchSubmission() {
  let browser;
  let page;
  
  try {
    console.log('🚀 Testing PROPER SEARCH SUBMISSION...');
    console.log('🔍 This will show you mouse movements + search button clicking!');
    
    browser = await puppeteer.launch({
      headless: false,  // Show browser so you can see mouse movements
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
    
    // Go to Redfin
    await page.goto('https://www.redfin.com', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });
    
    console.log('✅ Redfin loaded');
    
    // Wait for page to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Find search input
    await page.waitForSelector('#search-box-input', { timeout: 10000 });
    const searchInput = await page.$('#search-box-input');
    const inputBounds = await searchInput.boundingBox();
    
    console.log('✅ Found search input');
    
    // Click on search input to focus
    console.log('🖱️ Clicking on search input...');
    await page.mouse.move(
      inputBounds.x + inputBounds.width / 2,
      inputBounds.y + inputBounds.height / 2
    );
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.mouse.click(
      inputBounds.x + inputBounds.width / 2,
      inputBounds.y + inputBounds.height / 2
    );
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Type address with human-like delays
    const address = '37391 mission blvd, fremont, ca 94536';
    console.log('🔤 Typing address...');
    
    for (let i = 0; i < address.length; i++) {
      const char = address[i];
      await page.keyboard.type(char);
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 50));
      
      if ((i + 1) % 10 === 0 || i === address.length - 1) {
        console.log(`🔤 Typed: "${address.substring(0, i + 1)}"`);
      }
    }
    
    console.log('✅ Address typed successfully');
    
    // Wait for suggestions (optional)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Find and click search button
    console.log('🔍 Looking for search button...');
    
    const searchButtonSelectors = [
      'button[type="submit"]',
      '.search-button',
      '[data-rf-test-id="search-button"]',
      'button:contains("Search")',
      'button:contains("search")',
      '[aria-label*="search"]',
      '.submit-button',
      'input[type="submit"]'
    ];
    
    let searchButtonClicked = false;
    
    for (const selector of searchButtonSelectors) {
      try {
        const buttons = await page.$$(selector);
        if (buttons.length > 0) {
          console.log(`✅ Found ${buttons.length} buttons with selector: ${selector}`);
          
          // Get button bounds for mouse movement
          const buttonBounds = await buttons[0].getBoundingBox();
          
          if (buttonBounds) {
            // Move mouse to button like a human would
            console.log('🖱️ Moving mouse to search button...');
            await page.mouse.move(
              buttonBounds.x + buttonBounds.width / 2,
              buttonBounds.y + buttonBounds.height / 2
            );
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for movement to be visible
          }
          
          // Click on search button
          await buttons[0].click();
          searchButtonClicked = true;
          console.log('✅ Clicked on search button');
          break;
        }
      } catch (error) {
        console.log(`❌ Error with selector ${selector}:`, error.message);
      }
    }
    
    // Fallback to keyboard Enter if no button found
    if (!searchButtonClicked) {
      console.log('🔄 No search button found, using keyboard Enter');
      await page.keyboard.press('Enter');
      console.log('✅ Pressed Enter key');
    }
    
    // Wait for search results
    console.log('⏳ Waiting for search results to load...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Take screenshot of results
    await page.screenshot({ path: 'proper-search-submission.png' });
    console.log('✅ Screenshot saved: proper-search-submission.png');
    
    // Check what happened
    const currentUrl = page.url();
    const pageTitle = await page.title();
    
    console.log('📍 Current URL:', currentUrl);
    console.log('📄 Page title:', pageTitle);
    
    // Check if we got property page
    const pageAnalysis = await page.evaluate(() => {
      const bodyText = document.body.innerText.toLowerCase();
      
      return {
        hasPropertyData: bodyText.includes('bed') && bodyText.includes('bath') && bodyText.includes('sqft'),
        hasAddress: bodyText.includes('mission') || bodyText.includes('37391') || bodyText.includes('fremont'),
        hasError: bodyText.includes('error') || bodyText.includes('blocked') || bodyText.includes('not found'),
        isHomepage: bodyText.includes('your dream home search') || bodyText.includes('popular in'),
        bodyTextLength: document.body.innerText.length,
        sampleText: document.body.innerText.substring(0, 1000)
      };
    });
    
    console.log('🔍 Page Analysis:', pageAnalysis);
    
    if (pageAnalysis.hasPropertyData && pageAnalysis.hasAddress && !pageAnalysis.hasError && !pageAnalysis.isHomepage) {
      console.log('🎉 SUCCESS! Got property page with proper search submission!');
      
      // Extract property data
      const propertyData = await page.evaluate(() => {
        const pageText = document.body.innerText;
        
        const priceMatch = pageText.match(/\$[\d,]+/);
        const bedMatch = pageText.match(/(\d+)\s*beds?/i);
        const bathMatch = pageText.match(/(\d+(?:\.\d+)?)\s*baths?/i);
        const sqftMatch = pageText.match(/(\d+(?:,\d+)*)\s*sq\s*ft/i);
        
        return {
          price: priceMatch ? parseFloat(priceMatch[0].replace(/[$,]/g, '')) : null,
          bedrooms: bedMatch ? parseInt(bedMatch[1]) : null,
          bathrooms: bathMatch ? parseFloat(bathMatch[1]) : null,
          squareFootage: sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, '')) : null,
          sampleText: pageText.substring(0, 1000)
        };
      });
      
      console.log('📊 PROPERTY DATA:');
      console.log(`💰 Market Value: $${propertyData.price ? propertyData.price.toLocaleString() : 'N/A'}`);
      console.log(`🏠 Bedrooms: ${propertyData.bedrooms || 'N/A'}`);
      console.log(`🚿 Bathrooms: ${propertyData.bathrooms || 'N/A'}`);
      console.log(`📐 Square Feet: ${propertyData.squareFootage ? propertyData.squareFootage.toLocaleString() : 'N/A'}`);
      
      // Keep browser open for inspection
      console.log('🔄 Keeping browser open for 10 seconds...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      return { 
        success: true, 
        method: searchButtonClicked ? 'Mouse Click' : 'Keyboard Enter',
        propertyData,
        url: currentUrl,
        title: pageTitle
      };
      
    } else {
      console.log('❌ Search submission failed');
      return { 
        success: false, 
        method: searchButtonClicked ? 'Mouse Click' : 'Keyboard Enter',
        reason: pageAnalysis.hasError ? 'Error page' : 'No property data'
      };
    }
    
  } catch (error) {
    console.error('❌ Proper search submission test error:', error.message);
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
 * Run proper search submission test
 */
async function runProperSearchSubmissionTest() {
  console.log('=== PROPER SEARCH SUBMISSION TEST ===');
  console.log('🔍 This will show you mouse movements + search button clicking!');
  
  const result = await testProperSearchSubmission();
  
  if (result.success) {
    console.log('🎉 Proper Search Submission Test SUCCESS!');
    console.log(`✅ Method used: ${result.method}`);
    console.log('✅ Property data extracted successfully!');
  } else {
    console.log('❌ Proper Search Submission Test FAILED!');
    console.log(`🔧 Reason: ${result.reason}`);
  }
  
  console.log('\n=== Proper Search Submission Test Complete ===');
}

// Run the test if this file is executed directly
if (require.main === module) {
  runProperSearchSubmissionTest().catch(console.error);
}

module.exports = {
  testProperSearchSubmission,
  runProperSearchSubmissionTest
};
