import React, { useState, useEffect } from 'react';
import { Property, Transaction } from './types/property';
import { generateId } from './utils/dataUtils';
import { propertiesApi, transactionsApi, API_BASE_URL } from './api/api';
import { getAllPropertiesWithRedfinMarketValues } from './redfin-integration';
import PropertyList from './components/PropertyList';
import PropertyForm from './components/PropertyForm';
import CashFlowDashboard from './components/CashFlowDashboard';
import TransactionManager from './components/TransactionManager';
import BackupManager from './components/BackupManager';

function App() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeView, setActiveView] = useState<'dashboard' | 'properties' | 'transactions' | 'backup'>('dashboard');
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load properties from database
        const updatedProperties = await propertiesApi.getAll();
        console.log('🔄 Loaded properties from database:', updatedProperties.map(p => ({ id: p.id, name: p.name, leaseStartDate: p.leaseStartDate })));
        
        setProperties(updatedProperties);
        
        // Load transactions
        const transactionsData = await transactionsApi.getAll();
        setTransactions(transactionsData);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, []);

  const addProperty = async (propertyData: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    if (editingProperty) {
      console.log('🏠 Updating property in App.tsx:', { editingProperty: editingProperty.id, propertyData });
      const updatedProperty = await propertiesApi.update(editingProperty.id, propertyData);
      console.log('✅ Updated property from API:', updatedProperty);
      
      // Add small delay to ensure database update completes before refreshing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('=== ABOUT TO CALL PROPERTIES API GET ===');
      // Refresh all properties from database to get latest values
      const refreshedProperties = await propertiesApi.getAll();
      console.log('🔄 Refreshed properties from database:', refreshedProperties.map(p => ({ id: p.id, name: p.name, leaseStartDate: p.leaseStartDate })));
      
      setProperties(refreshedProperties);
      console.log('✅ Properties state updated with fresh data');
      setEditingProperty(null);
    } else {
      const newProperty = await propertiesApi.create(propertyData);
      setProperties([...properties, newProperty]);
      setShowAddForm(false);
    }
  } catch (error) {
    console.error('Failed to save property:', error);
    alert('Failed to save property');
  }
};

  const deleteProperty = async (id: string) => {
    try {
      await propertiesApi.delete(id);
      setProperties(properties.filter(p => p.id !== id));
      setTransactions(transactions.filter(t => t.propertyId !== id));
    } catch (error) {
      console.error('Failed to delete property:', error);
      alert('Failed to delete property');
    }
  };

  const editProperty = (property: Property) => {
    setEditingProperty(property);
  };

  const cancelEdit = () => {
    setEditingProperty(null);
    setShowAddForm(false);
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    console.log('=== App: addTransaction ===');
    console.log('Transaction data received:', transactionData);
    try {
      const newTransaction = await transactionsApi.create(transactionData);
      console.log('Transaction created successfully:', newTransaction);
      setTransactions([...transactions, newTransaction]);
      console.log('Transaction added to state');
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const updateTransaction = async (id: string, transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    try {
      const updatedTransaction = await transactionsApi.update(id, transactionData);
      setTransactions(transactions.map(t => t.id === id ? updatedTransaction : t));
    } catch (error) {
      console.error('Failed to update transaction:', error);
      alert('Failed to update transaction');
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await transactionsApi.delete(id);
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      alert('Failed to delete transaction');
    }
  };

  const handleImportBackup = (data: any) => {
    setProperties(data.properties);
    setTransactions(data.transactions);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Property Management</h1>
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeView === 'dashboard'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveView('properties')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeView === 'properties'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Properties
              </button>
              <button
                onClick={() => setActiveView('transactions')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeView === 'transactions'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Transactions
              </button>
              <button
                onClick={() => setActiveView('backup')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeView === 'backup'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Backup
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'dashboard' && (
          <CashFlowDashboard 
            properties={properties} 
            transactions={transactions}
          />
        )}
        {activeView === 'properties' && (
          <div className="space-y-8">
            {(editingProperty || showAddForm) && (
              <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
                <PropertyForm 
                  onSubmit={addProperty} 
                  editingProperty={editingProperty || undefined}
                  onCancel={cancelEdit}
                />
              </div>
            )}
            {!editingProperty && !showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add New Property
              </button>
            )}
            <PropertyList 
              properties={properties} 
              onEdit={editProperty}
              onDelete={deleteProperty}
            />
          </div>
        )}
        {activeView === 'transactions' && (
          <TransactionManager 
            properties={properties}
            transactions={transactions}
            onAddTransaction={addTransaction}
            onUpdateTransaction={updateTransaction}
            onDeleteTransaction={deleteTransaction}
          />
        )}
        {activeView === 'backup' && (
          <BackupManager 
            properties={properties}
            transactions={transactions}
            onImport={handleImportBackup}
          />
        )}
      </main>
    </div>
  );
}

export default App;
