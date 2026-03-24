const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteer.use(StealthPlugin);

/**
 * Truly visible address typing test
 */
async function testTrulyVisibleTyping() {
  let browser;
  let page;
  
  try {
    console.log('🚀 Starting TRULY VISIBLE address typing test...');
    console.log('👀 Please watch your browser window - you should see the typing!');
    
    // Launch browser with maximum visibility
    browser = await puppeteer.launch({
      headless: false,  // CRITICAL: Must be false to see browser
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--start-maximized',
        '--window-size=1920,1080',
        '--force-device-scale-factor=1'
      ]
    });
    
    page = await browser.newPage();
    
    // Set large viewport
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('✅ Browser launched - window should be visible and maximized');
    
    // Go to Redfin
    console.log('🌐 Loading Redfin homepage...');
    await page.goto('https://www.redfin.com', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });
    
    console.log('✅ Redfin loaded - you should see the homepage');
    
    // Wait for page to be fully visible
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Find and focus on search input with multiple selectors
    console.log('🔍 Looking for search input field...');
    
    const searchSelectors = [
      'input[placeholder*="Address"]',
      'input[placeholder*="search"]',
      '.search-input',
      'input[type="text"]',
      '[data-rf-test-id="search-input"]',
      '.SearchInput'
    ];
    
    let foundSearchInput = null;
    for (const selector of searchSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          foundSearchInput = elements[0];
          console.log(`✅ Found search input with selector: ${selector}`);
          break;
        }
      } catch (error) {
        console.log(`❌ No luck with selector: ${selector}`);
      }
    }
    
    if (!foundSearchInput) {
      console.log('❌ Could not find search input - trying to click on page first');
      await page.click('body');  // Click anywhere to focus
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Take screenshot before typing
    await page.screenshot({ path: 'before-typing.png' });
    console.log('✅ Screenshot saved: before-typing.png');
    
    // Focus on search input with better detection
    console.log('🔍 Looking for ALL input fields on page...');
    
    // Find all input elements
    const allInputs = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      return Array.from(inputs).map((input, index) => ({
        index: index,
        type: input.type || 'text',
        placeholder: input.placeholder || '',
        value: input.value || '',
        id: input.id || '',
        className: input.className || '',
        name: input.name || ''
      }));
    });
    
    console.log('📋 All input fields found:');
    allInputs.forEach((input, i) => {
      console.log(`  ${i}: type="${input.type}", placeholder="${input.placeholder}", value="${input.value}"`);
    });
    
    // Try to find the best search input
    let searchInput = null;
    let bestSelector = null;
    
    // Try multiple approaches to find search input
    const approaches = [
      // Approach 1: By placeholder
      () => {
        const inputs = allInputs.filter(input => 
          input.placeholder.toLowerCase().includes('address') ||
          input.placeholder.toLowerCase().includes('search') ||
          input.placeholder.toLowerCase().includes('enter')
        );
        return inputs.length > 0 ? inputs[0] : null;
      },
      // Approach 2: By type
      () => {
        const inputs = allInputs.filter(input => input.type === 'search' || input.type === 'text');
        return inputs.length > 0 ? inputs[0] : null;
      },
      // Approach 3: First visible input
      () => {
        return allInputs.length > 0 ? allInputs[0] : null;
      }
    ];
    
    for (let i = 0; i < approaches.length; i++) {
      const result = approaches[i]();
      if (result) {
        searchInput = result;
        console.log(`✅ Found input using approach ${i + 1}:`, searchInput);
        
        // Use the actual ID if available
        if (searchInput.id) {
          bestSelector = `#${searchInput.id}`;
        } else if (searchInput.className) {
          bestSelector = `.${searchInput.className.split(' ')[0]}`;
        } else {
          bestSelector = 'input[type="search"]';
        }
        break;
      }
    }
    
    if (!searchInput) {
      console.log('❌ Could not find any suitable input field');
      return { success: false, error: 'No input field found' };
    }
    
    console.log(`✅ Using selector: ${bestSelector}`);
    
    // Click on the found input
    console.log('✅ Clicking on input field...');
    await page.click(bestSelector);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Clear the input first
    console.log('🧹 Clearing input field...');
    await page.keyboard.down('Meta');
    await page.keyboard.press('a');
    await page.keyboard.up('Meta');
    await page.keyboard.press('Backspace');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Type the address with verification
    const address = '37391 mission blvd, fremont, ca 94536';
    console.log('🔤 Typing address with verification...');
    
    for (let i = 0; i < address.length; i++) {
      const char = address[i];
      await page.keyboard.type(char);
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Verify the input value after typing a few characters
      if ((i + 1) % 10 === 0) {
        const currentValue = await page.evaluate(() => {
          const input = document.querySelector('input:focus') || document.querySelector('input');
          return input ? input.value : '';
        });
        console.log(`📝 Input value after ${i + 1} chars: "${currentValue}"`);
      }
    }
    
    // Final verification
    const finalValue = await page.evaluate(() => {
      const input = document.querySelector('input:focus') || document.querySelector('input');
      return input ? input.value : '';
    });
    
    console.log('� Final input value:', finalValue);
    
    if (finalValue.includes('37391')) {
      console.log('✅ Address successfully entered!');
    } else {
      console.log('❌ Address not found in input field');
      console.log('🔄 Trying alternative approach...');
      
      // Try to type directly into the first input
      await page.click('input');
      await page.keyboard.down('Meta');
      await page.keyboard.press('a');
      await page.keyboard.up('Meta');
      await page.keyboard.press('Backspace');
      
      for (const char of address) {
        await page.keyboard.type(char);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Take screenshot after typing
    await page.screenshot({ path: 'after-typing.png' });
    console.log('✅ Screenshot saved: after-typing.png');
    
    // Wait longer to see the typed address
    console.log('⏳ Waiting 5 seconds to see the typed address...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if we can see the typed address in the input
    const inputValue = await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Address"], input[placeholder*="search"], input[type="text"]');
      return input ? input.value : 'No input found';
    });
    
    console.log('📝 Current input value:', inputValue);
    
    if (inputValue.includes('37391')) {
      console.log('✅ Address successfully typed into search field!');
    } else {
      console.log('❌ Address not found in search field');
    }
    
    // Keep browser open for inspection
    console.log('🔄 Now clicking the search button...');
    
    // Find and click the search button
    console.log('🔍 Looking for search button...');
    
    const searchButtonSelectors = [
      'button[type="submit"]',
      '.search-button',
      '[data-rf-test-id="search-button"]',
      '.SearchButton',
      'button:contains("Search")',
      'input[type="submit"]',
      '.submit-button',
      'button[aria-label*="Search"]'
    ];
    
    let searchButtonClicked = false;
    
    for (const selector of searchButtonSelectors) {
      try {
        const buttons = await page.$$(selector);
        if (buttons.length > 0) {
          console.log(`✅ Found search button with selector: ${selector}`);
          await buttons[0].click();
          searchButtonClicked = true;
          break;
        }
      } catch (error) {
        console.log(`❌ No luck with search button selector: ${selector}`);
      }
    }
    
    // If no button found, try pressing Enter
    if (!searchButtonClicked) {
      console.log('🔄 No search button found, pressing Enter instead...');
      await page.keyboard.press('Enter');
      searchButtonClicked = true;
    }
    
    if (searchButtonClicked) {
      console.log('✅ Search button clicked or Enter pressed');
    } else {
      console.log('❌ Could not click search button or press Enter');
      return { success: false, error: 'Could not submit search' };
    }
    
    // Wait for property page to load
    console.log('⏳ Waiting for property page to load...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Take screenshot of results page
    await page.screenshot({ path: 'property-page-loaded.png' });
    console.log('✅ Screenshot saved: property-page-loaded.png');
    
    // Check current URL
    const currentUrl = page.url();
    console.log('📍 Current URL after search:', currentUrl);
    
    // Check page title
    const pageTitle = await page.title();
    console.log('� Page title:', pageTitle);
    
    // Analyze what page we got
    const pageAnalysis = await page.evaluate(() => {
      const bodyText = document.body.innerText.toLowerCase();
      
      return {
        hasPropertyData: bodyText.includes('bed') && bodyText.includes('bath') && bodyText.includes('sqft'),
        hasPrices: bodyText.includes('$'),
        hasAddress: bodyText.includes('mission') || bodyText.includes('37391') || bodyText.includes('fremont'),
        hasError: bodyText.includes('error') || bodyText.includes('blocked') || bodyText.includes('not found'),
        isHomepage: bodyText.includes('your dream home search') || bodyText.includes('popular in'),
        bodyTextLength: document.body.innerText.length,
        sampleText: document.body.innerText.substring(0, 2000)
      };
    });
    
    console.log('🔍 Page Analysis:', pageAnalysis);
    
    if (pageAnalysis.hasError) {
      console.log('❌ Error page detected');
      return { success: false, error: 'Error page loaded' };
    }
    
    if (pageAnalysis.isHomepage) {
      console.log('❌ Still on homepage - search did not work');
      return { success: false, error: 'Still on homepage' };
    }
    
    if (pageAnalysis.hasPropertyData && pageAnalysis.hasAddress) {
      console.log('✅ SUCCESS! Found property page with correct address');
      
      // Extract market value and property details
      console.log('💰 Extracting market value and property details...');
      
      const propertyData = await page.evaluate(() => {
        const pageText = document.body.innerText;
        
        // Look for market value with multiple patterns
        const marketValuePatterns = [
          /market value[:\s]*\$([\d,]+)/i,
          /estimated value[:\s]*\$([\d,]+)/i,
          /home value[:\s]*\$([\d,]+)/i,
          /price[:\s]*\$([\d,]+)/i,
          /\$([\d,]+)/g
        ];
        
        let marketValue = null;
        let allPrices = [];
        
        for (const pattern of marketValuePatterns) {
          const matches = pageText.match(pattern);
          if (matches) {
            if (pattern.global) {
              allPrices = allPrices.concat(matches.map(m => parseFloat(m.replace(/[^0-9]/g, ''))));
            } else {
              marketValue = parseFloat(matches[1].replace(/,/g, ''));
            }
          }
        }
        
        // If no specific market value found, use first reasonable price
        if (!marketValue && allPrices.length > 0) {
          const validPrices = allPrices.filter(p => p >= 10000 && p <= 10000000);
          if (validPrices.length > 0) {
            marketValue = validPrices[0];
          }
        }
        
        // Extract other property details
        const bedMatch = pageText.match(/(\d+)\s*beds?/i);
        const bathMatch = pageText.match(/(\d+(?:\.\d+)?)\s*baths?/i);
        const sqftMatch = pageText.match(/(\d+(?:,\d+)*)\s*sq\s*ft/i);
        const yearMatch = pageText.match(/\b(19|20)\d{2}\b/g);
        const lotMatch = pageText.match(/(\d+(?:,\d+)*)\s*sq\s*ft\s*lot/i);
        
        return {
          marketValue: marketValue,
          allPrices: allPrices.slice(0, 5),
          bedrooms: bedMatch ? parseInt(bedMatch[1]) : null,
          bathrooms: bathMatch ? parseFloat(bathMatch[1]) : null,
          squareFootage: sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, '')) : null,
          yearBuilt: yearMatch ? parseInt(yearMatch[yearMatch.length - 1]) : null,
          lotSize: lotMatch ? parseInt(lotMatch[1].replace(/,/g, '')) : null,
          sampleText: pageText.substring(0, 1000)
        };
      });
      
      console.log('📊 PROPERTY DATA EXTRACTED:');
      console.log(`💰 Market Value: $${propertyData.marketValue ? propertyData.marketValue.toLocaleString() : 'N/A'}`);
      console.log(`🏠 Bedrooms: ${propertyData.bedrooms || 'N/A'}`);
      console.log(`🚿 Bathrooms: ${propertyData.bathrooms || 'N/A'}`);
      console.log(`📐 Square Feet: ${propertyData.squareFootage ? propertyData.squareFootage.toLocaleString() : 'N/A'}`);
      console.log(`📅 Year Built: ${propertyData.yearBuilt || 'N/A'}`);
      console.log(`📏 Lot Size: ${propertyData.lotSize ? propertyData.lotSize.toLocaleString() : 'N/A'}`);
      
      // Keep browser open for inspection
      console.log('🔄 Keeping browser open for 10 seconds to see the property page...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      return { 
        success: true, 
        propertyData: propertyData,
        currentUrl: currentUrl,
        pageTitle: pageTitle
      };
      
    } else {
      console.log('❌ Property page loaded but no property data found');
      return { success: false, error: 'No property data found' };
    }
    
  } catch (error) {
    console.error('❌ Visible typing test error:', error.message);
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
 * Run the truly visible typing test
 */
async function runTrulyVisibleTest() {
  console.log('=== TRULY VISIBLE ADDRESS TYPING TEST ===');
  console.log('👀 PLEASE WATCH YOUR BROWSER WINDOW!');
  
  const result = await testTrulyVisibleTyping();
  
  if (result.success) {
    console.log('🎉 Visible Typing Test SUCCESS!');
    console.log('✅ You should have seen the address being typed');
  } else {
    console.log('❌ Visible Typing Test FAILED!');
    console.log('🔧 Error:', result.error);
  }
  
  console.log('\n=== Truly Visible Address Typing Test Complete ===');
}

// Run the test if this file is executed directly
if (require.main === module) {
  runTrulyVisibleTest().catch(console.error);
}

module.exports = {
  testTrulyVisibleTyping,
  runTrulyVisibleTest
};
