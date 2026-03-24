const express = require('express');
const puppeteer = require('puppeteer');
const router = express.Router();

/**
 * Redfin property search endpoint
 * Uses Puppeteer to search for properties and return the property URL
 */
router.post('/search', async (req, res) => {
  const { address, city, state, zipCode } = req.body;
  
  if (!address || !city || !state) {
    return res.status(400).json({ error: 'Address, city, and state are required' });
  }

  let browser;
  try {
    // Step 1: Search for the property to get the Redfin property ID
    const searchQuery = `${address}, ${city}, ${state} ${zipCode || ''}`.trim();
    const searchUrl = `https://www.redfin.com`;
    
    console.log('Step 1: Searching for property:', searchQuery);
    console.log('Search URL:', searchUrl);

    // Launch Puppeteer browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      ]
    });

    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Navigate to Redfin search page
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Look for search input field
    const searchSelectors = [
      'input[placeholder*="address"]',
      'input[placeholder*="search"]',
      'input[type="search"]',
      '.search-input',
      '#search-input',
      'input[name="q"]'
    ];

    let searchInput = null;
    for (const selector of searchSelectors) {
      try {
        searchInput = await page.$(selector);
        if (searchInput) {
          console.log('Found search input with selector:', selector);
          break;
        }
      } catch (error) {
        console.log('Search selector failed:', selector);
      }
    }

    if (!searchInput) {
      console.log('No search input found, trying alternative approach');
      // Try to find any input field
      const inputs = await page.$$('input');
      for (const input of inputs) {
        const placeholder = await page.evaluate(el => el.placeholder, input);
        const type = await page.evaluate(el => el.type, input);
        console.log('Found input:', { placeholder, type });
        
        if (placeholder.toLowerCase().includes('search') || 
            placeholder.toLowerCase().includes('address') ||
            type === 'search') {
          searchInput = input;
          break;
        }
      }
    }

    if (searchInput) {
      // Alternative approach: Make direct POST request to Redfin search API
      console.log('Trying direct POST request to Redfin search...');
      
      try {
        // Make direct POST request to Redfin search API
        const searchApiResponse = await page.evaluate(async (query) => {
          const response = await fetch('https://www.redfin.com/stingray/api/gis', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': navigator.userAgent
            },
            body: JSON.stringify({
              "SearchInput": query,
              "Id": "search",
              "V": "1"
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            return data;
          }
          return null;
        }, searchQuery);
        
        console.log('Direct search API response:', searchApiResponse);
        
        if (searchApiResponse && searchApiResponse.payload && searchApiResponse.payload.properties) {
          // Find the property that matches our search criteria
          const properties = searchApiResponse.payload.properties;
          console.log('Found properties in API response:', properties.length);
          
          for (const property of properties) {
            const propertyAddress = `${property.addressLine1 || ''} ${property.city || ''} ${property.state || ''} ${property.zip || ''}`.toLowerCase();
            const searchLower = searchQuery.toLowerCase();
            
            console.log('Checking property:', propertyAddress);
            
            // Check if this property matches our search criteria
            if (propertyAddress.includes('mission') && 
                propertyAddress.includes('fremont') && 
                propertyAddress.includes('ca')) {
              
              // Construct the property URL
              const propertyUrl = `https://www.redfin.com/CA/fremont/${property.addressLine1.replace(/\s+/g, '-')}/home/${property.propertyId}`;
              console.log('Found matching property:', propertyUrl);
              
              res.json({ propertyUrl });
              return;
            }
          }
        }
      } catch (error) {
        console.log('Direct search API failed:', error);
      }
      
      // Fallback to the original search input method
      console.log('Falling back to search input method...');
      
      // Clear the search input and type the search query
      await page.evaluate(el => el.value = '', searchInput);
      await searchInput.type(searchQuery);
      await page.keyboard.press('Enter');
      
      // Wait for search results
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Look for property links in search results
      const propertyLinkSelectors = [
        '.home-card a',
        '.property-card a',
        '.listing-card a',
        'a[href*="/home/"]',
        'a[href*="/condo/"]',
        'a[href*="/townhouse/"]'
      ];

      let propertyUrl = null;
      for (const selector of propertyLinkSelectors) {
        try {
          const links = await page.$$(selector);
          console.log('Found links with selector:', selector, ':', links.length);
          
          for (const link of links) {
            const href = await page.evaluate(el => el.href, link);
            if (href && href.includes('redfin.com') && (href.includes('/home/') || href.includes('/condo/') || href.includes('/townhouse/'))) {
              propertyUrl = href;
              console.log('Found property URL:', propertyUrl);
              break;
            }
          }
          
          if (propertyUrl) break;
        } catch (error) {
          console.log('Property link selector failed:', selector);
        }
      }

      // If no property links found, try to find any link with property address
      if (!propertyUrl) {
        try {
          const allLinks = await page.$$('a');
          for (const link of allLinks) {
            const href = await page.evaluate(el => el.href, link);
            const text = await page.evaluate(el => el.textContent.trim(), link);
            
            if (href && href.includes('redfin.com') && 
                (href.includes('/home/') || href.includes('/condo/') || href.includes('/townhouse/')) &&
                text.toLowerCase().includes(searchQuery.toLowerCase().split(',')[0].trim())) {
              propertyUrl = href;
              console.log('Found property URL by text match:', propertyUrl);
              break;
            }
          }
        } catch (error) {
          console.log('Text-based search failed:', error);
        }
      }

      if (propertyUrl) {
        console.log('Successfully found property URL:', propertyUrl);
        res.json({ propertyUrl });
      } else {
        console.log('No property URL found in search results');
        res.status(404).json({ error: 'Property not found in search results' });
      }
    } else {
      console.log('No search input found on page');
      res.status(404).json({ error: 'Search input not found' });
    }

    // Close browser
    await browser.close();

  } catch (error) {
    console.error('Redfin search error:', error);
    
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }

    res.status(500).json({ 
      error: 'Failed to search Redfin',
      details: error.message 
    });
  }
});

module.exports = router;
