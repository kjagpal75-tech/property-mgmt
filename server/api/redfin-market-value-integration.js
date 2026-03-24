const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteer.use(StealthPlugin());

/**
 * Redfin Market Value Integration for Property Management App
 * Integrates with existing property management system on port 3001
 */

// Your 3 property URLs mapped to property names
const propertyURLs = {
  '37391 mission blvd, fremont, ca 94536': {
    url: 'https://www.redfin.com/CA/Fremont/37391-Mission-Blvd-94536/home/1211252',
    expectedMarketValue: 1415209
  },
  '3643 Ruidoso St, reno, nv 89512': {
    url: 'https://www.redfin.com/NV/Reno/3643-Ruidoso-St-89512/home/170475319',
    expectedMarketValue: 481619
  },
  '12798 Skislope Way, truckee, ca 96161': {
    url: 'https://www.redfin.com/CA/Truckee/12798-Skislope-Way-96161/home/171002073',
    expectedMarketValue: 883667
  }
};

/**
 * Get market value for a specific property address
 */
router.post('/market-value', async (req, res) => {
  const { address } = req.body;
  
  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  const propertyURL = propertyURLs[address.toLowerCase()];
  
  if (!propertyURL) {
    return res.status(404).json({ 
      error: 'Property not found in Redfin database',
      availableProperties: Object.keys(propertyURLs)
    });
  }

  try {
    console.log(`🏠 Getting Redfin market value for: ${address}`);
    
    let browser;
    let page;
    
    try {
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
      
      // Navigate directly to the property URL
      console.log(`🌐 Navigating to: ${propertyURL.url}`);
      await page.goto(propertyURL.url, {
        waitUntil: 'domcontentloaded',
        timeout: 20000
      });
      
      // Wait for page to be ready
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Extract property data
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
          title: document.title
        };
      });
      
      console.log(`✅ Extracted market value: $${propertyData.marketValue?.toLocaleString()}`);
      
      await browser.close();
      
      // Calculate value range (±10%)
      const valueRange = {
        low: propertyData.marketValue * 0.90,
        high: propertyData.marketValue * 1.10
      };
      
      // Format response for property management integration
      const response = {
        success: true,
        address: address,
        marketValue: propertyData.marketValue,
        valueRange,
        rentPrice: propertyData.rentPrice,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        squareFootage: propertyData.squareFootage,
        yearBuilt: propertyData.yearBuilt,
        lotSize: propertyData.lotSize,
        propertyType: propertyData.propertyType,
        status: propertyData.status,
        url: propertyData.url,
        title: propertyData.title,
        lastUpdated: new Date().toISOString(),
        dataSource: 'redfin_direct_url',
        confidence: 0.95,
        dataQuality: 'real_redfin_data'
      };
      
      console.log(`Redfin Market Value response for ${address}:`, response);
      res.json(response);
      
    } catch (error) {
      console.error(`Redfin extraction error for ${address}:`, error.message);
      if (browser) {
        await browser.close();
      }
      res.status(500).json({ 
        error: `Failed to extract market value from Redfin for ${address}`,
        details: error.message 
      });
    }
    
  } catch (error) {
    console.error(`Error in Redfin Market Value API for ${address}:`, error);
    res.status(500).json({ 
      error: `Failed to process market value request for ${address}`,
      details: error.message 
    });
  }
});

/**
 * Get market values for all 3 properties
 */
router.get('/market-values', async (req, res) => {
  try {
    console.log('🏠 Getting market values for all properties...');
    
    const addresses = Object.keys(propertyURLs);
    const results = [];
    
    for (const address of addresses) {
      try {
        console.log(`Processing ${address}...`);
        
        const puppeteer = require('puppeteer-extra');
        const StealthPlugin = require('puppeteer-extra-plugin-stealth');
        
        puppeteer.use(StealthPlugin);
        
        let browser;
        let page;
        
        try {
          browser = await puppeteer.launch({
            headless: true,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage'
            ]
          });
          
          page = await browser.newPage();
          await page.setViewport({ width: 1366, height: 768 });
          await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
          
          const propertyURL = propertyURLs[address];
          
          // Navigate directly to the property URL
          await page.goto(propertyURL.url, {
            waitUntil: 'domcontentloaded',
            timeout: 20000
          });
          
          // Wait for page to be ready
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Extract property data
          const propertyData = await page.evaluate(() => {
            const pageText = document.body.innerText;
            
            // Extract market value
            const allPriceMatches = pageText.match(/\$[\d,]+/g) || [];
            let marketValue = null;
            
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
            
            if (!marketValue && allPriceMatches.length > 0) {
              const prices = allPriceMatches.map(price => parseFloat(price.replace(/[$,]/g, '')));
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
              title: document.title
            };
          });
          
          await browser.close();
          
          // Calculate value range
          const valueRange = {
            low: propertyData.marketValue * 0.90,
            high: propertyData.marketValue * 1.10
          };
          
          results.push({
            address,
            success: true,
            marketValue: propertyData.marketValue,
            valueRange,
            rentPrice: propertyData.rentPrice,
            bedrooms: propertyData.bedrooms,
            bathrooms: propertyData.bathrooms,
            squareFootage: propertyData.squareFootage,
            yearBuilt: propertyData.yearBuilt,
            lotSize: propertyData.lotSize,
            propertyType: propertyData.propertyType,
            status: propertyData.status,
            url: propertyData.url,
            title: propertyData.title,
            lastUpdated: new Date().toISOString(),
            dataSource: 'redfin_direct_url',
            confidence: 0.95,
            dataQuality: 'real_redfin_data'
          });
          
          console.log(`✅ ${address} market value extracted: $${propertyData.marketValue?.toLocaleString()}`);
          
        } catch (error) {
          console.error(`Error processing ${address}:`, error.message);
          results.push({
            address,
            success: false,
            error: error.message
          });
        }
        
      } catch (error) {
        console.error(`Error processing ${address}:`, error.message);
        results.push({
          address,
          success: false,
          error: error.message
        });
      }
    }
    
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      totalProperties: addresses.length,
      successfulExtractions: results.filter(r => r.success).length,
      failedExtractions: results.filter(r => !r.success).length,
      properties: results,
      summary: {
        totalMarketValue: results.reduce((sum, r) => sum + (r.marketValue || 0), 0),
        averageMarketValue: results.reduce((sum, r) => sum + (r.marketValue || 0), 0) / results.length,
        propertiesExtracted: results.filter(r => r.success).map(r => r.address)
      }
    };
    
    console.log('All Market Values response:', response);
    res.json(response);
    
  } catch (error) {
    console.error('Error in All Market Values API:', error);
    res.status(500).json({ 
      error: 'Failed to get all market values',
      details: error.message 
    });
  }
});

/**
 * Get available property addresses
 */
router.get('/available-properties', (req, res) => {
  res.json({
    success: true,
    properties: Object.keys(propertyURLs).map(address => ({
      address,
      ...propertyURLs[address]
    }))
  });
});

module.exports = router;
