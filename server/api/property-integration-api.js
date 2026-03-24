const express = require('express');
const router = express.Router();

/**
 * Property Management Integration API
 * Integrates Redfin market values into the existing property management system
 */
router.post('/property-data', async (req, res) => {
  const { address, city, state, zipCode, useRedfin } = req.body;
  
  if (!address || !city || !state) {
    return res.status(400).json({ error: 'Address, city, and state are required' });
  }

  try {
    console.log('Property Data Integration API request:', `${address}, ${city}, ${state} ${zipCode || ''}, useRedfin: ${useRedfin}`);
    
    let propertyData;
    
    if (useRedfin) {
      // Use Redfin market value API
      console.log('🚀 Using Redfin market value API...');
      
      const redfinMarketValueAPI = require('./redfin-market-value-api');
      
      // Simulate API call to Redfin market value endpoint
      const mockReq = {
        body: { address, city, state, zipCode }
      };
      
      const mockRes = {
        json: (data) => data,
        status: (statusCode) => statusCode
      };
      
      // Call the Redfin API
      await redfinMarketValueAPI.post(mockReq, mockRes);
      
      propertyData = mockRes.jsonData;
      
    } else {
      // Use existing county assessor API
      console.log('🔄 Using existing county assessor API...');
      
      const countyAssessorAPI = require('./county-assessor-real');
      
      // Simulate API call to county assessor endpoint
      const mockReq = {
        body: { address, city, state, zipCode }
      };
      
      const mockRes = {
        json: (data) => data,
        status: (statusCode) => statusCode
      };
      
      // Call the county assessor API
      await countyAssessorAPI.post(mockReq, mockRes);
      
      propertyData = mockRes.jsonData;
    }
    
    // Add integration metadata
    const enhancedResponse = {
      ...propertyData,
      integration: {
        source: useRedfin ? 'redfin_api' : 'county_assessor',
        method: useRedfin ? 'direct_redfin_extraction' : 'county_assessor_fallback',
        timestamp: new Date().toISOString(),
        confidence: propertyData.confidence || 0.75,
        processingTime: Date.now()
      },
      success: true
    };
    
    console.log('Property Data Integration response:', enhancedResponse);
    res.json(enhancedResponse);
    
  } catch (error) {
    console.error('Error in Property Data Integration API:', error);
    res.status(500).json({ 
      error: 'Failed to get property data',
      details: error.message 
    });
  }
});

/**
 * Test endpoint for Redfin integration
 */
router.get('/test-redfin-integration', async (req, res) => {
  try {
    console.log('🧪 Testing Redfin integration...');
    
    const testProperties = [
      {
        address: '37391 mission blvd',
        city: 'fremont',
        state: 'ca',
        zipCode: '94536'
      },
      {
        address: '3643 Ruidoso St',
        city: 'reno',
        state: 'nv',
        zipCode: '89512'
      },
      {
        address: '12798 Skislope Way',
        city: 'truckee',
        state: 'ca',
        zipCode: '96161'
      }
    ];
    
    const results = [];
    
    for (const property of testProperties) {
      console.log(`🏠 Testing Redfin integration for: ${property.address}, ${property.city}, ${property.state}`);
      
      try {
        const redfinMarketValueAPI = require('./redfin-market-value-api');
        
        const mockReq = {
          body: property
        };
        
        const mockRes = {
          json: (data) => Data,
          status: (statusCode) => statusCode
        };
        
        await redfinMarketValueAPI.post(mockReq, mockRes);
        const result = mockRes.jsonData;
        
        results.push({
          ...property,
          redfinIntegration: {
            success: result.success,
            marketValue: result.marketValue,
            rentPrice: result.rentPrice,
            bedrooms: result.bedrooms,
            bathrooms: result.bathrooms,
            squareFootage: result.squareFootage,
            yearBuilt: result.yearBuilt,
            propertyType: result.propertyType,
            status: result.status,
            url: result.url,
            confidence: result.confidence
          }
        });
        
      } catch (error) {
        console.error(`Error testing ${property.address}:`, error.message);
        results.push({
          ...property,
          redfinIntegration: {
            success: false,
            error: error.message
          }
        });
      }
    }
    
    const testResponse = {
      testType: 'redfin_integration',
      timestamp: new Date().toISOString(),
      totalProperties: testProperties.length,
      successfulExtractions: results.filter(r => r.redfinIntegration.success).length,
      failedExtractions: results.filter(r => !r.redfinIntegration.success).length,
      results,
      summary: {
        averageMarketValue: results.reduce((sum, r) => sum + (r.redfinIntegration.marketValue || 0), 0) / results.length,
        propertiesExtracted: results.filter(r => r.redfinIntegration.success).map(r => r.address)
      }
    };
    
    console.log('Redfin Integration Test response:', testResponse);
    res.json(testResponse);
    
  } catch (error) {
    console.error('Error in Redfin Integration Test:', error);
    res.status(500).json({ 
      error: 'Failed to test Redfin integration',
      details: error.message 
    });
  }
});

module.exports = router;
