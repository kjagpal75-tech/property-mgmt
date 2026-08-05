const express = require('express');
const router = express.Router();

/**
 * Redfin Market Value API endpoint
 * Direct integration for getting market values from Redfin
 */
router.post('/redfin-market-value', async (req, res) => {
  const { address, city, state, zipCode } = req.body;
  
  if (!address || !city || !state) {
    return res.status(400).json({ error: 'Address, city, and state are required' });
  }

  try {
    console.log('Redfin Market Value API request:', `${address}, ${city}, ${state} ${zipCode || ''}`);
    
    const puppeteer = require('puppeteer-extra');
    const StealthPlugin = require('puppeteer-extra-plugin-stealth');
    
    // Add stealth plugin
    puppeteer.use(StealthPlugin());
    
    let browser;
    let page;
    
    try {
      console.log('🚀 Getting Redfin market value...');
      
      browser = await puppeteer.launch({
        headless: true,  // Run in background for API
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      });
      
      page = await browser.newPage();
      await page.setViewport({ width: 1366, height: 768 });
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Generate Redfin URL from address
      const redfinURL = generateRedfinURL(address, city, state);
      console.log('🌐 Generated Redfin URL:', redfinURL);
      
      // Navigate to property page
      await page.goto(redfinURL, {
        waitUntil: 'domcontentloaded',
        timeout: 20000
      });
      
      // Wait for page to be ready
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Extract property data with corrected logic
      const propertyData = await page.evaluate(() => {
        const pageText = document.body.innerText;
        
        // Save all price matches
        const allPriceMatches = pageText.match(/\$[\d,]+/g) || [];
        
        // Extract market value with corrected logic
        let marketValue = null;
        
        // Method 1: Look for specific market value indicators
        const marketValuePatterns = [
          /Redfin\s*Estimate[:\s]*\$([\d,]+)/i,
          /Estimate[:\s]*\$([\d,]+)/i,
          /Market\s*Value[:\s]*\$([\d,]+)/i,
          /Value[:\s]*\$([\d,]+)/i,
          /Worth[:\s]*\$([\d,]+)/i
        ];
        
        for (const pattern of marketValuePatterns) {
          const match = pageText.match(pattern);
          if (match && match[1]) {
            marketValue = parseFloat(match[1].replace(/,/g, ''));
            break;
          }
        }
        
        // Method 2: If no specific pattern found, use the highest reasonable price
        if (!marketValue && allPriceMatches.length > 0) {
          const prices = allPriceMatches.map(price => parseFloat(price.replace(/[$,]/g, '')));
          
          // Filter out very small prices (likely rent) and very large ones
          const reasonablePrices = prices.filter(price => price > 100000 && price < 10000000);
          
          if (reasonablePrices.length > 0) {
            marketValue = Math.max(...reasonablePrices);
          }
        }
        
        // Extract rent price
        let rentPrice = null;
        const rentPatterns = [
          /Rent[:\s]*\$([\d,]+)/i,
          /Monthly\s*Rent[:\s]*\$([\d,]+)/i,
          /For\s*Rent[:\s]*\$([\d,]+)/i,
          /Lease[:\s]*\$([\d,]+)/i
        ];
        
        for (const pattern of rentPatterns) {
          const match = pageText.match(pattern);
          if (match && match[1]) {
            rentPrice = parseFloat(match[1].replace(/,/g, ''));
            break;
          }
        }
        
        // Extract other property details
        const bedMatch = pageText.match(/(\d+)\s*beds?/i);
        const bedrooms = bedMatch ? parseInt(bedMatch[1]) : null;
        
        const bathMatch = pageText.match(/(\d+(?:\.\d+)?)\s*baths?/i);
        const bathrooms = bathMatch ? parseFloat(bathMatch[1]) : null;
        
        const sqftMatch = pageText.match(/(\d+(?:,\d+)*)\s*sq\s*ft/i);
        const squareFootage = sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, '')) : null;
        
        const yearMatch = pageText.match(/\b(19|20)\d{2}\b/g);
        const yearBuilt = yearMatch ? parseInt(yearMatch[yearMatch.length - 1]) : null;
        
        const lotMatch = pageText.match(/(\d+(?:,\d+)*)\s*sq\s*ft\s*lot/i);
        const lotSize = lotMatch ? parseInt(lotMatch[1].replace(/,/g, '')) : null;
        
        const typeMatch = pageText.match(/(single\s*family|condo|townhouse|multi\s*family|apartment)/i);
        const propertyType = typeMatch ? typeMatch[1] : null;
        
        const statusMatch = pageText.match(/(for\s*rent|for\s*sale|off\s*market|sold|rented)/i);
        const status = statusMatch ? statusMatch[1] : null;
        
        return {
          marketValue,
          rentPrice,
          bedrooms,
          bathrooms,
          squareFootage,
          yearBuilt,
          lotSize,
          propertyType,
          status,
          url: window.location.href,
          title: document.title,
          allPriceMatches: allPriceMatches.slice(0, 20) // Show first 20 for debugging
        };
      });
      
      console.log('✅ Extracted Redfin market value:', propertyData.marketValue);
      
      await browser.close();
      
      const response = {
        success: true,
        address: `${address}, ${city}, ${state} ${zipCode || ''}`,
        city,
        state,
        zipCode: zipCode || '',
        url: propertyData.url,
        title: propertyData.title,
        marketValue: propertyData.marketValue,
        rentPrice: propertyData.rentPrice,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        squareFootage: propertyData.squareFootage,
        yearBuilt: propertyData.yearBuilt,
        lotSize: propertyData.lotSize,
        propertyType: propertyData.propertyType,
        status: propertyData.status,
        lastUpdated: new Date().toISOString(),
        dataSource: 'redfin_direct',
        confidence: 0.95,
        allPriceMatches: propertyData.allPriceMatches
      };
      
      console.log('Redfin Market Value API response:', response);
      res.json(response);
      
    } catch (error) {
      console.error('Redfin Market Value API error:', error.message);
      if (browser) {
        await browser.close();
      }
      res.status(500).json({ 
        error: 'Failed to get Redfin market value',
        details: error.message 
      });
    }
    
  } catch (error) {
    console.error('Error in Redfin Market Value API:', error);
    res.status(500).json({ 
      error: 'Failed to process Redfin market value request',
      details: error.message 
    });
  }
});

/**
 * Generate Redfin URL from address
 */
function generateRedfinURL(address, city, state) {
  // This is a simplified URL generator - in production, you'd want to search for the exact property
  // For now, return a generic URL format
  const addressParts = address.split(' ');
  const streetNumber = addressParts[0];
  const streetName = addressParts.slice(1).join(' ').replace(/,/g, '').trim();
  
  // Format street name for URL
  const formattedStreetName = streetName.replace(/\s+/g, '-');
  
  return `https://www.redfin.com/${state.toUpperCase()}/${city}/${streetNumber}-${formattedStreetName}/${state.toLowerCase() === 'ca' ? '94536' : 'zipCode'}/home`;
}

module.exports = router;
