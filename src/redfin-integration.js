// Add this to your property management frontend to integrate with Redfin market values

import { propertiesApi } from './api/api';

// Hardcoded Redfin URLs for your 3 properties
const PROPERTY_REDFIN_URLS = {
  '3643 Ruidoso St, Reno NV 89512': {
    url: 'https://www.redfin.com/NV/Reno/3643-Ruidoso-St-89512/home/170475319',
    expectedMarketValue: 481619
  },
  '12798 Skislope Way, Truckee CA 96161': {
    url: 'https://www.redfin.com/CA/Truckee/12798-Skislope-Way-96161/home/171002073',
    expectedMarketValue: 883667
  },
  '37391 Mission Blvd, Fremont CA 94536': {
    url: 'https://www.redfin.com/CA/Fremont/37391-Mission-Blvd-94536/home/1211252',
    expectedMarketValue: 1415209
  }
};

/**
 * Get all properties with Redfin market values using hardcoded URLs
 */
export const getAllPropertiesWithRedfinMarketValues = async () => {
  try {
    console.log('🏠 Getting properties with Redfin market values using hardcoded URLs...');
    
    // Get existing properties from property management
    const properties = await propertiesApi.getAll();
    console.log('✅ Loaded properties from backend:', properties);
    
    // For each property, get Redfin data using hardcoded URL
    const propertiesWithRedfinData = await Promise.all(
      properties.map(async (property) => {
        try {
          console.log('🔍 Processing property:', property.name, 'Address:', property.address);
          
          // Find matching hardcoded URL by flexible address match
          const propertyKey = Object.keys(PROPERTY_REDFIN_URLS).find(key => {
            const normalizedDbAddress = property.address.toLowerCase().replace(/[^a-z0-9\s,]/g, '');
            const normalizedKeyAddress = key.toLowerCase().replace(/[^a-z0-9\s,]/g, '');
            
            console.log('🔍 Comparing addresses:');
            console.log('  DB Address:', normalizedDbAddress);
            console.log('  Key Address:', normalizedKeyAddress);
            
            // Check if key contains db address or db address contains key
            return normalizedDbAddress.includes(normalizedKeyAddress.split(' ')[0]) || 
                   normalizedKeyAddress.includes(normalizedDbAddress.split(' ')[0]);
          });
          
          console.log('🔍 Found propertyKey:', propertyKey);
          
          if (!propertyKey) {
            console.warn(`No hardcoded Redfin URL found for ${property.address}`);
            return {
              ...property,
              redfinMarketValue: null,
              redfinValueRange: null,
              redfinRentPrice: null,
              redfinBedrooms: null,
              redfinBathrooms: null,
              redfinSquareFootage: null,
              redfinYearBuilt: null,
              redfinLotSize: null,
              redfinPropertyType: null,
              redfinStatus: null,
              redfinConfidence: null,
              redfinLastUpdated: null
            };
          }
          
          const redfinConfig = PROPERTY_REDFIN_URLS[propertyKey];
          console.log(`🔍 Using hardcoded Redfin URL for ${property.name}:`, redfinConfig.url);
          
          // Extract property name for API call - use city name from the key
          const propertyName = propertyKey.toLowerCase().includes('fremont') ? 'fremont' :
                            propertyKey.toLowerCase().includes('reno') ? 'reno' :
                            propertyKey.toLowerCase().includes('truckee') ? 'truckee' :
                            propertyKey.toLowerCase().replace(/[^a-z0-9\s,]/g, '').split(',')[0].trim();
          console.log(`🔍 Calling Redfin API with property name:`, propertyName);
          
          // Get Redfin data using hardcoded URL
          const redfinResponse = await fetch('http://localhost:3000/api/property-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              property: propertyName
            })
          });
          
          if (!redfinResponse.ok) {
            console.warn(`Redfin API not available for ${property.name}`);
            return {
              ...property,
              redfinMarketValue: null,
              redfinValueRange: null,
              redfinRentPrice: null,
              redfinBedrooms: null,
              redfinBathrooms: null,
              redfinSquareFootage: null,
              redfinYearBuilt: null,
              redfinLotSize: null,
              redfinPropertyType: null,
              redfinStatus: null,
              redfinConfidence: null,
              redfinLastUpdated: null
            };
          }
          
          const redfinData = await redfinResponse.json();
          console.log(`✅ Redfin data received for ${property.name}:`, redfinData);
          
          if (redfinData.success) {
            console.log(`✅ Found Redfin data for ${property.name}:`, redfinData);
            return {
              ...property,
              redfinMarketValue: redfinData.marketValue || null,
              redfinValueRange: redfinData.valueRange || null,
              redfinRentPrice: redfinData.rentPrice || null,
              redfinBedrooms: redfinData.bedrooms || null,
              redfinBathrooms: redfinData.bathrooms || null,
              redfinSquareFootage: redfinData.squareFootage || null,
              redfinYearBuilt: redfinData.yearBuilt || null,
              redfinLotSize: redfinData.lotSize || null,
              redfinPropertyType: redfinData.propertyType || null,
              redfinStatus: redfinData.status || null,
              redfinConfidence: redfinData.confidence || null,
              redfinLastUpdated: redfinData.lastUpdated || null,
              redfinUrl: redfinConfig.url
            };
          } else {
            console.warn(`❌ No Redfin data found for ${property.name}`);
            return {
              ...property,
              redfinMarketValue: null,
              redfinValueRange: null,
              redfinRentPrice: null,
              redfinBedrooms: null,
              redfinBathrooms: null,
              redfinSquareFootage: null,
              redfinYearBuilt: null,
              redfinLotSize: null,
              redfinPropertyType: null,
              redfinStatus: null,
              redfinConfidence: null,
              redfinLastUpdated: null,
              redfinUrl: redfinConfig.url
            };
          }
          
        } catch (error) {
          console.error(`Error getting Redfin data for ${property.name}:`, error);
          return {
            ...property,
            redfinMarketValue: null,
            redfinValueRange: null,
            redfinRentPrice: null,
            redfinBedrooms: null,
            redfinBathrooms: null,
            redfinSquareFootage: null,
            redfinYearBuilt: null,
            redfinLotSize: null,
            redfinPropertyType: null,
            redfinStatus: null,
            redfinConfidence: null,
            redfinLastUpdated: null
          };
        }
      })
    );
    
    console.log('✅ Final properties with Redfin data:', propertiesWithRedfinData);
    return propertiesWithRedfinData;
    
  } catch (error) {
    console.error('❌ Error getting properties with Redfin market values:', error);
    // Fallback to regular properties if Redfin fails
    try {
      const properties = await propertiesApi.getAll();
      return properties.map(property => ({
        ...property,
        redfinMarketValue: null,
        redfinValueRange: null,
        redfinRentPrice: null,
        redfinBedrooms: null,
        redfinBathrooms: null,
        redfinSquareFootage: null,
        redfinYearBuilt: null,
        redfinLotSize: null,
        redfinPropertyType: null,
        redfinStatus: null,
        redfinConfidence: null,
        redfinLastUpdated: null
      }));
    } catch (fallbackError) {
      console.error('❌ Even fallback failed:', fallbackError);
      return [];
    }
  }
};

// Example usage in your React component:
/*
import { fetchRedfinMarketValue, getAllPropertiesWithRedfinMarketValues } from './redfin-integration';

// In your component:
const [properties, setProperties] = useState([]);

useEffect(() => {
  const loadPropertiesWithRedfinData = async () => {
    const propertiesWithRedfin = await getAllPropertiesWithRedfinMarketValues();
    setProperties(propertiesWithRedfin);
  };
  
  loadPropertiesWithRedfinData();
}, []);

// Fetch market value for a specific property
const handleMarketValueUpdate = async (propertyId, address) => {
  const redfinData = await fetchRedfinMarketValue(address);
  
  if (redfinData.success) {
    await updatePropertyWithMarketValue(propertyId, redfinData);
    // Refresh properties list
    const updatedProperties = await getAllPropertiesWithRedfinMarketValues();
    setProperties(updatedProperties);
  } else {
    console.error('Failed to get market value:', redfinData.error);
  }
};
*/
