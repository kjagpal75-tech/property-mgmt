export interface Property {
  id: string;
  name: string;
  address: string;
  purchasePrice: number;
  marketValue?: number; // Redfin market value
  redfinMarketValue?: number | null; // Redfin market value (explicit)
  redfinValueRange?: { low: number; high: number } | null; // Redfin value range
  redfinRentPrice?: number | null; // Redfin rent price
  redfinBedrooms?: number | null; // Redfin bedrooms
  redfinBathrooms?: number | null; // Redfin bathrooms
  redfinSquareFootage?: number | null; // Redfin square footage
  redfinYearBuilt?: number | null; // Redfin year built
  redfinLotSize?: number | null; // Redfin lot size
  redfinPropertyType?: string | null; // Redfin property type
  redfinStatus?: string | null; // Redfin status
  redfinConfidence?: number | null; // Redfin confidence
  redfinLastUpdated?: string | null; // Redfin last updated
  monthlyRent: number;
  currentRent: number;
  leaseStartDate?: Date;
  rentHistory: {
    id: string;
    monthlyRate: number;
    effectiveDate: string;
    endDate?: string;
    reason?: string;
    createdAt: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  propertyId: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: Date;
  createdAt: Date;
}

export interface CashFlowSummary {
  propertyId: string;
  propertyName: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  netCashFlow: number;
  yearlyCashFlow: number;
  roi: number;
  selectedYear?: number;
}

export type TransactionCategory = 
  | 'rent'
  | 'maintenance'
  | 'insurance'
  | 'property_tax'
  | 'utilities'
  | 'hoa'
  | 'management_fees'
  | 'vacancy'
  | 'repairs'
  | 'other';
