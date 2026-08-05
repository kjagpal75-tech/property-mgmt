export interface AVMData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  estimatedValue: number;
  valueRange: {
    low: number;
    high: number;
  };
  lastUpdated: string;
  dataSource: 'zillow' | 'estated' | 'census' | 'county' | 'fallback';
  confidence: number;
  propertyDetails?: {
    beds?: number;
    baths?: number;
    sqft?: number;
    yearBuilt?: number;
    lotSize?: number;
  };
}

export class AVMApiService {
  private static readonly ZILLOW_API_URL = 'https://zillow-com1.p.rapidapi.com/property';
  private static readonly ESTATED_API_URL = 'https://api.estated.com/v4/property';
  private static readonly CENSUS_API_URL = 'https://api.census.gov/data/2021/acs/acs1';

  /**
   * Get AVM value from multiple free APIs
   */
  static async getAVMValue(address: string, city: string, state: string, zipCode?: string): Promise<AVMData | null> {
    try {
      console.log('Getting AVM value from free APIs for:', `${address}, ${city}, ${state}, ${zipCode || ''}`);
      
      // Try Zillow API first (most accurate)
      let avmData = await this.getZillowValue(address, city, state, zipCode);
      
      // Try Estated API if Zillow fails
      if (!avmData) {
        console.log('Zillow failed, trying Estated...');
        avmData = await this.getEstatedValue(address, city, state, zipCode);
      }
      
      // Try Census API if Estated fails
      if (!avmData) {
        console.log('Estated failed, trying Census...');
        avmData = await this.getCensusValue(address, city, state, zipCode);
      }
      
      // Try County Assessor if Census fails
      if (!avmData) {
        console.log('Census failed, trying County Assessor...');
        avmData = await this.getCountyValue(address, city, state, zipCode);
      }
      
      // Fallback to regional average if all APIs fail
      if (!avmData) {
        console.log('All APIs failed, using regional average...');
        avmData = await this.getRegionalAverage(city, state);
      }
      
      return avmData;
    } catch (error) {
      console.error('Error getting AVM value:', error);
      return null;
    }
  }

