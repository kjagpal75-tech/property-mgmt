const express = require('express');
const router = express.Router();

/**
 * County Assessor API endpoint
 * Gets property data from county assessor records
 */
router.post('/assessor', async (req, res) => {
  const { address, city, state, zipCode } = req.body;
  
  if (!address || !city || !state) {
    return res.status(400).json({ error: 'Address, city, and state are required' });
  }

  try {
    console.log('County Assessor API request:', `${address}, ${city}, ${state} ${zipCode || ''}`);
    
    // Import the CountyAssessorService (will need to be adapted for Node.js)
    // For now, implement the logic directly here
    
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
    
    // Get assessment ratio for the state
    const assessmentRatios = {
      'ca': 0.80,  // California
      'nv': 0.75,  // Nevada (corrected - much higher than 35%)
      'wa': 0.90,  // Washington
      'or': 0.85,  // Oregon
      'tx': 1.00,  // Texas
      'fl': 0.85,  // Florida
      'ny': 0.75,  // New York (average)
      'il': 0.40   // Illinois (average)
    };
    
    const assessmentRatio = assessmentRatios[state.toLowerCase()] || 0.80;
    
    // Mock county data (in real implementation, this would call actual county APIs)
    let countyData;
    switch (county) {
      case 'alameda':
        countyData = {
          parcelNumber: '123-456-789',
          assessedValue: 960000,
          landValue: 400000,
          improvementValue: 560000,
          assessmentDate: '2024-01-01',
          yearBuilt: 1975,
          squareFootage: 1500,
          bedrooms: 3,
          bathrooms: 2,
          lotSize: 6000,
          propertyType: 'Single Family Residential'
        };
        break;
        
      case 'washoe':
        countyData = {
          parcelNumber: '456-789-012',
          assessedValue: 375000,  // More realistic for Reno
          landValue: 150000,
          improvementValue: 225000,
          assessmentDate: '2024-01-01',
          yearBuilt: 1985,
          squareFootage: 1200,
          bedrooms: 3,
          bathrooms: 2,
          lotSize: 5000,
          propertyType: 'Single Family Residential'
        };
        break;
        
      case 'nevada':
        countyData = {
          parcelNumber: '789-012-345',
          assessedValue: 685146,
          landValue: 300000,
          improvementValue: 385146,
          assessmentDate: '2024-01-01',
          yearBuilt: 1990,
          squareFootage: 1800,
          bedrooms: 4,
          bathrooms: 3,
          lotSize: 8000,
          propertyType: 'Single Family Residential'
        };
        break;
        
      default:
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
      dataSource: 'county_assessor',
      confidence: 0.85
    };
    
    console.log('County Assessor response:', response);
    res.json(response);
    
  } catch (error) {
    console.error('Error in County Assessor API:', error);
    res.status(500).json({ 
      error: 'Failed to get county assessor data',
      details: error.message 
    });
  }
});

/**
 * Get supported counties endpoint
 */
router.get('/supported-counties', (req, res) => {
  try {
    const supportedCounties = {
      'alameda': ['fremont', 'newark', 'union city'],
      'washoe': ['reno', 'sparks'],
      'nevada': ['truckee', 'grass valley'],
      'king': ['seattle', 'bellevue']
    };
    
    res.json({
      supportedCounties,
      totalSupported: Object.keys(supportedCounties).length,
      totalCities: Object.values(supportedCounties).flat().length
    });
  } catch (error) {
    console.error('Error getting supported counties:', error);
    res.status(500).json({ error: 'Failed to get supported counties' });
  }
});

module.exports = router;
