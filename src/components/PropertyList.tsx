import React from 'react';
import { Property } from '../types/property';
import { formatCurrency } from '../utils/dataUtils';

interface PropertyListProps {
  properties: Property[];
  onEdit: (property: Property) => void;
  onDelete: (id: string) => void;
}

const PropertyList: React.FC<PropertyListProps> = ({ properties, onEdit, onDelete }) => {
  const handleDelete = (id: string, propertyName: string) => {
    if (window.confirm(`Are you sure you want to delete "${propertyName}"? This will also delete all associated transactions.`)) {
      onDelete(id);
    }
  };
  if (properties.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500 text-center">No properties added yet. Add your first property above!</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Your Properties</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {properties.map((property) => (
          <div
            key={property.id}
            className="px-6 py-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{property.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{property.address}</p>
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Purchase Price:</span>
                    <span className="ml-2 font-medium">{formatCurrency(property.purchasePrice)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Monthly Rent:</span>
                    <span className="ml-2 font-medium text-green-600">{formatCurrency(property.monthlyRent)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Market Value:</span>
                    <span className="ml-2 font-medium text-blue-600">
                      {property.redfinMarketValue ? formatCurrency(property.redfinMarketValue) : 'Loading...'}
                    </span>
                  </div>
                  {property.redfinConfidence && (
                    <div>
                      <span className="text-gray-500">Confidence:</span>
                      <span className="ml-2 font-medium text-purple-600">
                        {(property.redfinConfidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                  {property.redfinBedrooms && (
                    <div>
                      <span className="text-gray-500">Bedrooms:</span>
                      <span className="ml-2 font-medium text-indigo-600">
                        {property.redfinBedrooms}
                      </span>
                    </div>
                  )}
                  {property.redfinBathrooms && (
                    <div>
                      <span className="text-gray-500">Bathrooms:</span>
                      <span className="ml-2 font-medium text-indigo-600">
                        {property.redfinBathrooms}
                      </span>
                    </div>
                  )}
                  {property.redfinSquareFootage && (
                    <div>
                      <span className="text-gray-500">Square Feet:</span>
                      <span className="ml-2 font-medium text-indigo-600">
                        {property.redfinSquareFootage?.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {property.redfinYearBuilt && (
                    <div>
                      <span className="text-gray-500">Year Built:</span>
                      <span className="ml-2 font-medium text-indigo-600">
                        {property.redfinYearBuilt}
                      </span>
                    </div>
                  )}
                  {property.redfinPropertyType && (
                    <div>
                      <span className="text-gray-500">Property Type:</span>
                      <span className="ml-2 font-medium text-indigo-600">
                        {property.redfinPropertyType}
                      </span>
                    </div>
                  )}
                  {property.redfinStatus && (
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className="ml-2 font-medium text-indigo-600">
                        {property.redfinStatus}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => onEdit(property)}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(property.id, property.name)}
                  className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyList;
