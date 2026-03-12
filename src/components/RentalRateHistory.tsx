import React, { useState, useEffect } from 'react';
import { Property } from '../types/property';

interface RentalRateHistory {
  id: string;
  propertyId: string;
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
  const [rateHistory, setRateHistory] = useState<RentalRateHistory[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    // Mock data for demonstration
    const mockHistory: RentalRateHistory[] = [
      {
        id: '1',
        propertyId: property.id,
        monthlyRate: 2100,
        effectiveDate: '2024-01-01',
        endDate: '2024-06-30',
        reason: 'Annual lease renewal - market rate increase',
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        propertyId: property.id,
        monthlyRate: 2300,
        effectiveDate: '2024-07-01',
        endDate: '2025-06-30',
        reason: 'Market adjustment - increased demand in area',
        createdAt: '2024-07-01T00:00:00Z'
      },
      {
        id: '3',
        propertyId: property.id,
        monthlyRate: 2500,
        effectiveDate: '2025-07-01',
        endDate: undefined,
        reason: 'New lease agreement - updated market rate',
        createdAt: '2025-07-01T00:00:00Z'
      }
    ];
    setRateHistory(mockHistory);
  }, [property.id]);

  const getCurrentRate = () => {
    const currentRate = rateHistory.find(rate => !rate.endDate);
    return currentRate ? currentRate.monthlyRate : 0;
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Rental Rate History</h3>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-blue-800">Current Monthly Rate</h4>
          <span className="text-2xl font-bold text-blue-900">
            ${getCurrentRate().toFixed(2)}
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
    </div>
  );
};

export default RentalRateHistory;
