import { Property, Transaction } from '../types/property';

const API_BASE_URL = 'http://localhost:5000/api';

// Rent History API
export const rentHistoryApi = {
  getByPropertyId: async (propertyId: string) => {
    const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/rent-history`);
    if (!response.ok) throw new Error('Failed to fetch rent history');
    return response.json();
  },
  
  add: async (propertyId: string, monthlyRate: number, effectiveDate: string, reason?: string) => {
    console.log('Adding rent history via API:', { propertyId, monthlyRate, effectiveDate, reason });
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
    return response.json();
  },
  
  update: async (propertyId: string, rentId: string, monthlyRate: number, effectiveDate: string, reason?: string) => {
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
    return response.json();
  },
  
  delete: async (propertyId: string, rentId: string) => {
    const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/rent-history/${rentId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete rent history');
    return response.json();
  }
};

// Properties API
export const propertiesApi = {
  getAll: async (): Promise<Property[]> => {
    const response = await fetch(`${API_BASE_URL}/properties`);
    if (!response.ok) throw new Error('Failed to fetch properties');
    const data = await response.json();
    return data.map((p: any) => ({
      ...p,
      purchasePrice: p.purchase_price,
      monthlyRent: p.monthly_rent,
      currentRent: p.current_rent || p.monthly_rent,
      rentHistory: (p.rent_history || []).map((rh: any) => ({
        id: rh.id,
        monthlyRate: rh.monthly_rate,
        effectiveDate: rh.effective_date,
        endDate: rh.end_date,
        reason: rh.reason,
        createdAt: rh.created_at
      })),
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }));
  },

  create: async (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<Property> => {
    const response = await fetch(`${API_BASE_URL}/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...property,
        purchase_price: property.purchasePrice,
        monthly_rent: property.monthlyRent,
        current_rent: property.currentRent || property.monthlyRent,
        rent_history: property.rentHistory || [],
      }),
    });
    if (!response.ok) throw new Error('Failed to create property');
    const data = await response.json();
    return {
      ...data,
      purchasePrice: data.purchase_price,
      monthlyRent: data.monthly_rent,
      currentRent: data.current_rent || data.monthly_rent,
      rentHistory: data.rent_history || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  update: async (id: string, property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<Property> => {
    const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...property,
        purchase_price: property.purchasePrice,
        monthly_rent: property.monthlyRent,
        current_rent: property.currentRent || property.monthlyRent,
        rent_history: property.rentHistory || [],
      }),
    });
    if (!response.ok) throw new Error('Failed to update property');
    const data = await response.json();
    return {
      ...data,
      purchasePrice: data.purchase_price,
      monthlyRent: data.monthly_rent,
      currentRent: data.current_rent || data.monthly_rent,
      rentHistory: data.rent_history || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete property');
  },
};

// Transactions API
export const transactionsApi = {
  getAll: async (): Promise<Transaction[]> => {
    const response = await fetch(`${API_BASE_URL}/transactions`);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    const data = await response.json();
    return data.map((t: any) => ({
      ...t,
      propertyId: t.property_id,
      createdAt: t.created_at,
      date: new Date(t.date)
    }));
  },

  create: async (transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> => {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...transaction,
        property_id: transaction.propertyId,
        date: transaction.date.toISOString().split('T')[0],
      }),
    });
    if (!response.ok) throw new Error('Failed to create transaction');
    const data = await response.json();
    return {
      ...data,
      propertyId: data.property_id,
      createdAt: data.created_at,
      date: new Date(data.date)
    };
  },

  update: async (id: string, transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> => {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...transaction,
        property_id: transaction.propertyId,
        date: transaction.date.toISOString().split('T')[0],
      }),
    });
    if (!response.ok) throw new Error('Failed to update transaction');
    const data = await response.json();
    return {
      ...data,
      propertyId: data.property_id,
      createdAt: data.created_at,
      date: new Date(data.date)
    };
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete transaction');
  },
};
