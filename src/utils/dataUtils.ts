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
  // Add safety check for undefined properties
  if (!property) {
    console.error('calculateCashFlow called with undefined property');
    return {
      propertyId: '',
      propertyName: '',
      monthlyIncome: 0,
      monthlyExpenses: 0,
      netCashFlow: 0,
      yearlyCashFlow: 0,
      roi: 0,
    };
  }
  
  // Filter transactions for this property AND selected year
  const propertyTransactions = transactions.filter(t => 
    t.propertyId === property.id && 
    (!selectedYear || new Date(t.date).getFullYear() === selectedYear)
  );
  
  // Get all income and expense transactions for selected year
  const incomeTransactions = propertyTransactions.filter(t => t.type === 'income');
  const expenseTransactions = propertyTransactions.filter(t => t.type === 'expense');

  // Calculate totals - ONLY use actual transaction data
  const actualIncome = incomeTransactions.reduce((sum, t) => sum + (t.amount ? parseFloat(String(t.amount)) : 0), 0);
  const actualExpenses = expenseTransactions.reduce((sum, t) => sum + (t.amount ? parseFloat(String(t.amount)) : 0), 0);

  // Calculate number of months passed for year-to-date average
  const currentYear = new Date().getFullYear();
  const targetYear = selectedYear || currentYear;
  const monthsPassed = targetYear === currentYear 
    ? new Date().getMonth() + 1 
    : 12; // If historical year, use full 12 months

  // Use year-to-date average: divide by months passed, not always 12
  const monthlyIncome = monthsPassed > 0 ? actualIncome / monthsPassed : 0;
  const monthlyExpenses = monthsPassed > 0 ? actualExpenses / monthsPassed : 0;
  const netCashFlow = monthlyIncome - monthlyExpenses; // Monthly average net cash flow
  const yearlyCashFlow = actualIncome - actualExpenses; // Yearly total net cash flow
  const purchasePrice = property.purchasePrice ? parseFloat(String(property.purchasePrice)) : 0;
  const roi = purchasePrice > 0 ? (yearlyCashFlow / purchasePrice) * 100 : 0;

  return {
    propertyId: property.id,
    propertyName: property.name,
    monthlyIncome: isNaN(monthlyIncome) ? 0 : monthlyIncome,
    monthlyExpenses: isNaN(monthlyExpenses) ? 0 : monthlyExpenses,
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
