import React, { useState, useEffect, Fragment } from 'react';
import { Property } from '../types/property';
import RentalRateHistory from './RentalRateHistory';

interface PropertyFormProps {
  onSubmit: (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingProperty?: Property;
  onCancel?: () => void;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ onSubmit, editingProperty, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    purchasePrice: '',
    monthlyRent: '',
  });

  React.useEffect(() => {
    if (editingProperty) {
      setFormData({
        name: editingProperty.name,
        address: editingProperty.address,
        purchasePrice: editingProperty.purchasePrice.toString(),
        monthlyRent: editingProperty.monthlyRent.toString(),
      });
    }
  }, [editingProperty]);

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      purchasePrice: '',
      monthlyRent: '',
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
      monthlyRent: parseFloat(formData.monthlyRent),
    });

    if (!editingProperty) {
      resetForm();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
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
          <label htmlFor="monthlyRent" className="block text-sm font-medium text-gray-700">
            Monthly Rent
          </label>
          <input
            type="number"
            id="monthlyRent"
            name="monthlyRent"
            value={formData.monthlyRent}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="2000"
          />
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
  );
};

export default PropertyForm;
