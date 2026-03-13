import React, { useState, useMemo } from 'react';
import { Property, Transaction } from '../types/property';
import { calculateCashFlow, formatCurrency } from '../utils/dataUtils';

interface CashFlowDashboardProps {
  properties: Property[];
  transactions: Transaction[];
}

const CashFlowDashboard: React.FC<CashFlowDashboardProps> = ({ properties, transactions }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Get available years from transactions
  const availableYears = useMemo(() => {
    const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
    years.add(new Date().getFullYear()); // Add current year
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  // Filter transactions by selected year
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === selectedYear;
    });
  }, [transactions, selectedYear]);

  // Calculate rent tracking for each property
  const rentTracking = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return properties.map(property => {
      // Get current month rent transactions only
      const currentMonthRentTransactions = transactions.filter(t => 
        t.propertyId === property.id && 
        t.category === 'rent' && 
        t.type === 'income' &&
        new Date(t.date).getMonth() === currentMonth &&
        new Date(t.date).getFullYear() === currentYear
      );
      
      const currentMonthRent = currentMonthRentTransactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
      
      // Calculate effective monthly rent based on selected year and rent history
      const getEffectiveRentForYear = (property: Property, year: number): number => {
        if (!property.rentHistory || property.rentHistory.length === 0) {
          return property.monthlyRent || 0;
        }
        
        // Find the rate that was effective at the end of the selected year
        const yearEnd = new Date(year, 11, 31); // December 31st of selected year
        
        // Sort rent history by effective date (newest first)
        const sortedHistory = [...property.rentHistory].sort((a, b) => 
          new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
        );
        
        // Find the first rate that was effective on or before December 31st of the selected year
        const effectiveRate = sortedHistory.find(rate => {
          const effectiveDate = new Date(rate.effectiveDate);
          return effectiveDate <= yearEnd;
        });
        
        return effectiveRate ? effectiveRate.monthlyRate : (property.monthlyRent || 0);
      };
      
      const expectedMonthlyRent = getEffectiveRentForYear(property, selectedYear);
      
      return {
        propertyId: property.id,
        propertyName: property.name,
        expectedMonthlyRent,
        currentMonthRent,
        remainingBalance: expectedMonthlyRent - currentMonthRent,
        rentPayments: currentMonthRentTransactions,
        isFullyPaid: currentMonthRent >= expectedMonthlyRent
      };
    });
  }, [properties, transactions]);
  const cashFlowSummaries = properties.map(property => 
    calculateCashFlow(property, filteredTransactions, selectedYear)
  );

  const totalYearlyIncome = cashFlowSummaries.reduce((sum, summary) => sum + summary.monthlyIncome, 0) * 12;
  const totalYearlyExpenses = cashFlowSummaries.reduce((sum, summary) => sum + summary.monthlyExpenses, 0) * 12;
  const totalYearlyCashFlow = totalYearlyIncome - totalYearlyExpenses;
  const totalInvestment = properties.reduce((sum, property) => sum + parseFloat(property.purchasePrice.toString()), 0);
  const totalRoi = totalInvestment > 0 ? (totalYearlyCashFlow / totalInvestment) * 100 : 0;

  // Export functionality
  const exportToCSV = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Create detailed monthly breakdown
    const monthlyData = [];
    
    // Add headers
    monthlyData.push(['Month', 'Property', 'Date', 'Description', 'Category', 'Type', 'Amount', 'Net Cash Flow']);
    
    // Process each month
    for (let month = 0; month < 12; month++) {
      let monthHasData = false;
      
      properties.forEach(property => {
        const monthTransactions = filteredTransactions.filter(t => {
          const transactionDate = new Date(t.date);
          return t.propertyId === property.id && 
                 transactionDate.getMonth() === month &&
                 transactionDate.getFullYear() === selectedYear;
        });
        
        // Sort transactions by date
        monthTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        monthTransactions.forEach(transaction => {
          const amount = parseFloat(transaction.amount.toString());
          const transactionType = transaction.type === 'income' ? 'Income' : 'Expense';
          const formattedAmount = transaction.type === 'income' ? amount.toFixed(2) : `-${amount.toFixed(2)}`;
          
          monthlyData.push([
            months[month],
            property.name,
            new Date(transaction.date).toLocaleDateString(),
            transaction.description,
            transaction.category,
            transactionType,
            formattedAmount,
            '' // Net cash flow will be calculated at subtotal
          ]);
          monthHasData = true;
        });
      });
      
      // Add month subtotal if there was data
      if (monthHasData) {
        const monthIncome: number = monthlyData
          .filter(row => row[0] === months[month] && row[5] === 'Income')
          .reduce((sum: number, row: string[]) => sum + parseFloat(row[6]), 0);
        
        const monthExpenses: number = monthlyData
          .filter(row => row[0] === months[month] && row[5] === 'Expense')
          .reduce((sum: number, row: string[]) => sum + Math.abs(parseFloat(row[6])), 0);
        
        const monthNet: number = monthIncome - monthExpenses;
        
        monthlyData.push([months[month], '', '', '', '', 'SUBTOTAL', '', monthNet.toFixed(2)]);
        monthlyData.push(['', '', '', '', '', '', '', '']); // Empty row
      }
    }
    
    // Add yearly summary
    monthlyData.push(['YEARLY SUMMARY', '', '', '', '', '', '', '']);
    cashFlowSummaries.forEach(summary => {
      monthlyData.push([
        summary.propertyName,
        '',
        '',
        '',
        '',
        'Yearly Total',
        '',
        summary.netCashFlow.toFixed(2)
      ]);
    });
    
    monthlyData.push([
      'TOTAL PORTFOLIO',
      '',
      '',
      '',
      '',
      'Yearly Total',
      '',
      totalYearlyCashFlow.toFixed(2)
    ]);

    const csvContent = monthlyData.map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detailed-cash-flow-${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Format values with NaN protection
  const formatValue = (value: number) => isNaN(value) ? 0 : value;

  return (
    <div className="space-y-8">
      {/* Year Filter */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Cash Flow Dashboard</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
            <div className="flex items-center space-x-2">
              <label htmlFor="year-filter" className="text-sm font-medium text-gray-700">
                Year:
              </label>
              <select
                id="year-filter"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="block w-32 px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Yearly Income</p>
              <p className="text-2xl font-semibold text-green-600">{formatCurrency(formatValue(totalYearlyIncome))}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Yearly Expenses</p>
              <p className="text-2xl font-semibold text-red-600">{formatCurrency(formatValue(totalYearlyExpenses))}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 ${formatValue(totalYearlyCashFlow) >= 0 ? 'bg-blue-100' : 'bg-red-100'} rounded-full flex items-center justify-center`}>
                <svg className={`w-5 h-5 ${formatValue(totalYearlyCashFlow) >= 0 ? 'text-blue-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Yearly Cash Flow</p>
              <p className={`text-2xl font-semibold ${formatValue(totalYearlyCashFlow) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(formatValue(totalYearlyCashFlow))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">ROI</p>
              <p className="text-2xl font-semibold text-purple-600">{formatValue(totalRoi).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rent Tracking Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Monthly Rent Status</h2>
        </div>
        {properties.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No properties added yet. Add your first property to see rent tracking.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Monthly Rent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {new Date().toLocaleString('default', { month: 'long' })} Rent Received
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remaining Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rentTracking.map((rent) => (
                  <tr key={rent.propertyId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rent.propertyName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(formatValue(rent.expectedMonthlyRent))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {formatCurrency(formatValue(rent.currentMonthRent))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={rent.remainingBalance <= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(formatValue(rent.remainingBalance))}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        rent.isFullyPaid 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {rent.isFullyPaid ? 'Paid' : 'Due'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Properties Cash Flow Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Property Cash Flow Details</h2>
        </div>
        {properties.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No properties added yet. Add your first property to see cash flow data.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Yearly Income
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Yearly Expenses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Yearly Cash Flow
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ROI
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cashFlowSummaries.map((summary) => (
                  <tr key={summary.propertyId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {summary.propertyName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {formatCurrency(formatValue(summary.monthlyIncome * 12))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {formatCurrency(formatValue(summary.monthlyExpenses * 12))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={formatValue(summary.netCashFlow) >= 0 ? 'text-blue-600' : 'text-red-600'}>
                        {formatCurrency(formatValue(summary.netCashFlow))}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(formatValue(summary.yearlyCashFlow))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600">
                      {formatValue(summary.roi).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashFlowDashboard;
