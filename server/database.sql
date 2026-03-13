-- Create database (run this separately in psql)
-- CREATE DATABASE property_mgmt;

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    purchase_price DECIMAL(12,2) NOT NULL,
    monthly_rent DECIMAL(10,2) NOT NULL,
    current_rent DECIMAL(10,2) NOT NULL DEFAULT monthly_rent,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(50) PRIMARY KEY,
    property_id VARCHAR(50) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_property_id ON transactions(property_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Rental rate history table
CREATE TABLE IF NOT EXISTS rental_rate_history (
    id VARCHAR(50) PRIMARY KEY,
    property_id VARCHAR(50) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    monthly_rate DECIMAL(10,2) NOT NULL,
    effective_date DATE NOT NULL,
    end_date DATE, -- NULL if current rate
    reason TEXT, -- Optional reason for rate change
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for rental rate history
CREATE INDEX IF NOT EXISTS idx_rental_rate_history_property_id ON rental_rate_history(property_id);
CREATE INDEX IF NOT EXISTS idx_rental_rate_history_dates ON rental_rate_history(effective_date, end_date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_properties_updated_at 
    BEFORE UPDATE ON properties 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
