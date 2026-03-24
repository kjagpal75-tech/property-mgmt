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

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load properties with Redfin market values
        const propertiesWithRedfin = await getAllPropertiesWithRedfinMarketValues();
        
        // Store market values in database for each property
        for (const property of propertiesWithRedfin) {
          if (property.redfinMarketValue && property.redfinMarketValue > 0) {
            try {
              const response = await fetch(`${API_BASE_URL}/properties/${property.id}/market-value`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  market_value: property.redfinMarketValue
                })
              });
              
              if (response.ok) {
                console.log(`✅ Stored market value for ${property.name}:`, property.redfinMarketValue);
              } else {
                console.error(`❌ Failed to store market value for ${property.name}:`, response.statusText);
              }
            } catch (error) {
              console.error(`❌ Error storing market value for ${property.name}:`, error);
            }
          }
        }
        
        // Reload properties from database to get updated market values
        const updatedProperties = await propertiesApi.getAll();
        console.log('🔄 Reloaded properties from database:', updatedProperties.map(p => ({ id: p.id, name: p.name, marketValue: p.marketValue })));
        
        // Set enhanced properties directly
        setProperties(updatedProperties as Property[]);
        
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
      const updatedProperty = await propertiesApi.update(editingProperty.id, propertyData);
      setProperties(properties.map(p => p.id === editingProperty.id ? updatedProperty : p));
      setEditingProperty(null);
    } else {
      const newProperty = await propertiesApi.create(propertyData);
      setProperties([...properties, newProperty]);
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
            <PropertyForm 
              onSubmit={addProperty} 
              editingProperty={editingProperty || undefined}
              onCancel={cancelEdit}
            />
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
