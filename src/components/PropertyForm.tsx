import React, { useState, useEffect, Fragment } from 'react';
import { Property } from '../types/property';
import SimpleRateHistory from './SimpleRateHistory';

interface PropertyFormProps {
  onSubmit: (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingProperty?: Property;
  onCancel?: () => void;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ onSubmit, editingProperty, onCancel }) => {
  const [formData, setFormData] = useState<{
    name: string;
    address: string;
    purchasePrice: string;
    marketValue: string;
    monthlyRent: string;
    currentRent: number;
    leaseStartDate?: Date;
    leaseEndDate?: Date;
    leaseRent: string;
    redfinUrl: string;
    rentHistory: Property['rentHistory'];
    // Expense tracking fields
    monthlyExpenses: string;
    expenseCategories: string[];
    expenseRecurrence: 'none' | 'monthly' | 'quarterly' | 'annually';
    expenseNextDueDate: string;
    expenseReminderEnabled: boolean;
  }>({
    name: '',
    address: '',
    purchasePrice: '',
    marketValue: '',
    monthlyRent: '',
    currentRent: 0,
    leaseStartDate: undefined,
    leaseEndDate: undefined,
    leaseRent: '',
    redfinUrl: '',
    rentHistory: [],
    monthlyExpenses: '',
    expenseCategories: [],
    expenseRecurrence: 'none',
    expenseNextDueDate: '',
    expenseReminderEnabled: false,
  });

  React.useEffect(() => {
    if (editingProperty) {
      console.log('🏠 Editing property data:', { id: editingProperty.id, leaseStartDate: editingProperty.leaseStartDate, leaseEndDate: editingProperty.leaseEndDate });
      
      // Convert lease start date string to Date object if it exists
      const leaseStartDate = editingProperty.leaseStartDate ? new Date(editingProperty.leaseStartDate) : undefined;
      const leaseEndDate = editingProperty.leaseEndDate ? new Date(editingProperty.leaseEndDate) : undefined;
      console.log('🏠 Converted lease start date:', leaseStartDate);
      console.log('🏠 Converted lease end date:', leaseEndDate);
      
      setFormData({
        name: editingProperty.name,
        address: editingProperty.address,
        purchasePrice: editingProperty.purchasePrice?.toString() || '',
        marketValue: editingProperty.marketValue?.toString() || '',
        monthlyRent: (() => {
          const history = editingProperty.rentHistory || [];
          if (history.length > 0) {
            const sorted = [...history].sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
            return (sorted[0]?.monthlyRate || editingProperty.monthlyRent || 0).toString();
          }
          return editingProperty.monthlyRent?.toString() || '';
        })(),
        currentRent: editingProperty.currentRent,
        leaseStartDate: leaseStartDate,
        leaseEndDate: leaseEndDate,
        leaseRent: editingProperty.leaseRent?.toString() || '',
        redfinUrl: editingProperty.redfinUrl?.toString() || '',
        rentHistory: editingProperty.rentHistory || [],
        monthlyExpenses: editingProperty.monthlyExpenses?.toString() || '',
        expenseCategories: editingProperty.expenseCategories || [],
        expenseRecurrence: editingProperty.expenseRecurrence || 'none',
        expenseNextDueDate: editingProperty.expenseNextDueDate ? new Date(editingProperty.expenseNextDueDate).toISOString().split('T')[0] : '',
        expenseReminderEnabled: editingProperty.expenseReminderEnabled || false,
      });
      console.log('🏠 Form data set:', { leaseStartDate, leaseEndDate });
    }
  }, [editingProperty]);

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      purchasePrice: '',
      marketValue: '',
      monthlyRent: '',
      currentRent: 0,
      leaseStartDate: undefined,
      leaseEndDate: undefined,
      leaseRent: '',
      redfinUrl: '',
      rentHistory: [],
      monthlyExpenses: '',
      expenseCategories: [],
      expenseRecurrence: 'none',
      expenseNextDueDate: '',
      expenseReminderEnabled: false,
    });
    onCancel?.();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address || !formData.purchasePrice || !formData.monthlyRent) {
      alert('Please fill in all fields');
      return;
    }

    onSubmit({
      name: formData.name,
      address: formData.address,
      purchasePrice: parseFloat(formData.purchasePrice),
      marketValue: formData.marketValue ? parseFloat(formData.marketValue) : undefined,
      monthlyRent: parseFloat(formData.monthlyRent),
      currentRent: formData.currentRent,
      leaseStartDate: formData.leaseStartDate,
      leaseEndDate: formData.leaseEndDate,
      leaseRent: formData.leaseRent ? parseFloat(formData.leaseRent) : undefined,
      redfinUrl: formData.redfinUrl,
      rentHistory: formData.rentHistory,
      // Add expense tracking data
      monthlyExpenses: formData.monthlyExpenses ? parseFloat(formData.monthlyExpenses) : 0,
      expenseCategories: formData.expenseCategories,
      expenseRecurrence: formData.expenseRecurrence,
      expenseNextDueDate: formData.expenseNextDueDate ? new Date(formData.expenseNextDueDate) : undefined,
      expenseReminderEnabled: formData.expenseReminderEnabled,
    });

    if (!editingProperty) {
      resetForm();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'leaseStartDate' && value ? new Date(value) : value,
      [name]: name === 'leaseEndDate' && value ? new Date(value) : value,
    }));
  };

  return (
    <React.Fragment>
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {editingProperty ? 'Edit Property' : 'Add New Property'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Property Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 123 Main Street"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 123 Main St, City, State 12345"
            />
          </div>

          <div>
            <label htmlFor="leaseStartDate" className="block text-sm font-medium text-gray-700">
              Lease Start Date
            </label>
            <input
              type="date"
              id="leaseStartDate"
              name="leaseStartDate"
              value={formData.leaseStartDate && formData.leaseStartDate instanceof Date ? formData.leaseStartDate.toISOString().split('T')[0] : ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="leaseEndDate" className="block text-sm font-medium text-gray-700">
              Lease End Date
            </label>
            <input
              type="date"
              id="leaseEndDate"
              name="leaseEndDate"
              value={formData.leaseEndDate && formData.leaseEndDate instanceof Date ? formData.leaseEndDate.toISOString().split('T')[0] : ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="leaseRent" className="block text-sm font-medium text-gray-700">
              Lease Rent (Monthly)
            </label>
            <input
              type="number"
              id="leaseRent"
              name="leaseRent"
              value={formData.leaseRent}
              step="0.01"
              min="0"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
            <p className="mt-1 text-xs text-gray-500">The monthly rent amount for this lease period</p>
          </div>

          <div>
            <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700">
              Purchase Price
            </label>
            <input
              type="number"
              id="purchasePrice"
              name="purchasePrice"
              value={formData.purchasePrice}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="250000"
            />
          </div>

          <div>
            <label htmlFor="marketValue" className="block text-sm font-medium text-gray-700">
              Current Market Value
            </label>
            <input
              type="number"
              id="marketValue"
              name="marketValue"
              value={formData.marketValue}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="300000"
            />
            <p className="mt-1 text-xs text-gray-500">Current market value (from Zillow, Redfin, appraisal, etc.)</p>
          </div>

          <div>
            <label htmlFor="redfinUrl" className="block text-sm font-medium text-gray-700">
              Redfin URL
            </label>
            <input
              type="text"
              id="redfinUrl"
              name="redfinUrl"
              value={formData.redfinUrl}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://www.redfin.com/..."
            />
            <p className="mt-1 text-xs text-gray-500">Redfin property URL for automatic market value updates</p>
          </div>

          <div>
            <label htmlFor="monthlyRent" className="block text-sm font-medium text-gray-700">
              Monthly Rent (from rent history)
            </label>
            <input
              type="number"
              id="monthlyRent"
              name="monthlyRent"
              value={formData.monthlyRent}
              step="0.01"
              min="0"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-100"
              placeholder="Managed by rent history"
              readOnly
              title="Monthly rent is automatically calculated from your rent history"
            />
            <p className="mt-1 text-xs text-gray-500">
              Monthly rent is automatically calculated from your most recent rent history entry. Use the rent history section below to manage rates.
            </p>
          </div>

          {/* Expense Tracking Section */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Expense Tracking
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="monthlyExpenses" className="block text-sm font-medium text-gray-700">
                  Monthly Expenses
                </label>
                <input
                  type="number"
                  id="monthlyExpenses"
                  name="monthlyExpenses"
                  value={formData.monthlyExpenses}
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
                <p className="mt-1 text-xs text-gray-500">Total monthly expenses (taxes, insurance, etc.)</p>
              </div>

              <div>
                <label htmlFor="expenseRecurrence" className="block text-sm font-medium text-gray-700">
                  Recurrence
                </label>
                <select
                  id="expenseRecurrence"
                  name="expenseRecurrence"
                  value={formData.expenseRecurrence}
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
                <label htmlFor="expenseNextDueDate" className="block text-sm font-medium text-gray-700">
                  Next Due Date
                </label>
                <input
                  type="date"
                  id="expenseNextDueDate"
                  name="expenseNextDueDate"
                  value={formData.expenseNextDueDate}
                  onChange={handleChange}
                  disabled={formData.expenseRecurrence === 'none'}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="expenseReminderEnabled"
                  name="expenseReminderEnabled"
                  checked={formData.expenseReminderEnabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, expenseReminderEnabled: e.target.checked }))}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="expenseReminderEnabled" className="ml-2 block text-sm font-medium text-gray-700">
                  Enable Payment Reminders
                </label>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            {editingProperty && (
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
              {editingProperty ? (
                <span>Update Property</span>
              ) : (
                <span>Add Property</span>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {editingProperty && (
        <SimpleRateHistory 
          property={editingProperty}
          onRateUpdate={(propertyId, rate, effectiveDate, reason) => {
            console.log('Rate update:', { propertyId, rate, effectiveDate, reason });
            alert(`Rate updated: ${rate} effective ${effectiveDate}`);
          }}
        />
      )}
    </React.Fragment>
  );
};

export default PropertyForm;