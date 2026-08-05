/**
 * Redfin Market Value Integration Test
 * Tests the integration of Redfin market values into property management system
 */

const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import the property integration API
const propertyIntegrationAPI = require('./api/property-integration-api');

// Use the property integration API
app.use('/api', propertyIntegrationAPI);

// Test endpoint
app.get('/test-integration', (req, res) => {
  res.json({
    message: 'Redfin Market Value Integration Test',
    endpoints: {
      'POST /api/property-data': 'Main property data endpoint with Redfin integration',
      'GET /api/test-redfin-integration': 'Test Redfin integration for multiple properties',
      'POST /api/redfin-market-value': 'Direct Redfin market value extraction',
      'POST /api/enhanced-county-assessor': 'Enhanced county assessor with Redfin fallback'
    },
    usage: {
      propertyData: {
        method: 'POST',
        body: {
          address: 'string (required)',
          city: 'string (required)', 
          state: 'string (required)',
          zipCode: 'string (optional)',
          useRedfin: 'boolean (optional, default: true)'
        },
        response: {
          success: 'boolean',
          address: 'string',
          city: 'string',
          state: 'string',
          zipCode: 'string',
          marketValue: 'number',
          rentPrice: 'number',
          bedrooms: 'number',
          bathrooms: 'number',
          squareFootage: 'number',
          yearBuilt: 'number',
          lotSize: 'number',
          propertyType: 'string',
          status: 'string',
          url: 'string',
          confidence: 'number (0-1)',
          dataSource: 'string',
          integration: {
            source: 'string',
            method: 'string',
            timestamp: 'string',
            confidence: 'number'
          }
        }
      },
      testIntegration: {
        method: 'GET',
        response: {
          testType: 'string',
          timestamp: 'string',
          totalProperties: 'number',
          successfulExtractions: 'number',
          failedExtractions: 'number',
          results: 'array',
          summary: {
            averageMarketValue: 'number',
            propertiesExtracted: 'array'
          }
        }
      }
    },
    examples: {
      propertyData: {
        curl: 'curl -X POST http://localhost:3000/api/property-data -H "Content-Type: application/json" -d \'{"address":"37391 mission blvd","city":"fremont","state":"ca","zipCode":"94536","useRedfin":true}\'',
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
    useRedfin: true
  })
})
.then(response => response.json())
.then(data => console.log(data));
        `
      },
      testIntegration: {
        curl: 'curl -X GET http://localhost:3000/api/test-redfin-integration',
        javascript: `
fetch('/api/test-redfin-integration')
.then(response => response.json())
.then(data => console.log(data));
        `
      }
    }
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Redfin Market Value Integration Test Server running on port ${PORT}`);
  console.log('📋 Available endpoints:');
  console.log('📋 POST /api/property-data - Get property data with Redfin integration');
  console.log('📋 GET /api/test-redfin-integration - Test Redfin integration');
  console.log('📋 GET /test-integration - View API documentation');
  console.log('');
  console.log('🎯 Test with: curl -X POST http://localhost:3000/api/property-data -H "Content-Type: application/json" -d \'{"address":"37391 mission blvd","city":"fremont","state":"ca","useRedfin":true}\'');
});