  /**
   * Get value from Zillow API
   */
  private static async getZillowValue(address: string, city: string, state: string, zipCode?: string): Promise<AVMData | null> {
    try {
      console.log('Getting value from Zillow API...');
      
      const response = await fetch('/api/zillow/avm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: `${address}, ${city}, ${state} ${zipCode || ''}`.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Zillow AVM data:', data);
        
        if (data.price) {
          return {
            address: data.address || address,
            city: data.city || city,
            state: data.state || state,
            zipCode: data.zipcode || zipCode || '',
            estimatedValue: data.price,
            valueRange: {
              low: data.priceLow || data.price * 0.95,
              high: data.priceHigh || data.price * 1.05,
            },
            lastUpdated: new Date().toISOString(),
            dataSource: 'zillow',
            confidence: 0.85,
            propertyDetails: {
              beds: data.bedrooms,
              baths: data.bathrooms,
              sqft: data.livingArea,
              yearBuilt: data.yearBuilt,
              lotSize: data.lotSize
            }
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting Zillow value:', error);
      return null;
    }
  }

  /**
   * Get value from Estated API
   */
  private static async getEstatedValue(address: string, city: string, state: string, zipCode?: string): Promise<AVMData | null> {
    try {
      console.log('Getting value from Estated API...');
      
      const response = await fetch('/api/estated/avm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: `${address}, ${city}, ${state} ${zipCode || ''}`.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Estated AVM data:', data);
        
        if (data.assessment && data.assessment.assessedValue) {
          const assessedValue = data.assessment.assessedValue;
          // Typically assessed value is 80-90% of market value
          const marketValue = assessedValue * 1.15;
          
          return {
            address: data.address || address,
            city: data.city || city,
            state: data.state || state,
            zipCode: data.zipcode || zipCode || '',
            estimatedValue: marketValue,
            valueRange: {
              low: marketValue * 0.9,
              high: marketValue * 1.1,
            },
            lastUpdated: new Date().toISOString(),
            dataSource: 'estated',
            confidence: 0.75,
            propertyDetails: {
              beds: data.building?.bedrooms,
              baths: data.building?.bathrooms,
              sqft: data.building?.area,
              yearBuilt: data.building?.yearBuilt,
              lotSize: data.lot?.area
            }
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting Estated value:', error);
      return null;
    }
  }

  /**
   * Get value from Census API (regional averages)
   */
  private static async getCensusValue(address: string, city: string, state: string, zipCode?: string): Promise<AVMData | null> {
    try {
      console.log('Getting value from Census API...');
      
      // Get county FIPS code for the city
      const countyData = await this.getCountyFips(city, state);
      if (!countyData) return null;
      
      // Get median home value from Census API
      const response = await fetch(`${this.CENSUS_API_URL}?get=B25077_001E,B25064_001E&for=county:${countyData.fips}&in=state:${countyData.stateFips}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Census AVM data:', data);
        
        if (data.length > 1 && data[1][0]) {
          const medianValue = parseInt(data[1][0]);
          const medianRent = parseInt(data[1][1]);
          
          // Calculate estimated value based on median home value
          const estimatedValue = medianValue;
          
          return {
            address,
            city,
            state,
            zipCode: zipCode || '',
            estimatedValue,
            valueRange: {
              low: medianValue * 0.8,
              high: medianValue * 1.2,
            },
            lastUpdated: new Date().toISOString(),
            dataSource: 'census',
            confidence: 0.65,
            propertyDetails: {
              beds: Math.round(medianRent / 2000), // Estimate beds based on rent
              baths: Math.round(medianRent / 1500), // Estimate baths
            }
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting Census value:', error);
      return null;
    }
  }

  /**
   * Get value from County Assessor API
   */
  private static async getCountyValue(address: string, city: string, state: string, zipCode?: string): Promise<AVMData | null> {
    try {
      console.log('Getting value from County Assessor API...');
      
      const response = await fetch('/api/county/avm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: `${address}, ${city}, ${state} ${zipCode || ''}`.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('County AVM data:', data);
        
        if (data.assessedValue) {
          // County assessed value is typically 80-85% of market value
          const marketValue = data.assessedValue * 1.2;
          
          return {
            address,
            city,
            state,
            zipCode: zipCode || '',
            estimatedValue: marketValue,
            valueRange: {
              low: marketValue * 0.9,
              high: marketValue * 1.1,
            },
            lastUpdated: new Date().toISOString(),
            dataSource: 'county',
            confidence: 0.70,
            propertyDetails: {
              beds: data.bedrooms,
              baths: data.bathrooms,
              sqft: data.squareFootage,
              yearBuilt: data.yearBuilt
            }
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting County value:', error);
      return null;
    }
  }

  /**
   * Get regional average as fallback
   */
  private static async getRegionalAverage(city: string, state: string): Promise<AVMData | null> {
    try {
      console.log('Getting regional average for:', `${city}, ${state}`);
      
      // Regional averages based on location
      const regionalAverages: { [key: string]: number } = {
        'fremont, ca': 1200000,
        'reno, nv': 500000,
        'truckee, ca': 856432,
        'seattle, wa': 850000,
        'portland, or': 550000,
        'austin, tx': 450000,
        'denver, co': 600000,
        'phoenix, az': 400000,
      };
      
      const key = `${city.toLowerCase()}, ${state.toLowerCase()}`;
      const averageValue = regionalAverages[key] || 500000;
      
      return {
        address: '',
        city,
        state,
        zipCode: '',
        estimatedValue: averageValue,
        valueRange: {
          low: averageValue * 0.8,
          high: averageValue * 1.2,
        },
        lastUpdated: new Date().toISOString(),
        dataSource: 'fallback',
        confidence: 0.50,
      };
    } catch (error) {
      console.error('Error getting regional average:', error);
      return null;
    }
  }

  /**
   * Get county FIPS code for Census API
   */
  private static async getCountyFips(city: string, state: string): Promise<{ fips: string; stateFips: string } | null> {
    // Simplified county FIPS mapping
    const countyMapping: { [key: string]: { fips: string; stateFips: string } } = {
      'fremont, ca': { fips: '001', stateFips: '06' }, // Alameda County, CA
      'reno, nv': { fips: '031', stateFips: '32' }, // Washoe County, NV
      'truckee, ca': { fips: '093', stateFips: '06' }, // Nevada County, CA
      'seattle, wa': { fips: '033', stateFips: '53' }, // King County, WA
    };
    
    const key = `${city.toLowerCase()}, ${state.toLowerCase()}`;
    return countyMapping[key] || null;
  }
}
