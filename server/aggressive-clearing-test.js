const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteer.use(StealthPlugin());

/**
 * Test aggressive input field clearing
 */
async function testAggressiveClearing() {
  let browser;
  let page;
  
  try {
    console.log('🚀 Testing AGGRESSIVE input field clearing...');
    
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Go to Redfin
    await page.goto('https://www.redfin.com', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });
    
    console.log('✅ Redfin loaded');
    
    // Wait for search input
    await page.waitForSelector('#search-box-input', { timeout: 10000 });
    
    console.log('✅ Found search input');
    
    // Test aggressive clearing methods
    const clearingMethods = [
      {
        name: 'Multiple Backspace Clear',
        execute: async () => {
          console.log('🧹 Method 1: Multiple Backspace Clear');
          
          // Click input to focus
          await page.click('#search-box-input');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Press backspace many times to clear everything
          for (let i = 0; i < 50; i++) {
            await page.keyboard.press('Backspace');
            await new Promise(resolve => setTimeout(resolve, 20));
          }
          
          // Wait for clearing to take effect
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Type address
          const address = '37391 mission blvd, fremont, ca 94536';
          for (const char of address) {
            await page.keyboard.type(char);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          // Check result
          const inputValue = await page.evaluate(() => {
            const input = document.querySelector('#search-box-input');
            return input ? input.value : '';
          });
          
          console.log(`📝 Input value: "${inputValue}"`);
          return inputValue;
        }
      },
      {
        name: 'Select All + Delete',
        execute: async () => {
          console.log('🧹 Method 2: Select All + Delete');
          
          await page.click('#search-box-input');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Try Ctrl+A then Delete
          await page.keyboard.down('Control');
          await page.keyboard.press('a');
          await page.keyboard.up('Control');
          await new Promise(resolve => setTimeout(resolve, 200));
          
          await page.keyboard.press('Delete');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Type address
          const address = '37391 mission blvd, fremont, ca 94536';
          for (const char of address) {
            await page.keyboard.type(char);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          // Check result
          const inputValue = await page.evaluate(() => {
            const input = document.querySelector('#search-box-input');
            return input ? input.value : '';
          });
          
          console.log(`📝 Input value: "${inputValue}"`);
          return inputValue;
        }
      },
      {
        name: 'JavaScript Force Clear',
        execute: async () => {
          console.log('🧹 Method 3: JavaScript Force Clear');
          
          // Force clear with multiple JavaScript approaches
          await page.evaluate(() => {
            const input = document.querySelector('#search-box-input');
            if (input) {
              // Clear value
              input.value = '';
              
              // Clear selection
              input.setSelectionRange(0, 0);
              
              // Trigger events
              input.focus();
              input.blur();
              input.focus();
              
              // Dispatch events
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
              input.dispatchEvent(new Event('keydown', { bubbles: true }));
              input.dispatchEvent(new Event('keyup', { bubbles: true }));
            }
          });
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Type address
          const address = '37391 mission blvd, fremont, ca 94536';
          for (const char of address) {
            await page.keyboard.type(char);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          // Check result
          const inputValue = await page.evaluate(() => {
            const input = document.querySelector('#search-box-input');
            return input ? input.value : '';
          });
          
          console.log(`📝 Input value: "${inputValue}"`);
          return inputValue;
        }
      },
      {
        name: 'Tab Away + Back',
        execute: async () => {
          console.log('🧹 Method 4: Tab Away + Back');
          
          // Click input then tab away to blur
          await page.click('#search-box-input');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Tab away to lose focus
          await page.keyboard.press('Tab');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Click back to focus
          await page.click('#search-box-input');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Clear with backspace
          for (let i = 0; i < 30; i++) {
            await page.keyboard.press('Backspace');
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          // Type address
          const address = '37391 mission blvd, fremont, ca 94536';
          for (const char of address) {
            await page.keyboard.type(char);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          // Check result
          const inputValue = await page.evaluate(() => {
            const input = document.querySelector('#search-box-input');
            return input ? input.value : '';
          });
          
          console.log(`📝 Input value: "${inputValue}"`);
          return inputValue;
        }
      },
      {
        name: 'Click Outside + Click Back',
        execute: async () => {
          console.log('🧹 Method 5: Click Outside + Click Back');
          
          // Click outside to lose focus
          await page.click('body');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Click back on input
          await page.click('#search-box-input');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Clear with backspace
          for (let i = 0; i < 30; i++) {
            await page.keyboard.press('Backspace');
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          // Type address
          const address = '37391 mission blvd, fremont, ca 94536';
          for (const char of address) {
            await page.keyboard.type(char);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          // Check result
          const inputValue = await page.evaluate(() => {
            const input = document.querySelector('#search-box-input');
            return input ? input.value : '';
          });
          
          console.log(`📝 Input value: "${inputValue}"`);
          return inputValue;
        }
      }
    ];
    
    // Test each clearing method
    for (let i = 0; i < clearingMethods.length; i++) {
      const method = clearingMethods[i];
      
      console.log(`\n=== Testing ${method.name} ===`);
      
      try {
        const result = await method.execute();
        
        if (result && result.includes('37391 mission blvd, fremont, ca 94536')) {
          console.log('✅ SUCCESS! Clean address typed');
          
          // Submit search
          console.log('🔍 Submitting search...');
          await page.keyboard.press('Enter');
          await new Promise(resolve => setTimeout(resolve, 4000));
          
          // Check results
          const searchResult = await page.evaluate(() => {
            const bodyText = document.body.innerText.toLowerCase();
            return {
              url: window.location.href,
              title: document.title,
              hasPropertyData: bodyText.includes('bed') && bodyText.includes('bath'),
              hasAddress: bodyText.includes('mission') || bodyText.includes('37391'),
              hasError: bodyText.includes('error') || bodyText.includes('blocked'),
              isHomepage: bodyText.includes('your dream home search')
            };
          });
          
          console.log('🔍 Search result:', searchResult);
          
          if (searchResult.hasPropertyData && searchResult.hasAddress && !searchResult.hasError && !searchResult.isHomepage) {
            console.log('🎉 SUCCESS! Got property page!');
            
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
            
            console.log('📊 PROPERTY DATA:', propertyData);
            
            // Keep browser open for inspection
            console.log('🔄 Keeping browser open for 15 seconds...');
            await new Promise(resolve => setTimeout(resolve, 15000));
            
            return { success: true, method: method.name, propertyData };
          } else {
            console.log('❌ Search failed');
          }
          
          break; // Success, don't try more methods
          
        } else {
          console.log('❌ Address still corrupted:', result);
        }
        
      } catch (error) {
        console.log(`❌ Error with ${method.name}:`, error.message);
      }
      
      // Wait before next method
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return { success: false, reason: 'All clearing methods failed' };
    
  } catch (error) {
    console.error('❌ Aggressive clearing test error:', error.message);
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
 * Run the aggressive clearing test
 */
async function runAggressiveClearingTest() {
  console.log('=== AGGRESSIVE INPUT FIELD CLEARING TEST ===');
  
  const result = await testAggressiveClearing();
  
  if (result.success) {
    console.log('🎉 Aggressive Clearing Test SUCCESS!');
    console.log(`✅ Method that worked: ${result.method}`);
    console.log('✅ Property data extracted successfully');
  } else {
    console.log('❌ Aggressive Clearing Test FAILED!');
    console.log(`🔧 Reason: ${result.reason}`);
  }
  
  console.log('\n=== Aggressive Input Field Clearing Test Complete ===');
}

// Run the test if this file is executed directly
if (require.main === module) {
  runAggressiveClearingTest().catch(console.error);
}

module.exports = {
  testAggressiveClearing,
  runAggressiveClearingTest
};
