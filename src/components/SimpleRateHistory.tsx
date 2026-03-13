import React, { useState, useEffect } from 'react';
import { Property } from '../types/property';
import { rentHistoryApi } from '../api/api';

interface SimpleRateHistoryProps {
  property: Property;
  onRateUpdate: (propertyId: string, rate: number, effectiveDate: string, reason?: string) => void;
}

interface RateEntry {
  id: string;
  monthlyRate: number;
  effectiveDate: string;
  endDate?: string;
  reason?: string;
  createdAt: string;
}

const SimpleRateHistory: React.FC<SimpleRateHistoryProps> = ({ property, onRateUpdate }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [newRate, setNewRate] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [editingRate, setEditingRate] = useState<RateEntry | null>(null);
  const [rateHistory, setRateHistory] = useState<RateEntry[]>([]);

  useEffect(() => {
    // Load rent history from database
    const loadRentHistory = async () => {
      try {
        console.log('Loading rent history from database for property:', property.id);
        const historyData = await rentHistoryApi.getByPropertyId(property.id);
        console.log('Loaded rent history from database:', historyData);
        
        if (historyData && historyData.length > 0) {
          // Transform database data to component format
          const transformedHistory = historyData.map((item: any) => ({
            id: item.id,
            monthlyRate: item.monthly_rate,
            effectiveDate: item.effective_date,
            endDate: item.end_date,
            reason: item.reason,
            createdAt: item.created_at
          }));
          console.log('Transformed rent history:', transformedHistory);
          setRateHistory(transformedHistory);
        } else {
          console.log('No rent history found in database, creating sample data');
          // Create sample historical data for demonstration
          const sampleHistory: RateEntry[] = [
            {
              id: '1',
              monthlyRate: (property.monthlyRent || 0) * 0.9, // 10% less
              effectiveDate: '2024-01-01',
              endDate: '2024-12-31',
              reason: 'Initial rate',
              createdAt: '2024-01-01T00:00:00Z'
            },
            {
              id: '2',
              monthlyRate: (property.monthlyRent || 0), // Current rate
              effectiveDate: '2025-01-01',
              endDate: undefined,
              reason: 'Current market rate',
              createdAt: '2025-01-01T00:00:00Z'
            }
          ];
          setRateHistory(sampleHistory);
        }
      } catch (error) {
        console.error('Error loading rent history from database:', error);
        // Fallback to sample data
        const sampleHistory: RateEntry[] = [
          {
            id: '1',
            monthlyRate: (property.monthlyRent || 0) * 0.9,
            effectiveDate: '2024-01-01',
            endDate: '2024-12-31',
            reason: 'Initial rate',
            createdAt: '2024-01-01T00:00:00Z'
          },
          {
            id: '2',
            monthlyRate: (property.monthlyRent || 0),
            effectiveDate: '2025-01-01',
            endDate: undefined,
            reason: 'Current market rate',
            createdAt: '2025-01-01T00:00:00Z'
          }
        ];
        setRateHistory(sampleHistory);
      }
    };

    loadRentHistory();
  }, [property.id, property.monthlyRent]);

  // Calculate current rate based on latest effective date
  const getCurrentRate = () => {
    console.log('getCurrentRate called, rateHistory:', rateHistory);
    console.log('rateHistory types:', rateHistory.map(r => ({ id: typeof r.id, monthlyRate: typeof r.monthlyRate, effectiveDate: typeof r.effectiveDate })));
    
    if (!rateHistory || rateHistory.length === 0) {
      const fallbackRate = (property.monthlyRent || 0);
      console.log('Using fallback rate:', fallbackRate, 'type:', typeof fallbackRate);
      return fallbackRate;
    }
    
    // Find the rate with the latest effective date
    const sortedHistory = [...rateHistory].sort((a, b) => 
      new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
    );
    
    const latestRate = sortedHistory[sortedHistory.length - 1];
    console.log('Latest rate found:', latestRate, 'type:', typeof latestRate?.monthlyRate);
    return latestRate ? latestRate.monthlyRate : (property.monthlyRent || 0);
  };

  const handleAddRate = async () => {
    console.log('handleAddRate called with:', { newRate, effectiveDate });
    console.log('Original effectiveDate value:', effectiveDate);
    console.log('effectiveDate type:', typeof effectiveDate);
    console.log('effectiveDate length:', effectiveDate.length);
    
    if (newRate && effectiveDate) {
      const rate = parseFloat(newRate);
      
      try {
        console.log('Calling rentHistoryApi.add with:', { propertyId: property.id, rate, effectiveDate, reason: 'Rate update' });
        
        // Call the actual API to add rent history
        const result = await rentHistoryApi.add(property.id, rate, effectiveDate, 'Rate update');
        console.log('API result:', result);
        
        // Update local state with the result
        const newEntry = {
          id: result.id,
          monthlyRate: result.monthly_rate,
          effectiveDate: result.effective_date,
          endDate: undefined,
          reason: result.reason,
          createdAt: result.created_at
        };
        console.log('Creating new entry:', newEntry);
        console.log('newEntry.effectiveDate:', newEntry.effectiveDate);
        console.log('newEntry.effectiveDate type:', typeof newEntry.effectiveDate);
        
        // Find the current active rate (the one without endDate) and set its endDate to the new effective date
        const updatedHistory = rateHistory.map(item => {
          if (!item.endDate) {
            console.log('Setting end date on current rate:', { id: item.id, endDate: effectiveDate });
            return { ...item, endDate: effectiveDate };
          }
          return item;
        });
        
        console.log('Updated history before setting:', updatedHistory);
        console.log('About to setRateHistory with:', [...updatedHistory, newEntry]);
        setRateHistory([...updatedHistory, newEntry]);
        console.log('Rate history updated successfully');
        
        // Call the onRateUpdate callback for backward compatibility
        onRateUpdate(property.id, rate, effectiveDate, 'Rate update');
        
        setNewRate('');
        setEffectiveDate('');
        setShowAddForm(false);
        
        alert('Rate added successfully!');
      } catch (error) {
        console.error('Error adding rent history:', error);
        alert('Failed to add rate. Please try again.');
      }
    }
  };

  const handleEditRate = (rateId: string, newRate: number, newEffectiveDate: string, newReason?: string) => {
    setEditingRate({
      id: rateId,
      monthlyRate: newRate,
      effectiveDate: newEffectiveDate,
      reason: newReason,
      createdAt: new Date().toISOString()
    });
    setNewRate(newRate.toString());
    setEffectiveDate(newEffectiveDate);
    setShowEditForm(true);
  };

  const handleSaveEdit = () => {
    if (editingRate && newRate && effectiveDate) {
      const updatedHistory = rateHistory.map(item => 
        item.id === editingRate.id ? { ...item, monthlyRate: parseFloat(newRate), effectiveDate: effectiveDate, reason: editingRate.reason } : item
      );
      setRateHistory(updatedHistory);
      setEditingRate(null);
      setNewRate('');
      setEffectiveDate('');
      setShowEditForm(false);
      alert('Rate updated successfully');
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Rental Rate History</h3>
      
      {/* Historical Rates Table */}
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
                  ${typeof rate.monthlyRate === 'number' ? rate.monthlyRate.toFixed(2) : parseFloat(rate.monthlyRate).toFixed(2)}
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditRate(rate.id, rate.monthlyRate, rate.effectiveDate, rate.reason)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        // Custom confirmation dialog
                        const shouldDelete = window.confirm('Are you sure you want to delete this rate? This action cannot be undone.');
                        if (shouldDelete) {
                          const updatedHistory = rateHistory.filter(item => item.id !== rate.id);
                          setRateHistory(updatedHistory);
                          alert('Rate deleted successfully');
                        }
                      }}
                      className="text-red-600 hover:text-red-800 text-xs font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add New Rate Button */}
      <div className="mt-6">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
        >
          {showAddForm ? 'Cancel' : 'Add New Rate'}
        </button>

        {/* Add New Rate Form */}
        {showAddForm && (
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">Add New Rate</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Monthly Rate ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
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
                    setNewRate('');
                    setEffectiveDate('');
                    setShowAddForm(false);
                  }}
                  className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRate}
                  disabled={!newRate || !effectiveDate}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Add Rate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Rate Form */}
        {showEditForm && editingRate && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">Edit Rate</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Rate ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
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
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                    setNewRate('');
                    setEffectiveDate('');
                    setShowEditForm(false);
                  }}
                  className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!newRate || !effectiveDate}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleRateHistory;
