const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteer.use(StealthPlugin);

/**
 * Test different search execution methods
 */
async function testSearchMethods() {
  let browser;
  let page;
  
  try {
    console.log('🚀 Testing different search execution methods...');
    
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
    
    // Find search input
    await page.waitForSelector('#search-box-input', { timeout: 10000 });
    const searchInput = await page.$('#search-box-input');
    
    // Type address
    const address = '37391 mission blvd, fremont, ca 94536';
    await searchInput.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Clear and type address
    await page.keyboard.down('Meta');
    await page.keyboard.press('a');
    await page.keyboard.up('Meta');
    await page.keyboard.press('Backspace');
    
    for (const char of address) {
      await page.keyboard.type(char);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('✅ Address typed:', address);
    
    // Take screenshot before search
    await page.screenshot({ path: 'before-search-methods.png' });
    
    // Test different search methods
    const searchMethods = [
      {
        name: 'Keyboard Enter',
        execute: async () => {
          console.log('🔍 Method 1: Keyboard Enter');
          await page.keyboard.press('Enter');
        }
      },
      {
        name: 'Search Button Click',
        execute: async () => {
          console.log('🔍 Method 2: Search Button Click');
          try {
            await page.click('button[type="submit"]');
          } catch (error) {
            console.log('❌ No submit button found');
            // Try other button selectors
            const buttons = await page.$$('button');
            if (buttons.length > 0) {
              await buttons[0].click();
            }
          }
        }
      },
      {
        name: 'Form Submit',
        execute: async () => {
          console.log('🔍 Method 3: Form Submit');
          await page.evaluate(() => {
            const forms = document.querySelectorAll('form');
            if (forms.length > 0) {
              forms[0].submit();
            } else {
              // Try to find parent form of input
              const input = document.querySelector('#search-box-input');
              if (input && input.form) {
                input.form.submit();
              }
            }
          });
        }
      },
      {
        name: 'Mouse Click on Search Icon',
        execute: async () => {
          console.log('🔍 Method 4: Mouse Click on Search Icon');
          try {
            // Look for search icon or button
            const searchIcon = await page.$('.search-icon, .icon-search, [aria-label*="search"]');
            if (searchIcon) {
              await searchIcon.click();
            } else {
              console.log('❌ No search icon found');
            }
          } catch (error) {
            console.log('❌ Error clicking search icon:', error.message);
          }
        }
      }
    ];
    
    // Test each method (but only one will actually work since we'll be blocked)
    for (let i = 0; i < searchMethods.length; i++) {
      const method = searchMethods[i];
      
      console.log(`\n=== Testing ${method.name} ===`);
      
      // Re-type address for each test
      await searchInput.click();
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await page.keyboard.down('Meta');
      await page.keyboard.press('a');
      await page.keyboard.up('Meta');
      await page.keyboard.press('Backspace');
      
      for (const char of address) {
        await page.keyboard.type(char);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      console.log('✅ Address retyped');
      
      // Execute the search method
      await method.execute();
      
      // Wait for response
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check what happened
      const currentUrl = page.url();
      const pageTitle = await page.title();
      
      console.log(`📍 URL after ${method.name}:`, currentUrl);
      console.log(`📄 Page title:`, pageTitle);
      
      // Take screenshot
      await page.screenshot({ path: `after-${method.name.toLowerCase().replace(/\s+/g, '-')}.png` });
      
      // Check if we got property page or error
      const pageAnalysis = await page.evaluate(() => {
        const bodyText = document.body.innerText.toLowerCase();
        return {
          hasPropertyData: bodyText.includes('bed') && bodyText.includes('bath'),
          hasAddress: bodyText.includes('mission') || bodyText.includes('37391'),
          hasError: bodyText.includes('error') || bodyText.includes('blocked'),
          isHomepage: bodyText.includes('your dream home search')
        };
      });
      
      console.log(`🔍 Analysis for ${method.name}:`, pageAnalysis);
      
      // If we got blocked, don't continue testing
      if (pageAnalysis.hasError || pageAnalysis.isHomepage) {
        console.log(`❌ ${method.name} failed - blocked or still on homepage`);
        break;
      }
      
      // Wait a bit before next test
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Keep browser open for inspection
    console.log('🔄 Keeping browser open for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Search methods test error:', error.message);
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
 * Run the search methods test
 */
async function runSearchMethodsTest() {
  console.log('=== SEARCH EXECUTION METHODS TEST ===');
  
  await testSearchMethods();
  
  console.log('\n=== Search Methods Test Complete ===');
}

// Run the test if this file is executed directly
if (require.main === module) {
  runSearchMethodsTest().catch(console.error);
}

module.exports = {
  testSearchMethods,
  runSearchMethodsTest
};
