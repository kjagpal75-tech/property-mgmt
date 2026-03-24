const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteer.use(StealthPlugin());

/**
 * Simple stealth test to verify browser setup
 */
async function testStealthBrowser() {
  let browser;
  let page;
  
  try {
    console.log('🚀 Starting stealth browser test...');
    
    // Launch browser with stealth settings
    browser = await puppeteer.launch({
      headless: false,  // Show browser window
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    
    console.log('✅ Browser launched successfully');
    
    page = await browser.newPage();
    console.log('✅ New page created');
    
    // Set realistic viewport
    await page.setViewport({ width: 1366, height: 768 });
    console.log('✅ Viewport set to 1366x768');
    
    // Set realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    console.log('✅ User agent set');
    
    // Test with a simple site first
    console.log('🌐 Navigating to example.com...');
    await page.goto('https://example.com', {
      waitUntil: 'networkidle2',
      timeout: 15000
    });
    
    console.log('✅ Successfully loaded example.com');
    
    // Get page title
    const title = await page.title();
    console.log('✅ Page title:', title);
    
    // Take screenshot
    await page.screenshot({ path: 'stealth-test-example.png' });
    console.log('✅ Screenshot saved');
    
    // Test stealth detection
    const isDetected = await page.evaluate(() => {
      return {
        webdriver: window.navigator.webdriver,
        plugins: navigator.plugins.length,
        languages: navigator.languages.length,
        platform: navigator.platform,
        userAgent: navigator.userAgent
      };
    });
    
    console.log('🔍 Browser fingerprint:', isDetected);
    
    // Now try Redfin with shorter timeout
    console.log('🏠 Testing Redfin navigation...');
    try {
      await page.goto('https://www.redfin.com', {
        waitUntil: 'domcontentloaded',  // Less strict than networkidle2
        timeout: 20000
      });
      
      const redfinTitle = await page.title();
      console.log('✅ Redfin title:', redfinTitle);
      
      // Take screenshot
      await page.screenshot({ path: 'stealth-test-redfin.png' });
      console.log('✅ Redfin screenshot saved');
      
      // Check if we're on the right page
      const currentUrl = page.url();
      console.log('✅ Current URL:', currentUrl);
      
      if (currentUrl.includes('redfin.com')) {
        console.log('🎉 SUCCESS: Stealth browser accessed Redfin!');
        
        // Now try property search
        console.log('🔍 Testing property search...');
        
        // Wait for search input
        await page.waitForSelector('input[placeholder*="Address"], input[placeholder*="search"], .search-input', { timeout: 10000 });
        console.log('✅ Found search input');
        
        // Type address with human-like delays
        const address = '37391 mission blvd, fremont, ca 94536';
        await page.type('input[placeholder*="Address"], input[placeholder*="search"], .search-input', address, { delay: 100 });
        console.log('✅ Typed address:', address);
        
        // Submit search
        await page.keyboard.press('Enter');
        console.log('✅ Pressed Enter to search');
        
        // Wait for results
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Take screenshot of results
        await page.screenshot({ path: 'stealth-test-search-results.png' });
        console.log('✅ Search results screenshot saved');
        
        const resultsUrl = page.url();
        console.log('✅ Results URL:', resultsUrl);
        
        return true;
      } else {
        console.log('⚠️  Redirected to different page');
        return false;
      }
      
    } catch (error) {
      console.log('❌ Redfin navigation failed:', error.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Stealth test error:', error.message);
    return false;
  } finally {
    if (page) {
      await page.close();
      console.log('✅ Page closed');
    }
    if (browser) {
      await browser.close();
      console.log('✅ Browser closed');
    }
  }
}

/**
 * Test stealth capabilities
 */
async function testStealthCapabilities() {
  console.log('=== Testing Stealth Browser Capabilities ===');
  
  const success = await testStealthBrowser();
  
  if (success) {
    console.log('🎉 Stealth browser test PASSED!');
    console.log('✅ Ready for Redfin property search');
  } else {
    console.log('❌ Stealth browser test FAILED!');
    console.log('🔧 Need to adjust browser settings');
  }
  
  console.log('\n=== Stealth Browser Test Complete ===');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testStealthCapabilities().catch(console.error);
}

module.exports = {
  testStealthBrowser,
  testStealthCapabilities
};
