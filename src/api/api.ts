import { Property, Transaction } from '../types/property';
import { debug } from '../utils/debug';

export const API_BASE_URL = 'http://localhost:5000/api';
export const AUTH_BASE_URL = 'http://localhost:5001/api';

// Rent History API
export const rentHistoryApi = {
  getByPropertyId: async (propertyId: string) => {
    const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/rent-history`);
    if (!response.ok) throw new Error('Failed to fetch rent history');
    return response.json();
  },
  
  add: async (propertyId: string, monthlyRate: number, effectiveDate: string, reason?: string) => {
    debug.log('🏠 API add rent history:', { propertyId, monthlyRate, effectiveDate, reason });
    
    const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/rent-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        monthly_rate: monthlyRate,
        effective_date: effectiveDate,
        reason: reason || 'Rate update'
      }),
    });
    if (!response.ok) throw new Error('Failed to add rent history');
    
    const result = await response.json();
    debug.log('✅ API add rent history result:', result);
    return result;
  },
  
  update: async (propertyId: string, rentId: string, monthlyRate: number, effectiveDate: string, reason?: string) => {
    debug.log('🏠 API update rent history:', { propertyId, rentId, monthlyRate, effectiveDate, reason });
    
    const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/rent-history/${rentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        monthly_rate: monthlyRate,
        effective_date: effectiveDate,
        reason: reason || 'Rate update'
      }),
    });
    if (!response.ok) throw new Error('Failed to update rent history');
    
    const result = await response.json();
    debug.log('✅ API update rent history result:', result);
    return result;
  },
  
  delete: async (propertyId: string, rentId: string) => {
    debug.log('🏠 API delete rent history:', { propertyId, rentId });
    
    const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/rent-history/${rentId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete rent history');
    return response.json();
  }
};

// Properties API
export const propertiesApi = {
  getAll: async (token?: string | null): Promise<Property[]> => {
    console.log('🔍 Fetching properties from:', `${API_BASE_URL}/properties`);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/properties`, { headers });
    console.log('🔍 Response status:', response.status);
    if (!response.ok) {
      console.error('❌ Failed to fetch properties:', response.statusText);
      throw new Error('Failed to fetch properties');
    }
    const data = await response.json();
    console.log('🔍 Raw data from backend:', data);
    
    // Server now returns data in correct format, so just return it directly
    const mappedData = data.map((p: any) => ({
      ...p,
      redfinUrl: p.redfin_url || p.redfinUrl, // Handle both naming conventions
      rentHistory: (p.rent_history || []).map((rh: any) => ({
        id: rh.id,
        monthlyRate: rh.monthly_rate,
        effectiveDate: rh.effective_date,
        endDate: rh.end_date,
        reason: rh.reason,
        createdAt: rh.created_at
      }))
    }));
    return mappedData;
  },

  create: async (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>, token?: string | null): Promise<Property> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/properties`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...property,
        purchase_price: property.purchasePrice,
        market_value: property.marketValue,
        monthly_rent: property.monthlyRent,
        current_rent: property.currentRent,
        lease_start_date: property.leaseStartDate,
        redfin_url: property.redfinUrl
      }),
    });
    if (!response.ok) throw new Error('Failed to create property');
    const data = await response.json();
    return {
      ...data,
      purchasePrice: data.purchase_price,
      marketValue: data.market_value,
      monthlyRent: data.monthly_rent,
      currentRent: data.current_rent,
      leaseStartDate: data.lease_start_date,
      redfinUrl: data.redfin_url
    };
  },

  update: async (id: string, property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>, token?: string | null): Promise<Property> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        ...property,
        purchase_price: property.purchasePrice,
        market_value: property.marketValue,
        monthly_rent: property.monthlyRent,
        current_rent: property.currentRent,
        lease_start_date: property.leaseStartDate,
        redfin_url: property.redfinUrl
      }),
    });
    if (!response.ok) throw new Error('Failed to update property');
    const data = await response.json();
    return {
      ...data,
      purchasePrice: data.purchase_price,
      marketValue: data.market_value,
      monthlyRent: data.monthly_rent,
      currentRent: data.current_rent,
      leaseStartDate: data.lease_start_date,
      redfinUrl: data.redfin_url
    };
  },

  delete: async (id: string, token?: string | null) => {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Failed to delete property');
    return response.json();
  }
};

// Transactions API
export const transactionsApi = {
  getAll: async (token?: string | null): Promise<Transaction[]> => {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/transactions`, { headers });
    if (!response.ok) throw new Error('Failed to fetch transactions');
    const data = await response.json();
    return data.map((t: any) => ({
      ...t,
      propertyId: t.property_id,
      date: new Date(t.date),
      amount: parseFloat(t.amount)
    }));
  },

  create: async (transaction: Omit<Transaction, 'id' | 'createdAt'>, token?: string | null): Promise<Transaction> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...transaction,
        property_id: transaction.propertyId,
        amount: transaction.amount.toString()
      }),
    });
    if (!response.ok) throw new Error('Failed to create transaction');
    const data = await response.json();
    return {
      ...data,
      propertyId: data.property_id,
      date: new Date(data.date),
      amount: parseFloat(data.amount)
    };
  },

  update: async (id: string, transaction: Omit<Transaction, 'id' | 'createdAt'>, token?: string | null): Promise<Transaction> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        ...transaction,
        property_id: transaction.propertyId,
        amount: transaction.amount.toString()
      }),
    });
    if (!response.ok) throw new Error('Failed to update transaction');
    const data = await response.json();
    return {
      ...data,
      propertyId: data.property_id,
      date: new Date(data.date),
      amount: parseFloat(data.amount)
    };
  },

  delete: async (id: string, token?: string | null): Promise<void> => {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Failed to delete transaction');
  },
};
