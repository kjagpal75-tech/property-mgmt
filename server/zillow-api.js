const axios = require('axios');

/**
 * Zillow API integration for property market values
 * Uses official Zillow GetDeepSearchResults API
 */

async function getZillowMarketValue(address, city, state, zipCode) {
  console.log(`Getting Zillow market value for: ${address}`);
  
  try {
    // Zillow GetDeepSearchResults API
    const searchUrl = 'https://www.zillow.com/search/GetDeepSearchResults.htm';
    
    const response = await axios.get(searchUrl, {
      params: {
        address: address,
        citystatezip: `${city}, ${state} ${zipCode}`,
        rentzestimate: true
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 15000
    });
    
    if (response.data && response.data.response && response.data.response.properties && response.data.response.properties.length > 0) {
      const property = response.data.response.properties[0];
      console.log('Zillow data received:', property);
      
      return {
        marketValue: property.zestimate ? parseFloat(property.zestimate) : 0,
        rentZestimate: property.rentZestimate ? parseFloat(property.rentZestimate) : 0,
        dataSource: 'zillow_api',
        confidence: 0.89,
        propertyUrl: property.hdpUrl || property.links?.homedetails,
        propertyId: property.zpid,
        address: property.address || address,
        city: property.city || city,
        state: property.state || state,
        zipCode: property.zipcode || zipCode,
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        squareFootage: property.livingArea || 0,
        yearBuilt: property.yearBuilt || 0,
        lotSize: property.lotSizeSqFt || 0,
        propertyType: property.useCode || 'Single Family Residential',
        lastUpdated: property.timeUpdated || new Date().toISOString(),
        taxAssessment: property.taxAssessment || 0,
        description: property.description || ''
      };
    } else {
      throw new Error('No property data found in Zillow response');
    }
    
  } catch (error) {
    console.error('Zillow API error:', error.message);
    throw new Error(`Zillow API failed: ${error.message}`);
  }
}

/**
 * Test function to try Zillow API for all properties
 */
async function testZillowAPI() {
  const properties = [
    '37391 mission blvd fremont ca',
    '3643 ruidoso st reno nv', 
    '12798 skislope way truckee ca'
  ];
  
  console.log('=== Testing Zillow API for All Properties ===');
  
  for (const address of properties) {
    try {
      console.log(`\n--- Testing: ${address} ---`);
      const result = await getZillowMarketValue(address);
      console.log(`✅ Success: ${address} -> $${result.marketValue.toLocaleString()} (${result.dataSource})`);
      console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`   Property ID: ${result.propertyId}`);
      console.log(`   Bedrooms: ${result.bedrooms}, Bathrooms: ${result.bathrooms}`);
      console.log(`   Square Feet: ${result.squareFootage}`);
      console.log(`   Year Built: ${result.yearBuilt}`);
      console.log(`   Property URL: ${result.propertyUrl}`);
      console.log(`   Last Updated: ${result.lastUpdated}`);
    } catch (error) {
      console.log(`❌ Failed: ${address} -> ${error.message}`);
    }
    
    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n=== Zillow API Test Complete ===');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testZillowAPI().catch(console.error);
}

module.exports = {
  getZillowMarketValue,
  testZillowAPI
};
