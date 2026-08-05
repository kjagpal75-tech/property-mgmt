export interface CountyAssessorData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  assessedValue: number;
  landValue: number;
  improvementValue: number;
  assessmentDate: string;
  assessmentRatio: number;
  marketValue: number;
  valueRange: {
    low: number;
    high: number;
  };
  propertyDetails: {
    beds?: number;
    baths?: number;
    sqft?: number;
    yearBuilt?: number;
    lotSize?: number;
    propertyType?: string;
  };
  lastUpdated: string;
  dataSource: 'county_assessor';
  confidence: number;
}

export class CountyAssessorService {
  
  /**
   * Get property data from county assessor
   */
  static async getPropertyData(address: string, city: string, state: string, zipCode?: string): Promise<CountyAssessorData | null> {
    try {
      console.log('Getting county assessor data for:', `${address}, ${city}, ${state} ${zipCode || ''}`);
      
      // Detect county from city and state
      const county = this.detectCounty(city, state);
      if (!county) {
        console.log('County not detected for:', city, state);
        return null;
      }
      
      console.log('Detected county:', county);
      
      // Route to appropriate county API
      let rawData;
      switch (county) {
        case 'alameda':
          rawData = await this.getAlamedaCountyData(address, city, state, zipCode);
          break;
        case 'washoe':
          rawData = await this.getWashoeCountyData(address, city, state, zipCode);
          break;
        case 'nevada':
          rawData = await this.getNevadaCountyData(address, city, state, zipCode);
          break;
        default:
          console.log('Unsupported county:', county);
          return null;
      }
      
      if (!rawData) {
        return null;
      }
      
      // Normalize data and calculate market value
      return this.normalizeCountyData(rawData, county, address, city, state, zipCode);
      
    } catch (error) {
      console.error('Error getting county assessor data:', error);
      return null;
    }
  }

  /**
   * Detect county from city and state
   */
  private static detectCounty(city: string, state: string): string | null {
    const countyMap: { [key: string]: string } = {
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
    return countyMap[key] || null;
  }

  /**
   * Get Alameda County data (Fremont)
   */
  private static async getAlamedaCountyData(address: string, city: string, state: string, zipCode?: string): Promise<any> {
    try {
      console.log('Fetching Alameda County data...');
      
      // Mock Alameda County API call
      // In real implementation, this would call the actual Alameda County API
      const mockData = {
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
      
      console.log('Alameda County data received:', mockData);
      return mockData;
      
    } catch (error) {
      console.error('Error fetching Alameda County data:', error);
      return null;
    }
  }

  /**
   * Get Washoe County data (Reno)
   */
  private static async getWashoeCountyData(address: string, city: string, state: string, zipCode?: string): Promise<any> {
    try {
      console.log('Fetching Washoe County data...');
      
      // Mock Washoe County API call
      // In real implementation, this would call the actual Washoe County API
      const mockData = {
        parcelNumber: '456-789-012',
        assessedValue: 400000,
        landValue: 150000,
        improvementValue: 250000,
        assessmentDate: '2024-01-01',
        yearBuilt: 1985,
        squareFootage: 1200,
        bedrooms: 3,
        bathrooms: 2,
        lotSize: 5000,
        propertyType: 'Single Family Residential'
      };
      
      console.log('Washoe County data received:', mockData);
      return mockData;
      
    } catch (error) {
      console.error('Error fetching Washoe County data:', error);
      return null;
    }
  }

  /**
   * Get Nevada County data (Truckee)
   */
  private static async getNevadaCountyData(address: string, city: string, state: string, zipCode?: string): Promise<any> {
    try {
      console.log('Fetching Nevada County data...');
      
      // Mock Nevada County API call
      // In real implementation, this would call the actual Nevada County API
      const mockData = {
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
      
      console.log('Nevada County data received:', mockData);
      return mockData;
      
    } catch (error) {
      console.error('Error fetching Nevada County data:', error);
      return null;
    }
  }

  /**
   * Normalize county data to standard format
   */
  private static normalizeCountyData(rawData: any, county: string, address: string, city: string, state: string, zipCode?: string): CountyAssessorData {
    
    // Get assessment ratio for the state
    const assessmentRatio = this.getAssessmentRatio(state);
    
    // Calculate market value from assessed value
    const marketValue = rawData.assessedValue / assessmentRatio;
    
    // Calculate value range (±10%)
    const valueRange = {
      low: marketValue * 0.90,
      high: marketValue * 1.10
    };
    
    return {
      address: `${address}, ${city}, ${state} ${zipCode || ''}`,
      city,
      state,
      zipCode: zipCode || '',
      county: county.charAt(0).toUpperCase() + county.slice(1),
      assessedValue: rawData.assessedValue,
      landValue: rawData.landValue,
      improvementValue: rawData.improvementValue,
      assessmentDate: rawData.assessmentDate,
      assessmentRatio,
      marketValue,
      valueRange,
      propertyDetails: {
        beds: rawData.bedrooms,
        baths: rawData.bathrooms,
        sqft: rawData.squareFootage,
        yearBuilt: rawData.yearBuilt,
        lotSize: rawData.lotSize,
        propertyType: rawData.propertyType
      },
      lastUpdated: new Date().toISOString(),
      dataSource: 'county_assessor',
      confidence: 0.85 // High confidence for direct county data
    };
  }

  /**
   * Get assessment ratio by state
   */
  private static getAssessmentRatio(state: string): number {
    const ratios: { [key: string]: number } = {
      'ca': 0.80,  // California
      'nv': 0.35,  // Nevada
      'wa': 0.90,  // Washington
      'or': 0.85,  // Oregon
      'tx': 1.00,  // Texas
      'fl': 0.85,  // Florida
      'ny': 0.75,  // New York (average)
      'il': 0.40   // Illinois (average)
    };
    
    return ratios[state.toLowerCase()] || 0.80; // Default to 80%
  }

  /**
   * Get supported counties
   */
  static getSupportedCounties(): { [key: string]: string[] } {
    return {
      'alameda': ['fremont', 'newark', 'union city'],
      'washoe': ['reno', 'sparks'],
      'nevada': ['truckee', 'grass valley'],
      'king': ['seattle', 'bellevue']
    };
  }

  /**
   * Check if county is supported
   */
  static isCountySupported(city: string, state: string): boolean {
    const county = this.detectCounty(city, state);
    return county !== null;
  }
}
