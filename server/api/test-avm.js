const express = require('express');
const router = express.Router();

/**
 * Test AVM service endpoint
 */
router.post('/test', async (req, res) => {
  const { address, city, state, zipCode } = req.body;
  
  if (!address || !city || !state) {
    return res.status(400).json({ error: 'Address, city, and state are required' });
  }

  try {
    console.log('Testing AVM service for:', `${address}, ${city}, ${state} ${zipCode || ''}`);
    
    // For now, return a mock response to test the integration
    // We'll implement real API calls later
    
    // Regional averages based on location
    const regionalAverages = {
      'fremont, ca': 1200000,
      'truckee, ca': 856432,
      'reno, nv': 500000,
      'seattle, wa': 850000,
    };
    
    const key = `${city.toLowerCase()}, ${state.toLowerCase()}`;
    const averageValue = regionalAverages[key] || 500000;
    
    const mockAVMData = {
      address: `${address}, ${city}, ${state} ${zipCode || ''}`,
      city,
      state,
      zipCode: zipCode || '',
      estimatedValue: averageValue,
      valueRange: {
        low: averageValue * 0.8,
        high: averageValue * 1.2
      },
      lastUpdated: new Date().toISOString(),
      dataSource: 'regional',
      confidence: 0.75,
      propertyDetails: {
        beds: 3,
        baths: 2,
        sqft: 1500,
        yearBuilt: 1975,
        lotSize: 6000
      }
    };
    
    console.log('AVM test result:', mockAVMData);
    res.json(mockAVMData);
    
  } catch (error) {
    console.error('Error testing AVM service:', error);
    res.status(500).json({ 
      error: 'Failed to test AVM service',
      details: error.message 
    });
  }
});

module.exports = router;
