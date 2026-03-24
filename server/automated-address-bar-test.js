const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteer.use(StealthPlugin());

/**
 * Test automated address bar typing to bypass detection
 */
async function testAutomatedAddressBarNavigation() {
  let browser;
  let page;
  
  try {
    console.log('🚀 TESTING AUTOMATED ADDRESS BAR NAVIGATION...');
    console.log('🔍 Step 1: Launch browser (no navigation)');
    console.log('🔍 Step 2: Click on address bar');
    console.log('🔍 Step 3: Type "redfin.com" in address bar');
    console.log('🔍 Step 4: Hit ENTER to navigate');
    console.log('🔍 Step 5: Then automation takes over for search');
    
    browser = await puppeteer.launch({
      headless: false,  // Show browser so you can see address bar typing
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('✅ Browser launched - starting address bar navigation...');
    
    // === STEP 1: CLICK ON ADDRESS BAR ===
    console.log('\n=== STEP 1: CLICK ON ADDRESS BAR ===');
    
    // Wait a moment for browser to fully load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to click on address bar
    // Note: Address bar is part of Chrome UI, not the page content
    // We'll try different approaches
    
    // Method 1: Try to use keyboard shortcut to focus address bar (Cmd+L on Mac)
    console.log('🔍 Trying to focus address bar with keyboard shortcut...');
    await page.keyboard.down('Meta');  // Meta key on Mac (Cmd)
    await page.keyboard.press('l');
    await page.keyboard.up('Meta');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Method 2: Try to click on top of the page where address bar usually is
    console.log('🖱️ Trying to click where address bar might be...');
    await page.mouse.move(683, 50);  // Center top of viewport
    await page.mouse.click(683, 50);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Method 3: Try Ctrl+L (alternative shortcut)
    console.log('🔍 Trying Ctrl+L shortcut...');
    await page.keyboard.down('Control');
    await page.keyboard.press('l');
    await page.keyboard.up('Control');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // === STEP 2: TYPE IN ADDRESS BAR ===
    console.log('\n=== STEP 2: TYPE "redfin.com" IN ADDRESS BAR ===');
    
    // Clear any existing text in address bar
    await page.keyboard.down('Meta');
    await page.keyboard.press('a');  // Select all
    await page.keyboard.up('Meta');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Type "redfin.com" with human-like delays
    const url = 'redfin.com';
    console.log('🔤 Typing "redfin.com" in address bar...');
    
    for (let i = 0; i < url.length; i++) {
      const char = url[i];
      
      // Human-like delay: 100-300ms
      const randomDelay = 100 + Math.random() * 200;
      
      await page.keyboard.type(char);
      await new Promise(resolve => setTimeout(resolve, randomDelay));
      
      // Show progress
      if ((i + 1) % 3 === 0 || i === url.length - 1) {
        console.log(`🔤 Typed: "${url.substring(0, i + 1)}"`);
      }
    }
    
    console.log('✅ Typed "redfin.com" in address bar');
    
    // === STEP 3: HIT ENTER TO NAVIGATE ===
    console.log('\n=== STEP 3: HIT ENTER TO NAVIGATE ===');
    
    // Wait a moment before hitting enter
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('🔍 Hitting ENTER to navigate...');
    await page.keyboard.press('Enter');
    
    // Wait for navigation to complete
    console.log('⏳ Waiting for Redfin to load...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if we're on Redfin
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    if (!currentUrl.includes('redfin.com')) {
      console.log('❌ Navigation to Redfin failed. Trying direct navigation as fallback...');
      await page.goto('https://www.redfin.com', {
        waitUntil: 'domcontentloaded',
        timeout: 20000
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log('✅ Successfully navigated to Redfin - starting search automation...');
    
    // === STEP 4: START SEARCH AUTOMATION ===
    console.log('\n=== STEP 4: START SEARCH AUTOMATION ===');
    
    // Wait for page to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Find search input
    await page.waitForSelector('#search-box-input', { timeout: 10000 });
    const searchInput = await page.$('#search-box-input');
    
    console.log('✅ Found search input');
    
    // Click on search input to focus
    await searchInput.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Clear input
    console.log('🧹 Clearing input field...');
    await page.evaluate(() => {
      const input = document.querySelector('#search-box-input');
      if (input) {
        input.value = '';
        input.focus();
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Type address with randomized timing
    const address = '37391 mission blvd, fremont, ca 94536';
    console.log('🔤 Typing address with randomized timing...');
    
    for (let i = 0; i < address.length; i++) {
      const char = address[i];
      
      // Randomized delay: 500ms to 2000ms
      const randomDelay = 500 + Math.random() * 1500;
      
      await page.keyboard.type(char);
      await new Promise(resolve => setTimeout(resolve, randomDelay));
      
      // Show progress
      if ((i + 1) % 5 === 0 || i === address.length - 1) {
        console.log(`🔤 Typed "${address.substring(0, i + 1)}" (delay: ${Math.round(randomDelay)}ms)`);
      }
      
      // Occasional thinking pause (10% chance)
      if (Math.random() < 0.1) {
        const thinkingDelay = 1000 + Math.random() * 2000;
        console.log(`🤔 Thinking pause... (${Math.round(thinkingDelay)}ms)`);
        await new Promise(resolve => setTimeout(resolve, thinkingDelay));
      }
      
      // Occasional typo simulation (5% chance)
      if (Math.random() < 0.05) {
        const wrongChar = String.fromCharCode(97 + Math.floor(Math.random() * 26));
        await page.keyboard.type(wrongChar);
        await new Promise(resolve => setTimeout(resolve, 200));
        await page.keyboard.press('Backspace');
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log(`🔤 Typo: typed "${wrongChar}" then corrected`);
      }
    }
    
    console.log('✅ Address typed with randomized timing');
    
    // Wait before submitting
    const submitWait = 2000 + Math.random() * 2000;
    console.log(`⏳ Waiting before submit... (${Math.round(submitWait)}ms)`);
    await new Promise(resolve => setTimeout(resolve, submitWait));
    
    // Submit search
    console.log('🔍 Submitting search...');
    await page.keyboard.press('Enter');
    
    // Wait for results
    console.log('⏳ Waiting for search results...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check what happened
    const searchResult = await page.evaluate(() => {
      const bodyText = document.body.innerText.toLowerCase();
      
      return {
        url: window.location.href,
        title: document.title,
        hasPropertyData: bodyText.includes('bed') && bodyText.includes('bath') && bodyText.includes('sqft'),
        hasAddress: bodyText.includes('mission') || bodyText.includes('37391') || bodyText.includes('fremont'),
        hasError: bodyText.includes('error') || bodyText.includes('blocked') || bodyText.includes('not found'),
        isHomepage: bodyText.includes('your dream home search') || bodyText.includes('popular in'),
        bodyTextLength: document.body.innerText.length,
        sampleText: document.body.innerText.substring(0, 1000)
      };
    });
    
    console.log('🔍 Search Result:', searchResult);
    
    // Take screenshot
    await page.screenshot({ path: 'automated-address-bar-navigation.png' });
    console.log('✅ Screenshot saved: automated-address-bar-navigation.png');
    
    if (searchResult.hasPropertyData && searchResult.hasAddress && !searchResult.hasError && !searchResult.isHomepage) {
      console.log('🎉 SUCCESS! Automated address bar navigation worked!');
      
      // Extract property data
      const propertyData = await page.evaluate(() => {
        const pageText = document.body.innerText;
        
        const priceMatch = pageText.match(/\$[\d,]+/);
        const bedMatch = pageText.match(/(\d+)\s*beds?/i);
        const bathMatch = pageText.match(/(\d+(?:\.\d+)?)\s*baths?/i);
        const sqftMatch = pageText.match(/(\d+(?:,\d+)*)\s*sq\s*ft/i);
        
        return {
          price: priceMatch ? parseFloat(priceMatch[0].replace(/[$,]/g, '')) : null,
          bedrooms: bedMatch ? parseInt(bedmatch[1]) : null,
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
      console.log('🔄 Keeping browser open for 15 seconds...');
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      return { 
        success: true, 
        method: 'Automated Address Bar Navigation',
        propertyData,
        url: searchResult.url,
        title: searchResult.title
      };
      
    } else {
      console.log('❌ Automated address bar navigation failed');
      console.log(`🔧 URL: ${searchResult.url}`);
      console.log(`🔧 Has Property Data: ${searchResult.hasPropertyData}`);
      console.log(`🔧 Has Address: ${searchResult.hasAddress}`);
      console.log(`🔧 Has Error: ${searchResult.hasError}`);
      console.log(`🔧 Is Homepage: ${searchResult.isHomepage}`);
      
      return { 
        success: false, 
        method: 'Automated Address Bar Navigation',
        reason: searchResult.hasError ? 'Error page' : 'No property data'
      };
    }
    
  } catch (error) {
    console.error('❌ Automated address bar navigation test error:', error.message);
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
 * Run automated address bar navigation test
 */
async function runAutomatedAddressBarNavigationTest() {
  console.log('=== AUTOMATED ADDRESS BAR NAVIGATION TEST ===');
  console.log('🔍 This will test automated address bar typing to bypass detection!');
  console.log('📋 Steps:');
  console.log('📋 1. Launch browser');
  console.log('📋 2. Click on address bar');
  console.log('📋 3. Type "redfin.com" in address bar');
  console.log('📋 4. Hit ENTER to navigate');
  console.log('📋 5. Start search automation');
  
  const result = await testAutomatedAddressBarNavigation();
  
  if (result.success) {
    console.log('🎉 Automated Address Bar Navigation Test SUCCESS!');
    console.log('✅ Address bar navigation bypassed detection!');
    console.log('✅ Property data extracted successfully!');
    console.log(`🏠 Market Value: $${result.propertyData.price.toLocaleString()}`);
  } else {
    console.log('❌ Automated Address Bar Navigation Test FAILED!');
    console.log(`🔧 Reason: ${result.reason}`);
  }
  
  console.log('\n=== Automated Address Bar Navigation Test Complete ===');
}

// Run the test if this file is executed directly
if (require.main === module) {
  runAutomatedAddressBarNavigationTest().catch(console.error);
}

module.exports = {
  testAutomatedAddressBarNavigation,
  runAutomatedAddressBarNavigationTest
};
