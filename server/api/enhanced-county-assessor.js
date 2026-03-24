const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteer.use(StealthPlugin());

/**
 * Enhanced County Assessor API with Redfin integration
 * Integrates real Redfin market values into property management system
 */
router.post('/assessor', async (req, res) => {
  const { address, city, state, zipCode } = req.body;
  
  if (!address || !city || !state) {
    return res.status(400).json({ error: 'Address, city, and state are required' });
  }

  try {
    console.log('Enhanced County Assessor API request:', `${address}, ${city}, ${state} ${zipCode || ''}`);
    
    // Detect county
    const countyMap = {
      'fremont, ca': 'alameda',
      'newark, ca': 'alameda',
      'union city, ca': 'alameda',
      'reno, nv': 'washoe',
      'sparks, nv': 'washoe',
      'truckee, ca': 'nevada',
      'grass valley, ca': 'nevada',
      'seattle, wa': 'king',
      'bellevue, wa': 'king'
    };
    
    const key = `${city.toLowerCase()}, ${state.toLowerCase()}`;
    const county = countyMap[key];
    
    if (!county) {
      return res.status(404).json({ error: 'County not supported' });
    }
    
    console.log('Detected county:', county);
    
    // Get assessment ratio for state
    const assessmentRatios = {
      'ca': 0.80,  // California
      'nv': 0.75,  // Nevada
      'wa': 0.90,  // Washington
      'or': 0.85,  // Oregon
      'tx': 1.00,  // Texas
      'fl': 0.85,  // Florida
      'ny': 0.75,  // New York (average)
      'il': 0.40   // Illinois (average)
    };
    
    const assessmentRatio = assessmentRatios[state.toLowerCase()] || 0.80;
    
    // Try to get real Redfin market value first
    let countyData;
    let redfinData = null;
    
    try {
      console.log('Attempting to get Redfin market value...');
      redfinData = await getRedfinMarketValue(address, city, state, zipCode);
      
      if (redfinData && redfinData.marketValue) {
        console.log('✅ Got Redfin market value:', redfinData.marketValue);
        
        countyData = {
          assessedValue: redfinData.marketValue * assessmentRatio,  // Calculate assessed value from market value
          landValue: redfinData.landValue || redfinData.marketValue * 0.3,  // Estimate land value
          improvementValue: redfinData.improvementValue || redfinData.marketValue * 0.7,  // Estimate improvement value
          assessmentDate: redfinData.assessmentDate || new Date().toISOString(),
          bedrooms: redfinData.bedrooms,
          bathrooms: redfinData.bathrooms,
          squareFootage: redfinData.squareFootage,
          yearBuilt: redfinData.yearBuilt,
          lotSize: redfinData.lotSize,
          propertyType: redfinData.propertyType,
          dataSource: 'redfin_api'
        };
      }
    } catch (error) {
      console.log('Redfin API failed, falling back to county data:', error);
    }
    
    // If Redfin failed, try county assessor
    if (!countyData) {
      try {
        console.log('Falling back to county assessor data...');
        countyData = await getRealCountyData(county, address, city, state, zipCode);
      } catch (error) {
        console.log('County assessor failed, using mock data:', error);
        countyData = await getMockCountyData(county, address, city, state, zipCode);
      }
    }
    
    if (!countyData) {
      return res.status(404).json({ error: 'County data not available' });
    }
    
    // Calculate market value from assessed value
    const marketValue = countyData.assessedValue / assessmentRatio;
    
    // Calculate value range (±10%)
    const valueRange = {
      low: marketValue * 0.90,
      high: marketValue * 1.10
    };
    
    // Format response
    const response = {
      address: `${address}, ${city}, ${state} ${zipCode || ''}`,
      city,
      state,
      zipCode: zipCode || '',
      county: county.charAt(0).toUpperCase() + county.slice(1),
      assessedValue: countyData.assessedValue,
      landValue: countyData.landValue,
      improvementValue: countyData.improvementValue,
      assessmentDate: countyData.assessmentDate,
      assessmentRatio,
      marketValue,
      valueRange,
      propertyDetails: {
        beds: countyData.bedrooms,
        baths: countyData.bathrooms,
        sqft: countyData.squareFootage,
        yearBuilt: countyData.yearBuilt,
        lotSize: countyData.lotSize,
        propertyType: countyData.propertyType
      },
      lastUpdated: new Date().toISOString(),
      dataSource: countyData.dataSource,
      confidence: countyData.dataSource === 'redfin_api' ? 0.95 : 0.75,
      redfinData: redfinData ? {
        marketValue: redfinData.marketValue,
        rentPrice: redfinData.rentPrice,
        status: redfinData.status,
        url: redfinData.url
      } : null
    };
    
    console.log('Enhanced County Assessor response:', response);
    res.json(response);
    
  } catch (error) {
    console.error('Error in Enhanced County Assessor API:', error);
    res.status(500).json({ 
      error: 'Failed to get county assessor data',
      details: error.message 
    });
  }
});

