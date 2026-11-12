import React, { useState, useEffect } from 'react';
import { Property, Transaction, TransactionCategory } from '../types/property';
import { formatCurrency } from '../utils/dataUtils';
import DocumentUpload from './DocumentUpload';

interface TransactionManagerProps {
  properties: Property[];
  transactions: Transaction[];
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onUpdateTransaction: (id: string, transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onDeleteTransaction: (id: string) => void;
}

const TransactionManager: React.FC<TransactionManagerProps> = ({ 
  properties, 
  transactions, 
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction
}) => {
  const [formData, setFormData] = useState({
    propertyId: '',
    type: 'expense' as 'income' | 'expense',
    category: 'maintenance' as TransactionCategory,
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    recurrence: 'none' as 'none' | 'monthly' | 'quarterly' | 'annually',
    nextDueDate: '',
    reminderEnabled: false,
  });
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Transaction | 'propertyName';
    direction: 'asc' | 'desc';
  }>({
    key: 'date',
    direction: 'desc'
  });
  const [filters, setFilters] = useState({
    date: '',
    propertyId: '',
    type: '',
    category: '',
    description: '',
    amount: '',
    recurrence: '',
  });
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [upcomingReminders, setUpcomingReminders] = useState<Transaction[]>([]);

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        propertyId: editingTransaction.propertyId,
        type: editingTransaction.type,
        category: editingTransaction.category as TransactionCategory,
        amount: editingTransaction.amount?.toString() || '0',
        description: editingTransaction.description,
        date: new Date(editingTransaction.date).toISOString().split('T')[0],
        recurrence: editingTransaction.recurrence || 'none',
        nextDueDate: editingTransaction.nextDueDate ? new Date(editingTransaction.nextDueDate).toISOString().split('T')[0] : '',
        reminderEnabled: editingTransaction.reminderEnabled || false,
      });
    }
  }, [editingTransaction]);

  // Calculate upcoming reminders (transactions with nextDueDate within 30 days)
  useEffect(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    
    const upcoming = transactions.filter(t => {
      if (!t.nextDueDate || !t.reminderEnabled) return false;
      const dueDate = new Date(t.nextDueDate);
      return dueDate >= now && dueDate <= thirtyDaysFromNow;
    });
    
    setUpcomingReminders(upcoming);
  }, [transactions]);

  const resetForm = () => {
    setFormData({
      propertyId: '',
      type: 'expense',
      category: 'maintenance',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      recurrence: 'none',
      nextDueDate: '',
      reminderEnabled: false,
    });
    setEditingTransaction(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.propertyId || !formData.amount || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    const transactionData = {
      propertyId: formData.propertyId,
      type: formData.type,
      category: formData.category,
      amount: parseFloat(formData.amount),
      description: formData.description,
      date: new Date(formData.date),
      recurrence: formData.recurrence,
      nextDueDate: formData.nextDueDate ? new Date(formData.nextDueDate) : undefined,
      reminderEnabled: formData.reminderEnabled,
    };

    if (editingTransaction) {
      onUpdateTransaction(editingTransaction.id, transactionData);
    } else {
      onAddTransaction(transactionData);
    }

    resetForm();
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      onDeleteTransaction(id);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const getPropertyById = (id: string) => {
    return properties.find(p => p.id === id);
  };

  // Helper function to check if a property is actively in lease
  const isPropertyInLease = (property: Property | undefined): boolean => {
    if (!property) return false;
    
    const now = new Date();
    
    // If there's no lease start date, property is not in an active lease
    if (!property.leaseStartDate) {
      return false;
    }
    
    const leaseStartDate = new Date(property.leaseStartDate);
    const leaseEndDate = property.leaseEndDate ? new Date(property.leaseEndDate) : null;
    
    // Check if lease has started
    const leaseStarted = leaseStartDate <= now;
    
    // Check if lease is still active (no end date or end date in the future)
    const leaseIsActive = !leaseEndDate || leaseEndDate >= now;
    
    return leaseStarted && leaseIsActive;
  };

  const handleSort = (key: keyof Transaction | 'propertyName') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      date: '',
      propertyId: '',
      type: '',
      category: '',
      description: '',
      amount: '',
      recurrence: '',
    });
  };

  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(transaction => {
      const property = getPropertyById(transaction.propertyId);
      
      // Conditionally filter out rent transactions when property is not actively in lease
      if (transaction.category === 'rent' && transaction.type === 'income') {
        if (!isPropertyInLease(property)) {
          return false;
        }
        
        // Additional filter: only show rent transactions that fall within the lease date range
        const transactionDate = new Date(transaction.date);
        const leaseStartDate = property!.leaseStartDate ? new Date(property!.leaseStartDate) : null;
        const leaseEndDate = property!.leaseEndDate ? new Date(property!.leaseEndDate) : null;
        
        // If there's a lease start date and transaction date is before it, exclude the transaction
        if (leaseStartDate && transactionDate < leaseStartDate) {
          return false;
        }
        
        // If there's a lease end date and transaction date is after it, exclude the transaction
        if (leaseEndDate && transactionDate > leaseEndDate) {
          return false;
        }
      }
      
      const dateMatch = !filters.date || 
        new Date(transaction.date).toLocaleDateString().toLowerCase().includes(filters.date.toLowerCase());
      
      const propertyMatch = !filters.propertyId || 
        property?.name.toLowerCase().includes(filters.propertyId.toLowerCase());
      
      const typeMatch = !filters.type || 
        transaction.type.toLowerCase().includes(filters.type.toLowerCase());
      
      const categoryMatch = !filters.category || 
        transaction.category.toLowerCase().includes(filters.category.toLowerCase());
      
      const descriptionMatch = !filters.description || 
        transaction.description.toLowerCase().includes(filters.description.toLowerCase());
      
      const amountMatch = !filters.amount || 
        (transaction.amount ? parseFloat(String(transaction.amount)) : 0).toString().includes(filters.amount);
      
      const recurrenceMatch = !filters.recurrence || 
        (transaction.recurrence || 'none') === filters.recurrence;
      
      return dateMatch && propertyMatch && typeMatch && categoryMatch && descriptionMatch && amountMatch && recurrenceMatch;
    });
  }, [transactions, filters, properties, isPropertyInLease]);

  const sortedTransactions = React.useMemo(() => {
    let sortableTransactions = [...filteredTransactions];
    
    sortableTransactions.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortConfig.key === 'propertyName') {
        aValue = getPropertyById(a.propertyId)?.name || '';
        bValue = getPropertyById(b.propertyId)?.name || '';
      } else if (sortConfig.key === 'date') {
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
      } else if (sortConfig.key === 'amount') {
        aValue = a.amount ? parseFloat(String(a.amount)) : 0;
        bValue = b.amount ? parseFloat(String(b.amount)) : 0;
      } else {
        aValue = a[sortConfig.key as keyof Transaction];
        bValue = b[sortConfig.key as keyof Transaction];
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sortableTransactions;
  }, [filteredTransactions, sortConfig, properties]);

  return (
    <div className="space-y-8">
      {/* Upcoming Payment Reminders */}
      {upcomingReminders.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-medium text-yellow-800">Upcoming Payment Reminders</p>
              <p className="text-sm text-yellow-700">
                {upcomingReminders.map(t => {
                  const property = getPropertyById(t.propertyId);
                  const dueDate = new Date(t.nextDueDate!);
                  return (
                    <span key={t.id} className="block">
                      {property?.name}: {t.description} - {formatCurrency(t.amount)} due {dueDate.toLocaleDateString()}
                    </span>
                  );
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setShowDocumentUpload(!showDocumentUpload)}
              className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                showDocumentUpload
                  ? 'border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100 focus:ring-blue-500'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {showDocumentUpload ? 'Manual Entry' : 'Import Document'}
            </button>
          </div>
        </div>
        
        {showDocumentUpload ? (
          <DocumentUpload 
            properties={properties}
            onTransactionExtracted={(transaction) => {
              console.log('=== Transaction Manager: onTransactionExtracted ===');
              console.log('Transaction received:', transaction);
              try {
                onAddTransaction(transaction);
                console.log('onAddTransaction called successfully');
                setShowDocumentUpload(false);
                console.log('Document upload dialog closed');
                resetForm();
                console.log('Form reset completed');
              } catch (error) {
                console.error('Error in transaction creation flow:', error);
                alert('Failed to create transaction. Please try again.');
              }
            }}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700">
                Property
              </label>
              <select
                id="propertyId"
                name="propertyId"
                value={formData.propertyId}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a property</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="rent">Rent</option>
                <option value="maintenance">Maintenance</option>
                <option value="insurance">Insurance</option>
                <option value="property_tax">Property Tax</option>
                <option value="utilities">Utilities</option>
                <option value="hoa">HOA Fees</option>
                <option value="management_fees">Management Fees</option>
                <option value="vacancy">Vacancy</option>
                <option value="repairs">Repairs</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter description"
              />
            </div>
          </div>

          {/* Recurring Payment Section */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Recurring Payment
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="recurrence" className="block text-sm font-medium text-gray-700">
                  Recurrence
                </label>
                <select
                  id="recurrence"
                  name="recurrence"
                  value={formData.recurrence}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="none">One-time</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>

              <div>
                <label htmlFor="nextDueDate" className="block text-sm font-medium text-gray-700">
                  Next Due Date
                </label>
                <input
                  type="date"
                  id="nextDueDate"
                  name="nextDueDate"
                  value={formData.nextDueDate}
                  onChange={handleChange}
                  disabled={formData.recurrence === 'none'}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-end">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="reminderEnabled"
                    name="reminderEnabled"
                    checked={formData.reminderEnabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, reminderEnabled: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="reminderEnabled" className="ml-2 block text-sm font-medium text-gray-700">
                    Enable Reminder
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            {editingTransaction && (
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
            </button>
          </div>
        </form>
        )}
      </div>

      {/* Transactions List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Recent Transactions</h2>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
        
        {/* Filter Row */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-3">
            <div>
              <input
                type="text"
                placeholder="Filter by date..."
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                className="block w-full text-sm border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Filter by property..."
                value={filters.propertyId}
                onChange={(e) => handleFilterChange('propertyId', e.target.value)}
                className="block w-full text-sm border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="block w-full text-sm border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <input
                type="text"
                placeholder="Filter by category..."
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="block w-full text-sm border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Filter by description..."
                value={filters.description}
                onChange={(e) => handleFilterChange('description', e.target.value)}
                className="block w-full text-sm border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Filter by amount..."
                value={filters.amount}
                onChange={(e) => handleFilterChange('amount', e.target.value)}
                className="block w-full text-sm border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <select
                value={filters.recurrence}
                onChange={(e) => handleFilterChange('recurrence', e.target.value)}
                className="block w-full text-sm border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Recurrences</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
          </div>
          {Object.values(filters).some(value => value !== '') && (
            <div className="mt-3 text-sm text-gray-600">
              Showing {sortedTransactions.length} of {transactions.length} transactions
            </div>
          )}
        </div>
        {transactions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No transactions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Date</span>
                      {sortConfig.key === 'date' && (
                        <span className="text-blue-600">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('propertyName')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Property</span>
                      {sortConfig.key === 'propertyName' && (
                        <span className="text-blue-600">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Type</span>
                      {sortConfig.key === 'type' && (
                        <span className="text-blue-600">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Category</span>
                      {sortConfig.key === 'category' && (
                        <span className="text-blue-600">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('description')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Description</span>
                      {sortConfig.key === 'description' && (
                        <span className="text-blue-600">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Amount</span>
                      {sortConfig.key === 'amount' && (
                        <span className="text-blue-600">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recurrence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedTransactions.map((transaction) => {
                  const property = getPropertyById(transaction.propertyId);
                  return (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {property?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.type === 'income' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.category.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.recurrence && transaction.recurrence !== 'none' ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {transaction.recurrence}
                            {transaction.reminderEnabled && (
                              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="inline-flex items-center px-2 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionManager;