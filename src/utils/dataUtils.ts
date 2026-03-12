import { Property, Transaction, CashFlowSummary } from '../types/property';

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const calculateCashFlow = (property: Property, transactions: Transaction[], selectedYear?: number): CashFlowSummary => {
  // Filter transactions for this property AND selected year
  const propertyTransactions = transactions.filter(t => 
    t.propertyId === property.id && 
    (!selectedYear || new Date(t.date).getFullYear() === selectedYear)
  );
  
  // Get all income and expense transactions for selected year
  const incomeTransactions = propertyTransactions.filter(t => t.type === 'income');
  const expenseTransactions = propertyTransactions.filter(t => t.type === 'expense');

  // Calculate totals - ONLY use actual transaction data
  const actualIncome = incomeTransactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  const actualExpenses = expenseTransactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  const netCashFlow = actualIncome - actualExpenses;
  const yearlyCashFlow = netCashFlow; // Already based on actual yearly data
  const purchasePrice = parseFloat(property.purchasePrice.toString());
  const roi = purchasePrice > 0 ? (yearlyCashFlow / purchasePrice) * 100 : 0;

  return {
    propertyId: property.id,
    propertyName: property.name,
    monthlyIncome: isNaN(actualIncome / 12) ? 0 : actualIncome / 12, // Convert to monthly equivalent for display
    monthlyExpenses: isNaN(actualExpenses / 12) ? 0 : actualExpenses / 12, // Convert to monthly equivalent
    netCashFlow: isNaN(netCashFlow) ? 0 : netCashFlow,
    yearlyCashFlow: isNaN(yearlyCashFlow) ? 0 : yearlyCashFlow,
    roi: isNaN(roi) ? 0 : roi,
  };
};

export const saveToLocalStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const loadFromLocalStorage = (key: string): any => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
};
