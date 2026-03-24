const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteer.use(StealthPlugin());

/**
 * Test human-like mouse movements
 */
async function testHumanLikeMouseMovements() {
  let browser;
  let page;
  
  try {
    console.log('🚀 Testing HUMAN-LIKE MOUSE MOVEMENTS...');
    
    browser = await puppeteer.launch({
      headless: false,  // Show browser so you can see mouse movements
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
    
    // Test different mouse movement approaches
    const mouseMovementTests = [
      {
        name: 'Natural Path to Search',
        execute: async () => {
          console.log('🖱️ Test 1: Natural Path to Search');
          
          // Find search input
          const searchInput = await page.waitForSelector('#search-box-input', { timeout: 10000 });
          const inputBounds = await searchInput.boundingBox();
          
          if (inputBounds) {
            // Move mouse to search input like a human would
            console.log('🖱️ Moving mouse to search input...');
            await page.mouse.move(
              inputBounds.x + 50,  // Near left edge
              inputBounds.y + inputBounds.height / 2  // Center vertically
            );
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Click on search input
            await page.mouse.click(
              inputBounds.x + inputBounds.width / 2,
              inputBounds.y + inputBounds.height / 2
            );
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('✅ Clicked on search input');
          }
          
          return { success: true, method: 'Natural Path' };
        }
      },
      {
        name: 'Circular Movement Around Target',
        execute: async () => {
          console.log('🔄 Test 2: Circular Movement Around Target');
          
          // Find search input
          const searchInput = await page.$('#search-box-input');
          const inputBounds = await searchInput.boundingBox();
          
          if (inputBounds) {
            // Move in circles around the search input
            const centerX = inputBounds.x + inputBounds.width / 2;
            const centerY = inputBounds.y + inputBounds.height / 2;
            const radius = 100;
            
            for (let angle = 0; angle < 360; angle += 45) {
              const x = centerX + Math.cos(angle * Math.PI / 180) * radius;
              const y = centerY + Math.sin(angle * Math.PI / 180) * radius;
              
              await page.mouse.move(x, y);
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            console.log('✅ Completed circular movements');
          }
          
          return { success: true, method: 'Circular Movement' };
        }
      },
      {
        name: 'Slight Cursor Tremor',
        execute: async () => {
          console.log('🖐️ Test 3: Slight Cursor Tremor');
          
          // Find search input
          const searchInput = await page.$('#search-box-input');
          const inputBounds = await searchInput.boundingBox();
          
          if (inputBounds) {
            // Move to center and add slight tremor
            const centerX = inputBounds.x + inputBounds.width / 2;
            const centerY = inputBounds.y + inputBounds.height / 2;
            
            for (let i = 0; i < 20; i++) {
              const tremorX = centerX + (Math.random() - 0.5) * 10;
              const tremorY = centerY + (Math.random() - 0.5) * 10;
              
              await page.mouse.move(tremorX, tremorY);
              await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            console.log('✅ Added slight tremor effect');
          }
          
          return { success: true, method: 'Cursor Tremor' };
        }
      },
      {
        name: 'Human-Like Typing with Mouse',
        execute: async () => {
          console.log('⌨️ Test 4: Human-Like Typing with Mouse');
          
          // Find search input
          const searchInput = await page.$('#search-box-input');
          const inputBounds = await searchInput.boundingBox();
          
          if (inputBounds) {
            // Click to focus
            await page.mouse.click(
              inputBounds.x + inputBounds.width / 2,
              inputBounds.y + inputBounds.height / 2
            );
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Type with mouse movements between characters
            const address = '37391 mission blvd, fremont, ca 94536';
            
            for (let i = 0; i < address.length; i++) {
              // Move mouse slightly before each character
              const offsetX = (Math.random() - 0.5) * 20;
              const offsetY = (Math.random() - 0.5) * 10;
              
              await page.mouse.move(
                inputBounds.x + inputBounds.width / 2 + offsetX,
                inputBounds.y + inputBounds.height / 2 + offsetY
              );
              
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // Type character
              await page.keyboard.type(address[i]);
              await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 100));
            }
            
            console.log('✅ Typed with human-like mouse movements');
          }
          
          return { success: true, method: 'Mouse Typing' };
        }
      },
      {
        name: 'Reading Time Before Action',
        execute: async () => {
          console.log('📖 Test 5: Reading Time Before Action');
          
          // Find search input
          const searchInput = await page.$('#search-box-input');
          const inputBounds = await searchInput.boundingBox();
          
          if (inputBounds) {
            // Move to search input and wait a bit (like reading)
            await page.mouse.move(
              inputBounds.x + inputBounds.width / 2,
              inputBounds.y + inputBounds.height / 2
            );
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds "reading"
            
            // Click on search input
            await page.mouse.click(
              inputBounds.x + inputBounds.width / 2,
              inputBounds.y + inputBounds.height / 2
            );
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log('✅ Added reading time before action');
          }
          
          return { success: true, method: 'Reading Time' };
        }
      }
    ];
    
    // Test each mouse movement approach
    for (let i = 0; i < mouseMovementTests.length; i++) {
      const test = mouseMovementTests[i];
      
      console.log(`\n=== Testing ${test.name} ===`);
      
      try {
        const result = await test.execute();
        
        if (result.success) {
          console.log(`✅ ${test.name} SUCCESS!`);
        } else {
          console.log(`❌ ${test.name} FAILED!`);
        }
        
        // Wait before next test
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`❌ Error with ${test.name}:`, error.message);
      }
    }
    
    // Keep browser open for inspection
    console.log('🔄 Keeping browser open for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Human-like mouse movements test error:', error.message);
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
 * Run human-like mouse movements test
 */
async function runHumanLikeMouseMovementsTest() {
  console.log('=== HUMAN-LIKE MOUSE MOVEMENTS TEST ===');
  console.log('🖱️ This will show you natural mouse movements like a real user!');
  
  const result = await testHumanLikeMouseMovements();
  
  if (result.success) {
    console.log('🎉 Human-Like Mouse Movements Test SUCCESS!');
    console.log('✅ You should see natural mouse movements!');
  } else {
    console.log('❌ Human-Like Mouse Movements Test FAILED!');
  }
  
  console.log('\n=== Human-Like Mouse Movements Test Complete ===');
}

// Run the test if this file is executed directly
if (require.main === module) {
  runHumanLikeMouseMovementsTest().catch(console.error);
}

module.exports = {
  testHumanLikeMouseMovements,
  runHumanLikeMouseMovementsTest
};
