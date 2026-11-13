import React, { useState, useEffect } from 'react';
import { Property } from '../types/property';
import { rentHistoryApi } from '../api/api';

interface RentHistory {
  id: string;
  monthlyRate: number;
  effectiveDate: string;
  endDate?: string;
  reason?: string;
  createdAt: string;
  leaseEndDate?: string;
}

interface RentalRateHistoryProps {
  property: Property;
  onRateUpdate: (propertyId: string, rate: number, effectiveDate: string, reason?: string, leaseEndDate?: string) => void;
}

const RentalRateHistory: React.FC<RentalRateHistoryProps> = ({ property, onRateUpdate }) => {
  const [rateHistory, setRateHistory] = useState<RentHistory[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [newRate, setNewRate] = useState({
    monthlyRate: '',
    effectiveDate: '',
    reason: '',
    leaseEndDate: ''
  });
  const [effectiveDate, setEffectiveDate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [editingRate, setEditingRate] = useState<RentHistory | null>(null);

  useEffect(() => {
    const loadRentHistory = async () => {
      try {
        console.log('Loading rent history from database for property:', property.id);
        const token = localStorage.getItem('token');
        const historyData = await rentHistoryApi.getByPropertyId(property.id, token);
        console.log('Loaded rent history from database:', historyData);
        
        if (historyData && historyData.length > 0) {
          const transformedHistory = historyData.map((item: any) => ({
            id: item.id,
            monthlyRate: item.monthly_rate,
            effectiveDate: item.effective_date,
            endDate: item.end_date,
            reason: item.reason,
            createdAt: item.created_at,
            leaseEndDate: item.lease_end_date
          }));
          setRateHistory(transformedHistory);
        } else {
          const sampleHistory: RentHistory[] = [
            {
              id: '1',
              monthlyRate: (property.monthlyRent || 0) * 0.9,
              effectiveDate: '2024-01-01',
              endDate: '2024-12-31',
              reason: 'Initial rate',
              createdAt: '2024-01-01T00:00:00Z',
              leaseEndDate: undefined
            },
            {
              id: '2',
              monthlyRate: (property.monthlyRent || 0),
              effectiveDate: '2025-01-01',
              endDate: undefined,
              reason: 'Current market rate',
              createdAt: '2025-01-01T00:00:00Z',
              leaseEndDate: undefined
            }
          ];
          setRateHistory(sampleHistory);
        }
      } catch (error) {
        console.error('Error loading rent history from database:', error);
        const sampleHistory: RentHistory[] = [
          {
            id: '1',
            monthlyRate: (property.monthlyRent || 0) * 0.9,
            effectiveDate: '2024-01-01',
            endDate: '2024-12-31',
            reason: 'Initial rate',
            createdAt: '2024-01-01T00:00:00Z',
            leaseEndDate: undefined
          },
          {
            id: '2',
            monthlyRate: (property.monthlyRent || 0),
            effectiveDate: '2025-01-01',
            endDate: undefined,
            reason: 'Current market rate',
            createdAt: '2025-01-01T00:00:00Z',
            leaseEndDate: undefined
          }
        ];
        setRateHistory(sampleHistory);
      }
    };

    loadRentHistory();
  }, [property.id, property.monthlyRent]);

  const getCurrentRate = () => {
    if (!rateHistory || rateHistory.length === 0) {
      const fallbackRate = (property.monthlyRent || 0);
      return fallbackRate;
    }
    
    const sortedHistory = [...rateHistory].sort((a, b) => 
      new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
    );
    
    const latestRate = sortedHistory[0];
    return latestRate ? latestRate.monthlyRate : (property.monthlyRent || 0);
  };

  const currentRateValue = getCurrentRate();

  const handleAddRate = async () => {
    if (newRate.monthlyRate && effectiveDate) {
      const rate = parseFloat(newRate.monthlyRate);
      
      try {
        const token = localStorage.getItem('token');
        const result = await rentHistoryApi.add(property.id, rate, effectiveDate, newReason || '', newRate.leaseEndDate, token);
        
        const newEntry = {
          id: result.id,
          monthlyRate: result.monthly_rate,
          effectiveDate: result.effective_date,
          endDate: undefined,
          reason: result.reason,
          createdAt: result.created_at,
          leaseEndDate: result.lease_end_date
        };
        
        // Only expire an existing active rate when the new rate's effective date
        // is LATER than that rate's effective date. Backdating (adding an earlier
        // rate) must NOT expire the more recent active rate.
        const updatedHistory = rateHistory.map(item => {
          if (!item.endDate && new Date(effectiveDate) > new Date(item.effectiveDate)) {
            return { ...item, endDate: effectiveDate };
          }
          return item;
        });
        
        setRateHistory([...updatedHistory, newEntry]);
        
        onRateUpdate(property.id, rate, effectiveDate, newReason || '', newRate.leaseEndDate);
        
        setNewRate({ monthlyRate: '', effectiveDate: '', reason: '', leaseEndDate: '' });
        setEffectiveDate('');
        setNewReason('');
        setShowAddForm(false);
        
        alert('Rate added successfully!');
      } catch (error) {
        console.error('Error adding rent history:', error);
        alert('Failed to add rate. Please try again.');
      }
    }
  };

  const handleEditRate = (rateId: string, newRate: number, newEffectiveDate: string, newReason?: string, newLeaseEndDate?: string) => {
    const formattedDate = newEffectiveDate ? new Date(newEffectiveDate).toISOString().split('T')[0] : '';
    
    setEditingRate({
      id: rateId,
      monthlyRate: newRate,
      effectiveDate: formattedDate,
      reason: newReason,
      createdAt: new Date().toISOString(),
      leaseEndDate: newLeaseEndDate
    });
    setNewRate({ monthlyRate: newRate.toString(), effectiveDate: formattedDate, reason: newReason || '', leaseEndDate: newLeaseEndDate || '' });
    setEffectiveDate(formattedDate);
    setShowEditForm(true);
  };

  const handleSaveEdit = async () => {
    if (editingRate && editingRate.monthlyRate && editingRate.effectiveDate) {
      try {
        const token = localStorage.getItem('token');
        const newEffectiveDate = editingRate.effectiveDate;
        
        const result = await rentHistoryApi.update(property.id, editingRate.id, editingRate.monthlyRate, newEffectiveDate, editingRate.reason, editingRate.leaseEndDate, token);
        
        const updatedHistory = rateHistory.map(item => {
          if (item.id === editingRate.id) {
            return { ...item, monthlyRate: editingRate.monthlyRate, effectiveDate: newEffectiveDate, reason: editingRate.reason, leaseEndDate: editingRate.leaseEndDate, endDate: item.endDate };
          }
          // Only expire an existing active rate when the new effective date
          // is LATER than that rate's effective date. Backdating (editing an earlier
          // rate) must NOT expire the more recent active rate.
          if (!item.endDate && item.id !== editingRate.id && new Date(newEffectiveDate) > new Date(item.effectiveDate)) {
            return { ...item, endDate: newEffectiveDate };
          }
          return item;
        });
        
        setRateHistory(updatedHistory);
        
        setEditingRate(null);
        setNewRate({ monthlyRate: '', effectiveDate: '', reason: '', leaseEndDate: '' });
        setEffectiveDate('');
        setShowEditForm(false);
        
        alert('Rate updated successfully');
      } catch (error) {
        console.error('Error updating rent history:', error);
        alert('Failed to update rate. Please try again.');
      }
    }
  };

  return (
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
                Lease End Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
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
                  {rate.leaseEndDate ? new Date(rate.leaseEndDate).toLocaleDateString() : 'N/A'}
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <button
                    onClick={() => handleEditRate(rate.id, rate.monthlyRate, rate.effectiveDate, rate.reason, rate.leaseEndDate)}
                    className="text-blue-600 hover:text-blue-900 font-medium"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          {showAddForm ? 'Hide Add Rate Form' : 'Add New Rate'}
        </button>
      </div>

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
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lease End Date (Optional)
              </label>
              <input
                type="date"
                value={newRate.leaseEndDate}
                onChange={(e) => setNewRate(prev => ({ ...prev, leaseEndDate: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Lease end date (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (Optional)
              </label>
              <textarea
                rows={3}
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
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
                onClick={handleAddRate}
                disabled={!newRate.monthlyRate || !effectiveDate}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Add Rate
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditForm && editingRate && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 mb-4">Edit Rate</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Rate ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={editingRate?.monthlyRate?.toString() || ''}
                onChange={(e) => setEditingRate(prev => prev ? { ...prev, monthlyRate: parseFloat(e.target.value) } : null)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter monthly rate"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Effective Date
              </label>
              <input
                type="date"
                value={editingRate?.effectiveDate || ''}
                onChange={(e) => setEditingRate(prev => prev ? { ...prev, effectiveDate: e.target.value } : null)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lease End Date (Optional)
              </label>
              <input
                type="date"
                value={editingRate?.leaseEndDate ? new Date(editingRate.leaseEndDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setEditingRate(prev => prev ? { ...prev, leaseEndDate: e.target.value } : null)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Lease end date (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (Optional)
              </label>
              <textarea
                rows={3}
                value={editingRate?.reason || ''}
                onChange={(e) => setEditingRate(prev => prev ? { ...prev, reason: e.target.value } : null)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Reason for rate change (e.g., market adjustment, lease renewal, etc.)"
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setEditingRate(null);
                  setNewRate({ monthlyRate: '', effectiveDate: '', reason: '', leaseEndDate: '' });
                  setEffectiveDate('');
                  setShowEditForm(false);
                }}
                className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editingRate?.monthlyRate || !editingRate?.effectiveDate}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentalRateHistory;
