const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteer.use(StealthPlugin);

/**
 * Fix the search input typing issue
 */
async function testFixedTyping() {
  let browser;
  let page;
  
  try {
    console.log('🚀 Testing FIXED search input typing...');
    
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
    
    // Wait for page to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Find search input
    await page.waitForSelector('#search-box-input', { timeout: 10000 });
    const searchInput = await page.$('#search-box-input');
    
    console.log('✅ Found search input');
    
    // Try different typing approaches
    const typingMethods = [
      {
        name: 'Direct Value Setting',
        execute: async () => {
          console.log('🔤 Method 1: Direct Value Setting');
          await page.evaluate(() => {
            const input = document.querySelector('#search-box-input');
            if (input) {
              input.value = '37391 mission blvd, fremont, ca 94536';
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });
        }
      },
      {
        name: 'Click and Type Slowly',
        execute: async () => {
          console.log('🔤 Method 2: Click and Type Slowly');
          await searchInput.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Clear the input properly
          console.log('🧹 Clearing input field properly...');
        
          // Method 1: Try to clear with multiple backspaces
          await page.keyboard.down('Meta');
          await page.keyboard.press('a');
          await page.keyboard.up('Meta');
        
          // Press backspace multiple times to ensure clearing
          for (let i = 0; i < 20; i++) {
            await page.keyboard.press('Backspace');
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        
          // Method 2: Try Ctrl+A + Delete
          await new Promise(resolve => setTimeout(resolve, 200));
          await page.keyboard.down('Control');
          await page.keyboard.press('a');
          await page.keyboard.up('Control');
          await page.keyboard.press('Delete');
        
          // Method 3: Try to set empty value directly
          await new Promise(resolve => setTimeout(resolve, 200));
          await page.evaluate(() => {
            const input = document.querySelector('#search-box-input');
            if (input) {
              input.value = '';
              input.focus();
              // Trigger change event
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });
        
          // Wait a moment for clearing to take effect
          await new Promise(resolve => setTimeout(resolve, 1000));
        
          // Verify the input is actually empty
          const currentValue = await page.evaluate(() => {
            const input = document.querySelector('#search-box-input');
            return input ? input.value : '';
          });
        
          console.log(`📝 Input value after clearing: "${currentValue}"`);
        
          if (currentValue === '') {
            console.log('✅ Input successfully cleared');
          } else {
            console.log('⚠️  Input not fully cleared, but proceeding anyway');
          }
          
          // Type character by character with longer delays
          const address = '37391 mission blvd, fremont, ca 94536';
          for (let i = 0; i < address.length; i++) {
            await page.keyboard.type(address[i]);
            await new Promise(resolve => setTimeout(resolve, 200)); // Longer delay
          }
        }
      },
      {
        name: 'Focus Then Type',
        execute: async () => {
          console.log('🔤 Method 3: Focus Then Type');
          await page.evaluate(() => {
            const input = document.querySelector('#search-box-input');
            if (input) {
              input.focus();
            }
          });
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Type using page.type instead of keyboard
          await page.type('#search-box-input', '37391 mission blvd, fremont, ca 94536', {
            delay: 150
          });
        }
      },
      {
        name: 'Mouse Click Position',
        execute: async () => {
          console.log('🔤 Method 4: Mouse Click Position');
          
          // Get input position and click in the middle
          const bounds = await searchInput.boundingBox();
          if (bounds) {
            await page.mouse.click(
              bounds.x + bounds.width / 2,
              bounds.y + bounds.height / 2
            );
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Clear and type
          await page.keyboard.down('Meta');
          await page.keyboard.press('a');
          await page.keyboard.up('Meta');
          await page.keyboard.press('Backspace');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          await page.keyboard.type('37391 mission blvd, fremont, ca 94536');
        }
      }
    ];
    
    // Test each typing method
    for (let i = 0; i < typingMethods.length; i++) {
      const method = typingMethods[i];
      
      console.log(`\n=== Testing ${method.name} ===`);
      
      try {
        await method.execute();
        
        // Check if typing worked
        const inputValue = await page.evaluate(() => {
          const input = document.querySelector('#search-box-input');
          return input ? input.value : '';
        });
        
        console.log(`📝 Input value after ${method.name}: "${inputValue}"`);
        
        if (inputValue.includes('37391')) {
          console.log('✅ Typing successful!');
          
          // Try search
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
          
          console.log(`🔍 Search result for ${method.name}:`, searchResult);
          
          if (searchResult.hasPropertyData && searchResult.hasAddress) {
            console.log('🎉 SUCCESS! Got property page with correct address!');
            
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
          }
        } else {
          console.log('❌ Typing failed');
        }
        
      } catch (error) {
        console.log(`❌ Error with ${method.name}:`, error.message);
      }
      
      // Wait before next method
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return { success: false, reason: 'No typing method worked' };
    
  } catch (error) {
    console.error('❌ Fixed typing test error:', error.message);
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
 * Run the fixed typing test
 */
async function runFixedTypingTest() {
  console.log('=== FIXED SEARCH INPUT TYPING TEST ===');
  
  const result = await testFixedTyping();
  
  if (result.success) {
    console.log('🎉 Fixed Typing Test SUCCESS!');
    console.log(`✅ Method that worked: ${result.method}`);
    console.log('✅ Property data extracted successfully');
  } else {
    console.log('❌ Fixed Typing Test FAILED!');
    console.log(`🔧 Reason: ${result.reason}`);
  }
  
  console.log('\n=== Fixed Search Input Typing Test Complete ===');
}

// Run the test if this file is executed directly
if (require.main === module) {
  runFixedTypingTest().catch(console.error);
}

module.exports = {
  testFixedTyping,
  runFixedTypingTest
};
