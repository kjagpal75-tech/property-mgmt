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
    rentHistory: Property['rentHistory'];
  }>({
    name: '',
    address: '',
    purchasePrice: '',
    marketValue: '',
    monthlyRent: '',
    currentRent: 0,
    leaseStartDate: undefined,
    rentHistory: [],
  });

  React.useEffect(() => {
    if (editingProperty) {
      console.log('🏠 Editing property data:', { id: editingProperty.id, leaseStartDate: editingProperty.leaseStartDate });
      
      // Convert lease start date string to Date object if it exists
      const leaseStartDate = editingProperty.leaseStartDate ? new Date(editingProperty.leaseStartDate) : undefined;
      console.log('🏠 Converted lease start date:', leaseStartDate);
      
      setFormData({
        name: editingProperty.name,
        address: editingProperty.address,
        purchasePrice: editingProperty.purchasePrice.toString(),
        marketValue: editingProperty.marketValue?.toString() || '',
        monthlyRent: editingProperty.monthlyRent.toString(),
        currentRent: editingProperty.currentRent,
        leaseStartDate: leaseStartDate,
        rentHistory: editingProperty.rentHistory || [],
      });
      console.log('🏠 Form data set:', { leaseStartDate });
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
      rentHistory: [],
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
      rentHistory: formData.rentHistory,
    });

    if (!editingProperty) {
      resetForm();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'leaseStartDate' && value ? new Date(value) : value,
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
