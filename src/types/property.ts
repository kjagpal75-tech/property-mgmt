export interface Property {
  id: string;
  name: string;
  address: string;
  purchasePrice: number;
  marketValue?: number; // Database market value (from market_value column)
  redfinUrl?: string; // Redfin property URL
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
  leaseEndDate?: Date;
  leaseRent?: number;
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
  // Expense tracking fields
  monthlyExpenses?: number;
  expenseCategories?: string[];
  expenseRecurrence?: 'none' | 'monthly' | 'quarterly' | 'annually';
  expenseNextDueDate?: Date;
  expenseReminderEnabled?: boolean;
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
  // Recurring payment fields
  recurrence?: 'none' | 'monthly' | 'quarterly' | 'annually';
  nextDueDate?: Date;
  reminderEnabled?: boolean;
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