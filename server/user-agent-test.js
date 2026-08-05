const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteer.use(StealthPlugin());

/**
 * Test different user-agent strings
 */
async function testUserAgentVariations() {
  let browser;
  let page;
  
  try {
    console.log('🚀 Testing DIFFERENT USER-AGENT STRINGS...');
    
    // Different user-agent options
    const userAgentOptions = [
      {
        name: 'Latest Chrome',
        string: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        notes: 'Latest version, less common'
      },
      {
        name: 'Common Chrome Version',
        string: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        notes: 'Slightly older, more common'
      },
      {
        name: 'Windows Chrome',
        string: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        notes: 'Different OS, might bypass detection'
      },
      {
        name: 'Linux Chrome',
        string: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        notes: 'Different OS, might bypass detection'
      },
      {
        name: 'Safari User-Agent',
        string: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        notes: 'Completely different browser'
      },
      {
        name: 'Firefox User-Agent',
        string: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/109.0',
        notes: 'Different browser engine'
      },
      {
        name: 'Edge User-Agent',
        string: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        notes: 'Edge browser'
      }
    ];
    
    for (let i = 0; i < userAgentOptions.length; i++) {
      const option = userAgentOptions[i];
      
      console.log(`\n=== Testing ${option.name} ===`);
      console.log(`🔍 User-Agent: ${option.string}`);
      console.log(`📝 Notes: ${option.notes}`);
      
      browser = await puppeteer.launch({
        headless: false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      });
      
      page = await browser.newPage();
      
      // Set the user-agent
      await page.setUserAgent(option.string);
      await page.setViewport({ width: 1366, height: 768 });
      
      // Remove automation indicators
      await page.evaluateOnNewDocument((userAgent) => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
          configurable: true
        });
        
        // Override user-agent to match what we set
        Object.defineProperty(navigator, 'userAgent', {
          get: () => userAgent,
          configurable: true
        });
        
        // Add fake plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [
            {
              0: {type: "application/x-google-chrome-pdf", suffix: "pdf", description: "Portable Document Format"},
              1: {type: "application/x-google-chrome-pdf", suffix: "pdf", description: "Portable Document Format"}
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
      }, option.string);
      
      console.log('✅ Browser setup complete');
      
      // Go to Redfin
      console.log('🌐 Loading Redfin...');
      await page.goto('https://www.redfin.com', {
        waitUntil: 'domcontentloaded',
          timeout: 20000
      });
      
      console.log('✅ Redfin loaded');
      
      // Wait for page to be ready
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check what user-agent is actually being used
      const actualUserAgent = await page.evaluate(() => {
        return {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          vendor: navigator.vendor,
          appName: navigator.appName,
          appVersion: navigator.appVersion,
          webdriver: navigator.webdriver,
          plugins: navigator.plugins.length,
          languages: navigator.languages,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine
        };
      });
      
      console.log('🔍 Actual Browser Info:', actualUserAgent);
      
      // Check if we can access search input
      try {
        await page.waitForSelector('#search-box-input', { timeout: 5000 });
        console.log('✅ Search input found - can interact');
        
        // Take screenshot
        await page.screenshot({ path: `user-agent-test-${option.name.toLowerCase().replace(/\s+/g, '-')}.png` });
        console.log(`✅ Screenshot saved: user-agent-test-${option.name.toLowerCase().replace(/\s+/g, '-')}.png`);
        
      } catch (error) {
        console.log('❌ Cannot access search input - likely blocked');
        console.log(`🔧 Error: ${error.message}`);
      }
      
      // Close browser
      if (page) {
        await page.close();
      }
      if (browser) {
        await browser.close();
      }
      
      // Wait before next test
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
  } catch (error) {
    console.error('❌ User-Agent test error:', error.message);
  }
}

/**
 * Run user-agent variations test
 */
async function runUserAgentVariationsTest() {
  console.log('=== USER-AGENT VARIATIONS TEST ===');
  console.log('🔍 Testing different user-agent strings to see if any bypass Redfin detection!');
  
  await testUserAgentVariations();
  
  console.log('\n=== User-Agent Variations Test Complete ===');
}

// Run the test if this file is executed directly
if (require.main === module) {
  runUserAgentVariationsTest().catch(console.error);
}

module.exports = {
  testUserAgentVariations,
  runUserAgentVariationsTest
};
