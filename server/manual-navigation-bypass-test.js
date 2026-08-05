const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteer.use(StealthPlugin());

/**
 * Test manual navigation bypass - type redfin.com in address bar
 */
async function testManualNavigationBypass() {
  let browser;
  let page;
  
  try {
    console.log('🚀 TESTING MANUAL NAVIGATION BYPASS...');
    console.log('🔍 Step 1: Launch browser (no navigation)');
    console.log('🔍 Step 2: You manually type "redfin.com" in address bar');
    console.log('🔍 Step 3: Hit ENTER to navigate');
    console.log('🔍 Step 4: Then automation takes over for search');
    
    browser = await puppeteer.launch({
      headless: false,  // Show browser so you can type in address bar
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('✅ Browser launched - waiting for you to manually navigate...');
    
    // Wait for you to manually navigate to Redfin
    console.log('⏳ PLEASE MANUALLY TYPE "redfin.com" IN ADDRESS BAR AND HIT ENTER');
    console.log('⏳ I will wait for Redfin to load...');
    
    // Wait for Redfin page to load (you navigate manually)
    await new Promise(resolve => setTimeout(resolve, 15000)); // 15 seconds for you to navigate
    
    // Check if we're on Redfin
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    if (!currentUrl.includes('redfin.com')) {
      console.log('❌ You haven\'t navigated to Redfin yet. Waiting...');
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 more seconds
      
      const checkUrl = page.url();
      if (!checkUrl.includes('redfin.com')) {
        console.log('❌ Still not on Redfin. Please navigate manually first.');
        return { success: false, reason: 'No manual navigation to Redfin' };
      }
    }
    
    console.log('✅ Successfully detected Redfin page - starting automation...');
    
    // Wait for page to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // === NOW START AUTOMATION FOR SEARCH ===
    console.log('\n=== STARTING AUTOMATION FOR SEARCH ===');
    
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
    await page.screenshot({ path: 'manual-navigation-bypass.png' });
    console.log('✅ Screenshot saved: manual-navigation-bypass.png');
    
    if (searchResult.hasPropertyData && searchResult.hasAddress && !searchResult.hasError && !searchResult.isHomepage) {
      console.log('🎉 SUCCESS! Manual navigation bypass worked!');
      
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
      console.log('🔄 Keeping browser open for 15 seconds...');
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      return { 
        success: true, 
        method: 'Manual Navigation Bypass',
        propertyData,
        url: searchResult.url,
        title: searchResult.title
      };
      
    } else {
      console.log('❌ Manual navigation bypass failed');
      console.log(`🔧 URL: ${searchResult.url}`);
      console.log(`🔧 Has Property Data: ${searchResult.hasPropertyData}`);
      console.log(`🔧 Has Address: ${searchResult.hasAddress}`);
      console.log(`🔧 Has Error: ${searchResult.hasError}`);
      console.log(`🔧 Is Homepage: ${searchResult.isHomepage}`);
      
      return { 
        success: false, 
        method: 'Manual Navigation Bypass',
        reason: searchResult.hasError ? 'Error page' : 'No property data'
      };
    }
    
  } catch (error) {
    console.error('❌ Manual navigation bypass test error:', error.message);
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
 * Run manual navigation bypass test
 */
async function runManualNavigationBypassTest() {
  console.log('=== MANUAL NAVIGATION BYPASS TEST ===');
  console.log('🔍 This will test manual navigation to bypass initial detection!');
  console.log('📋 INSTRUCTIONS:');
  console.log('📋 1. Browser will launch');
  console.log('📋 2. YOU manually type "redfin.com" in address bar');
  console.log('📋 3. YOU hit ENTER to navigate');
  console.log('📋 4. Automation will take over for search');
  
  const result = await testManualNavigationBypass();
  
  if (result.success) {
    console.log('🎉 Manual Navigation Bypass Test SUCCESS!');
    console.log('✅ Manual navigation bypassed initial detection!');
    console.log('✅ Property data extracted successfully!');
    console.log(`🏠 Market Value: $${result.propertyData.price.toLocaleString()}`);
  } else {
    console.log('❌ Manual Navigation Bypass Test FAILED!');
    console.log(`🔧 Reason: ${result.reason}`);
  }
  
  console.log('\n=== Manual Navigation Bypass Test Complete ===');
}

// Run the test if this file is executed directly
if (require.main === module) {
  runManualNavigationBypassTest().catch(console.error);
}

module.exports = {
  testManualNavigationBypass,
  runManualNavigationBypassTest
};
