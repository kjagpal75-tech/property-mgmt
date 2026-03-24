const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteer.use(StealthPlugin());

/**
 * Ultra-human-like browser automation
 */
async function testHumanLikeBehavior() {
  let browser;
  let page;
  
  try {
    console.log('🚀 Starting ULTRA-HUMAN-LIKE browser test...');
    
    // Launch browser with more human settings
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--user-data-dir=/tmp/chrome-user-data'  // Persistent user data
      ]
    });
    
    page = await browser.newPage();
    
    // Remove webdriver flag
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });
    
    // Set realistic viewport with random size
    const viewports = [
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
      { width: 1536, height: 864 },
      { width: 1920, height: 1080 }
    ];
    const randomViewport = viewports[Math.floor(Math.random() * viewports.length)];
    await page.setViewport(randomViewport);
    
    // Set realistic user agent
    const userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    await page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)]);
    
    console.log('✅ Browser setup complete with human-like settings');
    
    // Add random mouse movements before going to Redfin
    console.log('🖱️ Adding random mouse movements...');
    await page.mouse.move(100 + Math.random() * 500, 100 + Math.random() * 500);
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    await page.mouse.move(200 + Math.random() * 600, 200 + Math.random() * 600);
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    // Go to Redfin
    console.log('🌐 Loading Redfin...');
    await page.goto('https://www.redfin.com', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    console.log('✅ Redfin loaded');
    
    // Wait like a human would
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    // Add more random mouse movements
    await page.mouse.move(300 + Math.random() * 400, 300 + Math.random() * 400);
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // Find and click search input with human-like behavior
    console.log('🔍 Looking for search input...');
    
    const searchInput = await page.waitForSelector('#search-box-input', { timeout: 10000 });
    console.log('✅ Found search input');
    
    // Move mouse to search input like a human
    const inputBounds = await searchInput.boundingBox();
    if (inputBounds) {
      await page.mouse.move(inputBounds.x + inputBounds.width / 2, inputBounds.y + inputBounds.height / 2);
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    }
    
    // Click on search input
    await searchInput.click();
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
    
    // Type address with human-like variations
    const address = '37391 mission blvd, fremont, ca 94536';
    console.log('🔤 Typing address with human-like timing...');
    
    for (let i = 0; i < address.length; i++) {
      const char = address[i];
      await page.keyboard.type(char);
      
      // Human-like typing delay with variations
      let delay = 100 + Math.random() * 150; // Base delay
      
      // Slower for numbers, faster for letters
      if (/\d/.test(char)) {
        delay = 150 + Math.random() * 200;
      } else if (/[a-z]/.test(char)) {
        delay = 80 + Math.random() * 120;
      }
      
      // Longer pauses for spaces and commas
      if (char === ' ' || char === ',') {
        delay = 300 + Math.random() * 400;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Occasional "thinking" pauses
      if (Math.random() < 0.1) { // 10% chance
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      }
    }
    
    console.log('✅ Address typed');
    
    // Wait like a human would before submitting
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Add some random mouse movement
    await page.mouse.move(400 + Math.random() * 300, 400 + Math.random() * 300);
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    // Move back to search area
    if (inputBounds) {
      await page.mouse.move(inputBounds.x + inputBounds.width / 2, inputBounds.y + inputBounds.height + 50);
    }
    
    // Submit search
    console.log('🔍 Submitting search...');
    await page.keyboard.press('Enter');
    
    // Wait for results with human-like patience
    console.log('⏳ Waiting for property page...');
    await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 3000));
    
    // Check current URL
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    // Check if we got the property page
    const pageAnalysis = await page.evaluate(() => {
      const bodyText = document.body.innerText.toLowerCase();
      
      return {
        hasPropertyData: bodyText.includes('bed') && bodyText.includes('bath') && bodyText.includes('sqft'),
        hasAddress: bodyText.includes('mission') || bodyText.includes('37391') || bodyText.includes('fremont'),
        hasError: bodyText.includes('error') || bodyText.includes('blocked') || bodyText.includes('not found'),
        isHomepage: bodyText.includes('your dream home search'),
        url: window.location.href,
        title: document.title
      };
    });
    
    console.log('🔍 Page Analysis:', pageAnalysis);
    
    if (pageAnalysis.hasPropertyData && pageAnalysis.hasAddress) {
      console.log('🎉 SUCCESS! Got property page with correct address');
      
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
          squareFootage: sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, '')) : null
        };
      });
      
      console.log('📊 Property Data:', propertyData);
      
      // Keep browser open for inspection
      console.log('🔄 Keeping browser open for 10 seconds...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      return { success: true, propertyData, url: currentUrl };
      
    } else {
      console.log('❌ Did not get property page');
      return { success: false, analysis: pageAnalysis };
    }
    
  } catch (error) {
    console.error('❌ Human-like test error:', error.message);
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
 * Run the human-like test
 */
async function runHumanLikeTest() {
  console.log('=== ULTRA-HUMAN-LIKE BROWSER TEST ===');
  
  const result = await testHumanLikeBehavior();
  
  if (result.success) {
    console.log('🎉 Human-like Test SUCCESS!');
    console.log('✅ Mimicked human behavior perfectly');
  } else {
    console.log('❌ Human-like Test FAILED!');
    console.log('🔧 Still being detected as bot');
  }
  
  console.log('\n=== Ultra-Human-Like Test Complete ===');
}

// Run the test if this file is executed directly
if (require.main === module) {
  runHumanLikeTest().catch(console.error);
}

module.exports = {
  testHumanLikeBehavior,
  runHumanLikeTest
};
