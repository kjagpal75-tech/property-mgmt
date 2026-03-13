import React, { useState, useEffect } from 'react';
import { Property } from '../types/property';

interface RentHistory {
  id: string;
  monthlyRate: number;
  effectiveDate: string;
  endDate?: string;
  reason?: string;
  createdAt: string;
}

interface RentalRateHistoryProps {
  property: Property;
  onRateUpdate: (propertyId: string, rate: number, effectiveDate: string, reason?: string) => void;
}

const RentalRateHistory: React.FC<RentalRateHistoryProps> = ({ property, onRateUpdate }) => {
  const [rateHistory, setRateHistory] = useState<RentHistory[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRate, setNewRate] = useState({
    monthlyRate: '',
    effectiveDate: '',
    reason: ''
  });

  useEffect(() => {
    // Use property's rentHistory if available, otherwise show minimal data
    if (property.rentHistory && property.rentHistory.length > 0) {
      setRateHistory(property.rentHistory);
    } else {
      // Create initial entry with current rent if no history exists
      const initialHistory: RentHistory[] = [
        {
          id: '1',
          monthlyRate: property.currentRent || property.monthlyRent,
          effectiveDate: new Date().toISOString().split('T')[0], // Today
          endDate: undefined,
          reason: 'Current rate',
          createdAt: new Date().toISOString()
        }
      ];
      setRateHistory(initialHistory);
    }
  }, [property.rentHistory, property.currentRent, property.monthlyRent, property.id]);

  const getCurrentRate = () => {
    console.log('getCurrentRate called, rateHistory:', rateHistory);
    console.log('property.currentRent:', property.currentRent);
    console.log('property.monthlyRent:', property.monthlyRent);
    
    if (!rateHistory || rateHistory.length === 0) {
      const fallbackRate = property.currentRent || property.monthlyRent || 0;
      console.log('Using fallback rate:', fallbackRate);
      return fallbackRate;
    }
    const currentRate = rateHistory.find(rate => !rate.endDate);
    const result = currentRate ? currentRate.monthlyRate : property.currentRent || property.monthlyRent || 0;
    console.log('Found current rate:', result);
    return result;
  };

  const currentRateValue = getCurrentRate();

  return (
    <React.Fragment>
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Rental Rate History</h3>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-blue-800">Current Monthly Rate</h4>
            <span className="text-2xl font-bold text-blue-900">
              ${currentRateValue.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Effective Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monthly Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rateHistory.map((rate) => (
                <tr key={rate.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(rate.effectiveDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${rate.monthlyRate.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rate.endDate ? new Date(rate.endDate).toLocaleDateString() : 'Current'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rate.reason || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      !rate.endDate 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {!rate.endDate ? 'Active' : 'Expired'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add New Rate Button */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            {showAddForm ? 'Hide Add Rate Form' : 'Add New Rate'}
          </button>
        </div>

        {/* Add New Rate Form */}
        {showAddForm && (
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">Add New Rate</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Monthly Rate ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newRate.monthlyRate}
                  onChange={(e) => setNewRate(prev => ({ ...prev, monthlyRate: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter new monthly rate"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Effective Date
                </label>
                <input
                  type="date"
                  value={newRate.effectiveDate}
                  onChange={(e) => setNewRate(prev => ({ ...prev, effectiveDate: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (Optional)
                </label>
                <textarea
                  rows={3}
                  value={newRate.reason}
                  onChange={(e) => setNewRate(prev => ({ ...prev, reason: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Reason for rate change (e.g., market adjustment, lease renewal, etc.)"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (newRate.monthlyRate && newRate.effectiveDate) {
                      const rate = parseFloat(newRate.monthlyRate);
                      onRateUpdate(property.id, rate, newRate.effectiveDate, newRate.reason);
                      setNewRate({ monthlyRate: '', effectiveDate: '', reason: '' });
                      setShowAddForm(false);
                    }
                  }}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Add Rate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </React.Fragment>
  );
};

export default RentalRateHistory;
