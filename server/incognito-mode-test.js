const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteer.use(StealthPlugin());

/**
 * Test with Incognito mode to bypass trust issues
 */
async function testWithIncognitoMode() {
  let browser;
  let page;
  
  try {
    console.log('🚀 Testing INCOGNITO MODE...');
    console.log('🔍 This should bypass trust issues and IP blacklisting!');
    
    // Launch browser in incognito mode
    browser = await puppeteer.launch({
      headless: false,  // Show browser so you can see it working
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--no-first-run',  // Skip first-run setup
        '--disable-default-apps',  // Skip default app prompts
        '--incognito',  // KEY: Launch in incognito mode
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-logging'
      ]
    });
    
    console.log('✅ Browser launched in INCOGNITO mode');
    
    page = await browser.newPage();
    
    // Remove webdriver flag more aggressively
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
        configurable: true
      });
      
      // Add fake plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          {
            0: {type: "application/x-google-chrome-pdf", suffix: "pdf", description: "Portable Document Format"},
            1: {type: "application/x-google-chrome-pdf", suffix: "pdf", description: "Portable Document Format"},
            2: {type: "application/x-google-chrome-pdf", suffix: "pdf", description: "Portable Document Format"},
            3: {type: "application/x-google-chrome-pdf", suffix: "pdf", description: "Portable Document Format"},
            4: {type: "application/x-google-chrome-pdf", suffix: "pdf", description: "Portable Document Format"},
            5: {type: "application/x-google-chrome-pdf", suffix: "pdf", description: "Portable Document Format"}
          }
        ],
        configurable: true
      });
      
      // Add realistic screen properties
      Object.defineProperty(screen, 'colorDepth', {
        get: () => 24,
        configurable: true
      });
      
      Object.defineProperty(screen, 'pixelDepth', {
        get: () => 24,
        configurable: true
      });
    });
    
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('✅ Page setup complete');
    
    // Go to Redfin
    console.log('🌐 Loading Redfin in INCOGNITO mode...');
    await page.goto('https://www.redfin.com', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });
    
    console.log('✅ Redfin loaded');
    
    // Wait for page to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if we're already logged in or have session
    const sessionInfo = await page.evaluate(() => {
      const bodyText = document.body.innerText.toLowerCase();
      
      return {
        isLoggedIn: bodyText.includes('sign out') || bodyText.includes('my redfin') || bodyText.includes('dashboard'),
        hasSearch: bodyText.includes('search') || bodyText.includes('address'),
        hasWelcome: bodyText.includes('welcome') || bodyText.includes('welcome back'),
        isIncognito: navigator.webdriver === undefined && !window.chrome,
        bodyTextLength: document.body.innerText.length,
        cookiesEnabled: navigator.cookieEnabled,
        localStorageExists: !!localStorage,
        sampleText: document.body.innerText.substring(0, 1000)
      };
    });
    
    console.log('🔍 Session Info:', sessionInfo);
    
    if (sessionInfo.isLoggedIn) {
      console.log('✅ Already logged in!');
    } else {
      console.log('ℹ️  Fresh session (as expected in incognito)');
    }
    
    // Wait for search input
    await page.waitForSelector('#search-box-input', { timeout: 10000 });
    const searchInput = await page.$('#search-box-input');
    
    console.log('✅ Found search input');
    
    // Click on search input
    await searchInput.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Clear input with simple method
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
    
    // Type address with human-like timing
    const address = '37391 mission blvd, fremont, ca 94536';
    console.log('🔤 Typing address...');
    
    for (let i = 0; i < address.length; i++) {
      const char = address[i];
      await page.keyboard.type(char);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Show progress
      if ((i + 1) % 10 === 0 || i === address.length - 1) {
        console.log(`🔤 Typed: "${address.substring(0, i + 1)}"`);
      }
    }
    
    console.log('✅ Address typed');
    
    // Wait before submitting
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Submit search
    console.log('🔍 Submitting search...');
    await page.keyboard.press('Enter');
    
    // Wait for results
    console.log('⏳ Waiting for property page to load...');
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
        sampleText: document.body.innerText.substring(0, 1500)
      };
    });
    
    console.log('🔍 Search Result:', searchResult);
    
    if (searchResult.hasPropertyData && searchResult.hasAddress && !searchResult.hasError && !searchResult.isHomepage) {
      console.log('🎉 SUCCESS! Incognito mode worked!');
      
      // Extract property data
      const propertyData = await page.evaluate(() => {
        const pageText = document.body.innerText;
        
        const priceMatch = pageText.match(/\$[\d,]+/);
        const bedMatch = pageText.match(/(\d+)\s*beds?/i);
        const bathMatch = pageText.match(/(\d+(?:\.\d+)?)\s*baths?/i);
        const sqftMatch = pageText.match(/(\d+(?:,\d+)*)\s*sq\s*ft/i);
        const yearMatch = pageText.match(/\b(19|20)\d{2}\b/g);
        
        return {
          price: priceMatch ? parseFloat(priceMatch[0].replace(/[$,]/g, '')) : null,
          bedrooms: bedMatch ? parseInt(bedMatch[1]) : null,
          bathrooms: bathMatch ? parseFloat(bathMatch[1]) : null,
          squareFootage: sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, '')) : null,
          yearBuilt: yearMatch ? parseInt(yearMatch[yearMatch.length - 1]) : null,
          sampleText: pageText.substring(0, 1000)
        };
      });
      
      console.log('📊 PROPERTY DATA:');
      console.log(`💰 Market Value: $${propertyData.price ? propertyData.price.toLocaleString() : 'N/A'}`);
      console.log(`🏠 Bedrooms: ${propertyData.bedrooms || 'N/A'}`);
      console.log(`🚿 Bathrooms: ${propertyData.bathrooms || 'N/A'}`);
      console.log(`📐 Square Feet: ${propertyData.squareFootage ? propertyData.squareFootage.toLocaleString() : 'N/A'}`);
      console.log(`📅 Year Built: ${propertyData.yearBuilt || 'N/A'}`);
      
      // Keep browser open for inspection
      console.log('🔄 Keeping browser open for 20 seconds...');
      await new Promise(resolve => setTimeout(resolve, 20000));
      
      return { 
        success: true, 
        method: 'Incognito Mode',
        propertyData,
        url: searchResult.url,
        title: searchResult.title
      };
      
    } else {
      console.log('❌ Incognito mode failed');
      console.log(`🔧 URL: ${searchResult.url}`);
      console.log(`🔧 Has Property Data: ${searchResult.hasPropertyData}`);
      console.log(`🔧 Has Address: ${searchResult.hasAddress}`);
      console.log(`🔧 Has Error: ${searchResult.hasError}`);
      console.log(`🔧 Is Homepage: ${searchResult.isHomepage}`);
      
      return { 
        success: false, 
        method: 'Incognito Mode',
        reason: 'Search failed',
        searchResult
      };
    }
    
  } catch (error) {
    console.error('❌ Incognito mode test error:', error.message);
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
 * Run the incognito mode test
 */
async function runIncognitoModeTest() {
  console.log('=== INCOGNITO MODE TEST ===');
  console.log('🔍 Using incognito mode to bypass trust issues and IP blacklisting!');
  
  const result = await testWithIncognitoMode();
  
  if (result.success) {
    console.log('🎉 Incognito Mode Test SUCCESS!');
    console.log('✅ Incognito mode bypassed Redfin detection!');
    console.log('✅ Property data extracted successfully!');
    console.log(`🏠 Market Value: $${result.propertyData.price.toLocaleString()}`);
  } else {
    console.log('❌ Incognito Mode Test FAILED!');
    console.log(`🔧 Reason: ${result.reason}`);
  }
  
  console.log('\n=== Incognito Mode Test Complete ===');
}

// Run the test if this file is executed directly
if (require.main === module) {
  runIncognitoModeTest().catch(console.error);
}

module.exports = {
  testWithIncognitoMode,
  runIncognitoModeTest
};
