const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteer.use(StealthPlugin());

/**
 * Test with proper input field clearing
 */
async function testProperClearing() {
  let browser;
  let page;
  
  try {
    console.log('🚀 Testing PROPER input field clearing...');
    
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
    const searchInput = await page.$('#search-box-input');
    
    console.log('✅ Found search input');
    await searchInput.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test different clearing methods
    const clearingMethods = [
      {
        name: 'JavaScript Clear + Focus',
        execute: async () => {
          console.log('🧹 Method 1: JavaScript Clear + Focus');
          
          // Clear with JavaScript
          await page.evaluate(() => {
            const input = document.querySelector('#search-box-input');
            if (input) {
              input.value = '';
              input.focus();
            }
          });
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Type address
          const address = '37391 mission blvd, fremont, ca 94536';
          for (const char of address) {
            await page.keyboard.type(char);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          // Verify input value
          const inputValue = await page.evaluate(() => {
            const input = document.querySelector('#search-box-input');
            return input ? input.value : '';
          });
          
          console.log(`📝 Input value: "${inputValue}"`);
          return inputValue;
        }
      },
      {
        name: 'Triple Clear + Type',
        execute: async () => {
          console.log('🧹 Method 2: Triple Clear + Type');
          
          // Click, clear with Meta+A, backspace, then clear again
          await searchInput.click();
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Clear with Meta+A
          await page.keyboard.down('Meta');
          await page.keyboard.press('a');
          await page.keyboard.up('Meta');
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Clear with backspace
          await page.keyboard.press('Backspace');
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Clear with JavaScript
          await page.evaluate(() => {
            const input = document.querySelector('#search-box-input');
            if (input) {
              input.value = '';
            }
          });
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Type address
          const address = '37391 mission blvd, fremont, ca 94536';
          for (const char of address) {
            await page.keyboard.type(char);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          // Verify input value
          const inputValue = await page.evaluate(() => {
            const input = document.querySelector('#search-box-input');
            return input ? input.value : '';
          });
          
          console.log(`📝 Input value: "${inputValue}"`);
          return inputValue;
        }
      },
      {
        name: 'Reload Page + Type',
        execute: async () => {
          console.log('🔄 Method 3: Reload Page + Type');
          
          // Reload the page to get fresh input
          await page.reload();
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Wait for search input again
          await page.waitForSelector('#search-box-input', { timeout: 10000 });
          await page.click('#search-box-input');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Type address
          const address = '37391 mission blvd, fremont, ca 94536';
          for (const char of address) {
            await page.keyboard.type(char);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          // Verify input value
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
        
        if (result.includes('37391 mission blvd, fremont, ca 94536')) {
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
            
            // Keep browser open
            console.log('🔄 Keeping browser open for 10 seconds...');
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            return { success: true, method: method.name, propertyData };
          } else {
            console.log('❌ Search failed');
          }
          
          break; // Success, don't try more methods
          
        } else {
          console.log('❌ Address corrupted:', result);
        }
        
      } catch (error) {
        console.log(`❌ Error with ${method.name}:`, error.message);
      }
      
      // Wait before next method
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return { success: false, reason: 'All clearing methods failed' };
    
  } catch (error) {
    console.error('❌ Proper clearing test error:', error.message);
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
 * Run the proper clearing test
 */
async function runProperClearingTest() {
  console.log('=== PROPER INPUT FIELD CLEARING TEST ===');
  
  const result = await testProperClearing();
  
  if (result.success) {
    console.log('🎉 Proper Clearing Test SUCCESS!');
    console.log(`✅ Method that worked: ${result.method}`);
    console.log('✅ Property data extracted successfully');
  } else {
    console.log('❌ Proper Clearing Test FAILED!');
    console.log(`🔧 Reason: ${result.reason}`);
  }
  
  console.log('\n=== Proper Input Field Clearing Test Complete ===');
}

// Run the test if this file is executed directly
if (require.main === module) {
  runProperClearingTest().catch(console.error);
}

module.exports = {
  testProperClearing,
  runProperClearingTest
};
