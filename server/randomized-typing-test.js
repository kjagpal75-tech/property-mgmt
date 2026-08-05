const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteer.use(StealthPlugin());

/**
 * Test with randomized typing variance (500ms-2s)
 */
async function testRandomizedTyping() {
  let browser;
  let page;
  
  try {
    console.log('🚀 Testing RANDOMIZED TYPING (500ms-2s variance)...');
    console.log('🔍 Adding 500ms to 2s random variance between each character!');
    
    browser = await puppeteer.launch({
      headless: false,  // Show browser so you can see typing
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
    
    console.log('✅ Found search input');
    
    // Click on search input to focus
    await searchInput.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
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
    
    // Type address with randomized timing (500ms-2s variance)
    const address = '37391 mission blvd, fremont, ca 94536';
    console.log('🔤 Typing address with RANDOMIZED timing (500ms-2s variance)...');
    
    for (let i = 0; i < address.length; i++) {
      const char = address[i];
      
      // Randomized delay: 500ms to 2s (2000ms)
      const randomDelay = 500 + Math.random() * 1500; // 500ms to 2000ms variance
      
      await page.keyboard.type(char);
      await new Promise(resolve => setTimeout(resolve, randomDelay));
      
      // Show progress with timing info
      if ((i + 1) % 5 === 0 || i === address.length - 1) {
        console.log(`🔤 Typed "${address.substring(0, i + 1)}" (delay: ${Math.round(randomDelay)}ms)`);
      }
      
      // Occasional longer pause (human-like thinking)
      if (Math.random() < 0.1) { // 10% chance
        const thinkingDelay = 1000 + Math.random() * 2000; // 1-3 seconds
        console.log(`🤔 Thinking pause... (${Math.round(thinkingDelay)}ms)`);
        await new Promise(resolve => setTimeout(resolve, thinkingDelay));
      }
      
      // Occasional typo simulation (5% chance)
      if (Math.random() < 0.05) { // 5% chance
        const wrongChar = String.fromCharCode(97 + Math.floor(Math.random() * 26)); // Random letter
        await page.keyboard.type(wrongChar);
        await new Promise(resolve => setTimeout(resolve, 200));
        await page.keyboard.press('Backspace');
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log(`🔤 Typo: typed "${wrongChar}" then corrected`);
      }
    }
    
    console.log('✅ Address typed with randomized timing');
    
    // Wait before submitting
    const submitWait = 1000 + Math.random() * 2000; // 1-3 seconds
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
    await page.screenshot({ path: 'randomized-typing-test.png' });
    console.log('✅ Screenshot saved: randomized-typing-test.png');
    
    if (searchResult.hasPropertyData && searchResult.hasAddress && !searchResult.hasError && !searchResult.isHomepage) {
      console.log('🎉 SUCCESS! Randomized typing worked!');
      
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
        method: 'Randomized Typing (500ms-2s variance)',
        propertyData,
        url: searchResult.url,
        title: searchResult.title
      };
      
    } else {
      console.log('❌ Randomized typing failed');
      console.log(`🔧 URL: ${searchResult.url}`);
      console.log(`🔧 Has Property Data: ${searchResult.hasPropertyData}`);
      console.log(`🔧 Has Address: ${searchResult.hasAddress}`);
      console.log(`🔧 Has Error: ${searchResult.hasError}`);
      console.log(`🔧 Is Homepage: ${searchResult.isHomepage}`);
      
      return { 
        success: false, 
        method: 'Randomized Typing (500ms-2s variance)',
        reason: searchResult.hasError ? 'Error page' : 'No property data'
      };
    }
    
  } catch (error) {
    console.error('❌ Randomized typing test error:', error.message);
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
 * Run randomized typing test
 */
async function runRandomizedTypingTest() {
  console.log('=== RANDOMIZED TYPING TEST (500ms-2s variance) ===');
  console.log('🔍 Testing randomized typing with 500ms to 2s variance between characters!');
  
  const result = await testRandomizedTyping();
  
  if (result.success) {
    console.log('🎉 Randomized Typing Test SUCCESS!');
    console.log('✅ Randomized timing worked!');
    console.log('✅ Property data extracted successfully!');
  } else {
    console.log('❌ Randomized Typing Test FAILED!');
    console.log(`🔧 Reason: ${result.reason}`);
  }
  
  console.log('\n=== Randomized Typing Test Complete ===');
}

// Run the test if this file is executed directly
if (require.main === module) {
  runRandomizedTypingTest().catch(console.error);
}

module.exports = {
  testRandomizedTyping,
  runRandomizedTypingTest
};
