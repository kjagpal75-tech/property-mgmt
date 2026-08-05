/**
 * Pure Redfin Property Management System
 * Uses only Redfin market values - no county assessor
 */

const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import the pure Redfin API
const pureRedfinAPI = require('./api/pure-redfin-api');

// Use the pure Redfin API
app.use('/api', pureRedfinAPI);

// Documentation endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Pure Redfin Property Management System',
    description: 'Uses only Redfin market values - no county assessor data',
    endpoints: {
      'POST /api/property-data': 'Get property data from Redfin only'
    },
    usage: {
      propertyData: {
        method: 'POST',
        body: {
          address: 'string (required)',
          city: 'string (required)', 
          state: 'string (required)',
          zipCode: 'string (optional)'
        },
        response: {
          success: 'boolean',
          address: 'string',
          city: 'string',
          state: 'string',
          zipCode: 'string',
          marketValue: 'number',
          valueRange: {
            low: 'number',
            high: 'number'
          },
          rentPrice: 'number',
          bedrooms: 'number',
          bathrooms: 'number',
          squareFootage: 'number',
          yearBuilt: 'number',
          lotSize: 'number',
          propertyType: 'string',
          status: 'string',
          url: 'string',
          title: 'string',
          lastUpdated: 'string',
          dataSource: 'redfin_only',
          confidence: 'number (0.95)',
          dataQuality: 'real_redfin_data'
        }
      }
    },
    examples: {
      propertyData: {
        curl: 'curl -X POST http://localhost:3000/api/property-data -H "Content-Type: application/json" -d \'{"address":"37391 mission blvd","city":"fremont","state":"ca","zipCode":"94536"}\'',
        javascript: `
fetch('/api/property-data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    address: '37391 mission blvd',
    city: 'fremont', 
    state: 'ca',
    zipCode: '94536'
  })
})
.then(response => response.json())
.then(data => console.log(data));
        `
      }
    },
    testProperties: [
      {
        address: '37391 mission blvd',
        city: 'fremont',
        state: 'ca',
        zipCode: '94536',
        expectedMarketValue: 1415209
      },
      {
        address: '3643 Ruidoso St',
        city: 'reno',
        state: 'nv',
        zipCode: '89512',
        expectedMarketValue: 481619
      },
      {
        address: '12798 Skislope Way',
        city: 'truckee',
        state: 'ca',
        zipCode: '96161',
        expectedMarketValue: 883667
      }
    ]
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Pure Redfin Property Management System running on port ${PORT}`);
  console.log('📋 Available endpoints:');
  console.log('📋 POST /api/property-data - Get property data from Redfin only');
  console.log('📋 GET / - View API documentation');
  console.log('');
  console.log('🎯 Test with: curl -X POST http://localhost:3000/api/property-data -H "Content-Type: application/json" -d \'{"address":"37391 mission blvd","city":"fremont","state":"ca","zipCode":"94536"}\'');
  console.log('');
  console.log('✨ Pure Redfin System - No County Assessor Data!');
});
