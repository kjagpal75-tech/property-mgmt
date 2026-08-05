/**
 * Pure Redfin Property Management System with Direct URL Support
 * Uses the exact Redfin URLs you provide
 */

const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import the pure Redfin API with direct URL support
const pureRedfinAPI = require('./api/pure-redfin-with-direct-url');

// Use the pure Redfin API
app.use('/api', pureRedfinAPI);

// Documentation endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Pure Redfin Property Management System with Direct URL Support',
    description: 'Uses the exact Redfin URLs you provide - no URL generation',
    endpoints: {
      'POST /api/property-data': 'Get property data using direct Redfin URLs'
    },
    usage: {
      propertyData: {
        method: 'POST',
        body: {
          address: 'string (required)',
          city: 'string (required)', 
          state: 'string (required)',
          zipCode: 'string (optional)',
          redfinURL: 'string (optional) - Use your exact Redfin URL here!'
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
          dataSource: 'redfin_direct_url',
          confidence: 'number (0.95)',
          dataQuality: 'real_redfin_data',
          usedURL: 'string'
        }
      }
    },
    examples: {
      withDirectURL: {
        description: 'Using your exact Redfin URL',
        curl: 'curl -X POST http://localhost:3000/api/property-data -H "Content-Type: application/json" -d \'{"address":"37391 mission blvd","city":"fremont","state":"ca","zipCode":"94536","redfinURL":"https://www.redfin.com/CA/Fremont/37391-Mission-Blvd-94536/home/1211252"}\'',
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
    zipCode: '94536',
    redfinURL: 'https://www.redfin.com/CA/Fremont/37391-Mission-Blvd-94536/home/1211252'
  })
})
.then(response => response.json())
.then(data => console.log(data));
        `
      },
      withoutDirectURL: {
        description: 'Fallback to URL generation',
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
        redfinURL: 'https://www.redfin.com/CA/Fremont/37391-Mission-Blvd-94536/home/1211252',
        expectedMarketValue: 1415209
      },
      {
        address: '3643 Ruidoso St',
        city: 'reno',
        state: 'nv',
        zipCode: '89512',
        redfinURL: 'https://www.redfin.com/NV/Reno/3643-Ruidoso-St-89512/home/170475319',
        expectedMarketValue: 481619
      },
      {
        address: '12798 Skislope Way',
        city: 'truckee',
        state: 'ca',
        zipCode: '96161',
        redfinURL: 'https://www.redfin.com/CA/Truckee/12798-Skislope-Way-96161/home/171002073',
        expectedMarketValue: 883667
      }
    ]
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Pure Redfin Property Management System with Direct URL Support running on port ${PORT}`);
  console.log('📋 Available endpoints:');
  console.log('📋 POST /api/property-data - Get property data using direct Redfin URLs');
  console.log('📋 GET / - View API documentation');
  console.log('');
  console.log('🎯 Test with your exact URLs:');
  console.log('🎯 Fremont: curl -X POST http://localhost:3000/api/property-data -H "Content-Type: application/json" -d \'{"address":"37391 mission blvd","city":"fremont","state":"ca","zipCode":"94536","redfinURL":"https://www.redfin.com/CA/Fremont/37391-Mission-Blvd-94536/home/1211252"}\'');
  console.log('🎯 Reno: curl -X POST http://localhost:3000/api/property-data -H "Content-Type: application/json" -d \'{"address":"3643 Ruidoso St","city":"reno","state":"nv","zipCode":"89512","redfinURL":"https://www.redfin.com/NV/Reno/3643-Ruidoso-St-89512/home/170475319"}\'');
  console.log('🎯 Truckee: curl -X POST http://localhost:3000/api/property-data -H "Content-Type: application/json" -d \'{"address":"12798 Skislope Way","city":"truckee","state":"ca","zipCode":"96161","redfinURL":"https://www.redfin.com/CA/Truckee/12798-Skislope-Way-96161/home/171002073"}\'');
  console.log('');
  console.log('✨ Now using your exact Redfin URLs!');
});
