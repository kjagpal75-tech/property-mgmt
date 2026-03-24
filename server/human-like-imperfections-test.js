const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteer.use(StealthPlugin());

/**
 * Test with human-like imperfections and randomness
 */
async function testHumanLikeImperfections() {
  let browser;
  let page;
  
  try {
    console.log('🚀 Testing HUMAN-LIKE IMPERFECTIONS...');
    console.log('🔍 Adding randomness, mistakes, and natural behavior');
    
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
    
    // Remove webdriver flag more aggressively
    await page.evaluateOnNewDocument(() => {
      // Remove webdriver completely
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
      
      // Add fake languages with variation
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
        configurable: true
      });
      
      // Add more realistic screen properties
      Object.defineProperty(screen, 'colorDepth', {
        get: () => 24,
        configurable: true
      });
      
      Object.defineProperty(screen, 'pixelDepth', {
        get: () => 24,
        configurable: true
      });
    });
    
    await page.setViewport({ 
      width: 1366 + Math.floor(Math.random() * 100),  // Random width variation
      height: 768 + Math.floor(Math.random() * 100)   // Random height variation
    });
    
    // More realistic user agent
    const userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    await page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)]);
    
    console.log('✅ Browser setup with human-like imperfections');
    
    // Go to Redfin
    console.log('🌐 Loading Redfin...');
    await page.goto('https://www.redfin.com', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });
    
    console.log('✅ Redfin loaded');
    
    // Human-like waiting before starting
    const initialWait = 2000 + Math.random() * 3000;  // 2-5 seconds
    await new Promise(resolve => setTimeout(resolve, initialWait));
    
    // Add random mouse movements to look natural
    console.log('🖱️ Adding random mouse movements...');
    for (let i = 0; i < 3; i++) {
      const x = Math.random() * 1366;
      const y = Math.random() * 768;
      await page.mouse.move(x, y);
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    }
    
    // Wait for search input
    await page.waitForSelector('#search-box-input', { timeout: 10000 });
    
    console.log('✅ Found search input');
    
    // Human-like clicking on input with random delay
    const inputBounds = await page.evaluate(() => {
      const input = document.querySelector('#search-box-input');
      if (input) {
        const rect = input.getBoundingClientRect();
        return {
          x: rect.left + Math.random() * 20 - 10,  // Random position near input
          y: rect.top + Math.random() * 20 - 10
        };
      }
      return null;
    });
    
    if (inputBounds) {
      await page.mouse.move(inputBounds.x, inputBounds.y);
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
    }
    
    await page.click('#search-box-input');
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    // Clear input with human-like behavior
    console.log('🧹 Clearing input with human-like behavior...');
    
    // Multiple backspaces with random timing
    const backspaceCount = 5 + Math.floor(Math.random() * 10);  // 5-15 backspaces
    for (let i = 0; i < backspaceCount; i++) {
      await page.keyboard.press('Backspace');
      const delay = 50 + Math.random() * 100;  // Random delay
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Type address with human-like imperfections
    const address = '37391 mission blvd, fremont, ca 94536';
    console.log('🔤 Typing with human-like imperfections...');
    
    for (let i = 0; i < address.length; i++) {
      const char = address[i];
      
      // Random typing delay
      let baseDelay = 80 + Math.random() * 120;  // 80-200ms
      
      // Slower for numbers
      if (/\d/.test(char)) {
        baseDelay = 120 + Math.random() * 150;  // 120-270ms for numbers
      }
      
      // Occasional pause (thinking)
      if (Math.random() < 0.08) {  // 8% chance
        baseDelay = 800 + Math.random() * 1000;  // 0.8-1.8 second pause
        console.log(`🤔 Thinking... (${Math.round(baseDelay/1000)}s pause)`);
      }
      
      // Occasional typo (5% chance)
      if (Math.random() < 0.05) {
        const wrongChar = String.fromCharCode(97 + Math.floor(Math.random() * 26));  // Random letter
        await page.keyboard.type(wrongChar);
        await new Promise(resolve => setTimeout(resolve, 200));
        await page.keyboard.press('Backspace');
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log(`🔤 Typo: typed "${wrongChar}" then corrected`);
      }
      
      await page.keyboard.type(char);
      await new Promise(resolve => setTimeout(resolve, baseDelay));
      
      // Progress updates
      if ((i + 1) % 8 === 0 || i === address.length - 1) {
        console.log(`🔤 Typed: "${address.substring(0, i + 1)}"`);
      }
    }
    
    console.log('✅ Address typed with imperfections');
    
    // Human-like waiting before submitting
    const submitWait = 1000 + Math.random() * 2000;  // 1-3 seconds
    console.log(`⏳ Waiting before submit... (${Math.round(submitWait/1000)}s)`);
    await new Promise(resolve => setTimeout(resolve, submitWait));
    
    // Random mouse movement before submit
    const finalX = Math.random() * 1366;
    const finalY = Math.random() * 768;
    await page.mouse.move(finalX, finalY);
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    // Submit search
    console.log('🔍 Submitting search...');
    await page.keyboard.press('Enter');
    
    // Wait for results with human-like patience
    console.log('⏳ Waiting for results... (human-like patience)');
    const resultWait = 3000 + Math.random() * 4000;  // 3-7 seconds
    await new Promise(resolve => setTimeout(resolve, resultWait));
    
    // Check results
    const searchResult = await page.evaluate(() => {
      const bodyText = document.body.innerText.toLowerCase();
      
      return {
        url: window.location.href,
        title: document.title,
        hasPropertyData: bodyText.includes('bed') && bodyText.includes('bath') && bodyText.includes('sqft'),
        hasAddress: bodyText.includes('mission') || bodyText.includes('37391') || bodyText.includes('fremont'),
        hasError: bodyText.includes('error') || bodyText.includes('blocked') || bodyText.includes('not found'),
        isHomepage: bodyText.includes('your dream home search') || bodyText.includes('popular in'),
        bodyTextLength: document.body.innerText.length
      };
    });
    
    console.log('🔍 Search Result:', searchResult);
    
    if (searchResult.hasPropertyData && searchResult.hasAddress && !searchResult.hasError && !searchResult.isHomepage) {
      console.log('🎉 SUCCESS! Human-like behavior worked!');
      
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
          yearBuilt: yearMatch ? parseInt(yearMatch[yearMatch.length - 1]) : null
        };
      });
      
      console.log('📊 PROPERTY DATA:');
      console.log(`💰 Market Value: $${propertyData.price ? propertyData.price.toLocaleString() : 'N/A'}`);
      console.log(`🏠 Bedrooms: ${propertyData.bedrooms || 'N/A'}`);
      console.log(`🚿 Bathrooms: ${propertyData.bathrooms || 'N/A'}`);
      console.log(`📐 Square Feet: ${propertyData.squareFootage ? propertyData.squareFootage.toLocaleString() : 'N/A'}`);
      console.log(`📅 Year Built: ${propertyData.yearBuilt || 'N/A'}`);
      
      // Keep browser open for inspection
      console.log('🔄 Keeping browser open for 15 seconds...');
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      return { 
        success: true, 
        method: 'Human-Like Imperfections',
        propertyData,
        url: searchResult.url,
        title: searchResult.title
      };
      
    } else {
      console.log('❌ Human-like behavior failed');
      console.log(`🔧 URL: ${searchResult.url}`);
      console.log(`🔧 Has Property Data: ${searchResult.hasPropertyData}`);
      console.log(`🔧 Has Address: ${searchResult.hasAddress}`);
      console.log(`🔧 Has Error: ${searchResult.hasError}`);
      console.log(`🔧 Is Homepage: ${searchResult.isHomepage}`);
      
      return { 
        success: false, 
        method: 'Human-Like Imperfections',
        reason: 'Search failed',
        searchResult
      };
    }
    
  } catch (error) {
    console.error('❌ Human-like imperfections test error:', error.message);
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
 * Run the human-like imperfections test
 */
async function runHumanLikeImperfectionsTest() {
  console.log('=== HUMAN-LIKE IMPERFECTIONS TEST ===');
  console.log('🔍 Adding randomness, mistakes, and natural behavior to avoid detection');
  
  const result = await testHumanLikeImperfections();
  
  if (result.success) {
    console.log('🎉 Human-Like Imperfections Test SUCCESS!');
    console.log('✅ Redfin accepted our human-like behavior');
    console.log('✅ Property data extracted successfully');
  } else {
    console.log('❌ Human-Like Imperfections Test FAILED!');
    console.log(`🔧 Reason: ${result.reason}`);
  }
  
  console.log('\n=== Human-Like Imperfections Test Complete ===');
}

// Run the test if this file is executed directly
if (require.main === module) {
  runHumanLikeImperfectionsTest().catch(console.error);
}

module.exports = {
  testHumanLikeImperfections,
  runHumanLikeImperfectionsTest
};
