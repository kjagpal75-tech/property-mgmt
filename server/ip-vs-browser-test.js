const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteer.use(StealthPlugin);

/**
 * Test if the issue is IP-based vs browser-based
 */
async function testIPvsBrowserDifference() {
  let browser;
  let page;
  
  try {
    console.log('🚀 Testing IP vs Browser difference...');
    console.log('🔍 This will help us understand why your manual browser works but ours fails');
    
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    
    page = await browser.newPage();
    
    // Remove automation indicators
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
    });
    
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('✅ Browser setup complete');
    
    // Test 1: Go to Redfin homepage and check if we're immediately blocked
    console.log('\n=== Test 1: Homepage Access ===');
    await page.goto('https://www.redfin.com', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });
    
    const homepageAnalysis = await page.evaluate(() => {
      const bodyText = document.body.innerText.toLowerCase();
      return {
        hasError: bodyText.includes('error') || bodyText.includes('blocked'),
        isHomepage: bodyText.includes('your dream home search'),
        hasSearch: bodyText.includes('search') || bodyText.includes('address'),
        bodyLength: document.body.innerText.length
      };
    });
    
    console.log('🔍 Homepage Analysis:', homepageAnalysis);
    
    if (homepageAnalysis.hasError) {
      console.log('❌ Immediately blocked on homepage - IP is blacklisted');
      return { success: false, reason: 'IP blacklisted' };
    }
    
    // Test 2: Try to find and interact with search input
    console.log('\n=== Test 2: Search Input Access ===');
    
    try {
      await page.waitForSelector('#search-box-input', { timeout: 5000 });
      console.log('✅ Search input found');
      
      // Try to type a simple test
      await page.click('#search-box-input');
      await page.keyboard.type('test');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const inputValue = await page.evaluate(() => {
        const input = document.querySelector('#search-box-input');
        return input ? input.value : '';
      });
      
      console.log('📝 Input test value:', inputValue);
      
      if (inputValue.includes('test')) {
        console.log('✅ Can type in search input');
      } else {
        console.log('❌ Cannot type in search input');
      }
      
    } catch (error) {
      console.log('❌ Cannot access search input:', error.message);
    }
    
    // Test 3: Try a minimal search
    console.log('\n=== Test 3: Minimal Search Test ===');
    
    try {
      // Clear input and type simple address
      await page.click('#search-box-input');
      await page.keyboard.down('Meta');
      await page.keyboard.press('a');
      await page.keyboard.up('Meta');
      await page.keyboard.press('Backspace');
      
      // Type a simple, well-known address
      const simpleAddress = '1600 pennsylvania ave, washington dc';
      for (const char of simpleAddress) {
        await page.keyboard.type(char);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      console.log('✅ Typed simple address:', simpleAddress);
      
      // Submit search
      await page.keyboard.press('Enter');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const searchResult = await page.evaluate(() => {
        const bodyText = document.body.innerText.toLowerCase();
        return {
          url: window.location.href,
          title: document.title,
          hasPropertyData: bodyText.includes('bed') && bodyText.includes('bath'),
          hasError: bodyText.includes('error') || bodyText.includes('blocked'),
          isHomepage: bodyText.includes('your dream home search')
        };
      });
      
      console.log('🔍 Search Result:', searchResult);
      
      if (searchResult.hasPropertyData) {
        console.log('🎉 SUCCESS! Search worked with simple address');
        return { success: true, result: searchResult };
      } else if (searchResult.hasError || searchResult.isHomepage) {
        console.log('❌ Search failed - blocked or redirected');
        return { success: false, reason: 'Search blocked' };
      } else {
        console.log('❓ Unclear result - no property data but no error');
        return { success: false, reason: 'No property data' };
      }
      
    } catch (error) {
      console.log('❌ Search test error:', error.message);
      return { success: false, reason: 'Search error' };
    }
    
  } catch (error) {
    console.error('❌ IP vs Browser test error:', error.message);
    return { success: false, reason: 'Test error' };
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
 * Run the IP vs Browser difference test
 */
async function runIPvsBrowserTest() {
  console.log('=== IP vs BROWSER DIFFERENCE TEST ===');
  console.log('🔍 This will help us understand why manual browser works but automation fails');
  
  const result = await testIPvsBrowserDifference();
  
  if (result.success) {
    console.log('🎉 IP vs Browser Test SUCCESS!');
    console.log('✅ Automation can work - issue might be specific to our approach');
  } else {
    console.log('❌ IP vs Browser Test FAILED!');
    console.log(`🔧 Reason: ${result.reason}`);
    
    if (result.reason === 'IP blacklisted') {
      console.log('💡 SOLUTION: Wait for IP to cool down or use different IP');
    } else if (result.reason === 'Search blocked') {
      console.log('💡 SOLUTION: Try different search approach or wait');
    }
  }
  
  console.log('\n=== IP vs Browser Difference Test Complete ===');
}

// Run the test if this file is executed directly
if (require.main === module) {
  runIPvsBrowserTest().catch(console.error);
}

module.exports = {
  testIPvsBrowserDifference,
  runIPvsBrowserTest
};
