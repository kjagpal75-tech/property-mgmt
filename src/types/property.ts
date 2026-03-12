export interface Property {
  id: string;
  name: string;
  address: string;
  purchasePrice: number;
  monthlyRent: number;
  createdAt: Date;
  updatedAt: Date;
  rentalRateHistory?: {
    id: string;
    monthlyRate: number;
    effectiveDate: string;
    endDate?: string;
    reason?: string;
    createdAt: string;
  }[];
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
  | 'management_fees'
  | 'vacancy'
  | 'repairs'
  | 'other';