/**
 * Get Redfin market value using direct URL method
 */
async function getRedfinMarketValue(address, city, state, zipCode) {
  let browser;
  let page;
  
  try {
    console.log('🚀 Getting Redfin market value for:', `${address}, ${city}, ${state}`);
    
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
        title: document.title
      };
    });
    
    console.log('✅ Extracted Redfin data:', {
      marketValue: propertyData.marketValue,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      squareFootage: propertyData.squareFootage
    });
    
    await browser.close();
    
    return propertyData;
    
  } catch (error) {
    console.error('Redfin market value extraction error:', error.message);
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

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

/**
 * Get real county data (fallback functions)
 */
async function getRealCountyData(county, address, city, state, zipCode) {
  switch (county) {
    case 'alameda':
      return await getAlamedaCountyReal(address, city, state, zipCode);
    case 'washoe':
      return await getWashoeCountyReal(address, city, state, zipCode);
    case 'nevada':
      return await getNevadaCountyReal(address, city, state, zipCode);
    default:
      return null;
  }
}

/**
 * Get mock county data (fallback)
 */
async function getMockCountyData(county, address, city, state, zipCode) {
  // Use address number to generate consistent mock data
  const addressNumber = parseInt(address.split(' ')[0]) || 1000;
  
  return {
    assessedValue: 500000 + (addressNumber * 1000),  // Base value + address-based variation
    landValue: 150000 + (addressNumber * 500),  // Base land value + address-based variation
    improvementValue: 350000 + (addressNumber * 500),  // Base improvement value + address-based variation
    assessmentDate: new Date().toISOString(),
    bedrooms: 3 + (addressNumber % 4),  // 3-6 bedrooms based on address
    bathrooms: 2 + (addressNumber % 3) * 0.5,  // 2-3.5 bathrooms based on address
    squareFootage: 1200 + (addressNumber * 100),  // Base sqft + address-based variation
    yearBuilt: 1970 + (addressNumber % 30),  // 1970-1999 based on address
    lotSize: 5000 + (addressNumber * 200),  // Base lot size + address-based variation
    propertyType: addressNumber % 3 === 0 ? 'single family' : addressNumber % 3 === 1 ? 'condo' : 'townhouse',
    dataSource: 'mock_fallback'
  };
}

/**
 * Get Alameda County real data (import existing function)
 */
async function getAlamedaCountyReal(address, city, state, zipCode) {
  try {
    console.log('Fetching real Alameda County data...');
    
    // Import and use real parser directly
    const realAlamedaParser = require('./real-alameda-parser');
    return await realAlamedaParser.getAlamedaCountyReal(address, city, state, zipCode);
    
  } catch (error) {
    console.error('Alameda County API error:', error.message);
    throw new Error('Alameda County API unavailable: ' + error.message);
  }
}

module.exports = router;
