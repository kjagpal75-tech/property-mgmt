// Add this to your property management frontend to integrate with Redfin market values

import { propertiesApi } from './api/api';
import { Property } from './types/property';

// Hardcoded Redfin URLs for your 3 properties
const PROPERTY_REDFIN_URLS: { [key: string]: { url: string; expectedMarketValue: number } } = {
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
export const getAllPropertiesWithRedfinMarketValues = async (): Promise<Property[]> => {
  try {
    // Get existing properties from property management
    const properties = await propertiesApi.getAll();
    
    // Enhance properties with Redfin URLs and market values
    const propertiesWithRedfin = properties.map(property => {
      const redfinData = PROPERTY_REDFIN_URLS[property.address];
      if (redfinData) {
        return {
          ...property,
          redfinUrl: redfinData.url, // Add the Redfin URL
          redfinMarketValue: redfinData.expectedMarketValue
        };
      }
      return property;
    });
    
    return propertiesWithRedfin;
  } catch (error) {
    console.error('❌ Error getting properties with Redfin URLs:', error);
    return [];
  }
};
