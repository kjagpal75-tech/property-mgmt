-- Restore Properties Data
INSERT INTO properties (id, name, address, purchase_price, market_value, monthly_rent, lease_start_date, redfin_url, created_at, updated_at) VALUES
('ced72e7a-3931-4ef5-9197-bc62e64bc835', 'Fremont Rental', '37391 Mission Blvd, Fremont, CA 94536', 1090000.00, 1410383.00, 4200.00, '2023-01-01', 'https://www.redfin.com/CA/Fremont/37391-Mission-Blvd-94536/home/1211252', NOW(), NOW()),
('a4759fe1-a3ea-48df-a800-992da31c2ff8', 'Reno Rental', '3643 Ruidoso St, Reno, NV 89512', 750000.00, 879287.00, 3500.00, '2023-01-01', 'https://www.redfin.com/NV/Reno/3643-Ruidoso-St-89512/home/170475319', NOW(), NOW()),
('alameda-rental-id', 'Alameda Rental', '1234 Main St, Alameda, CA 94501', 800000.00, 494345.00, 3200.00, '2023-01-01', 'https://www.redfin.com/CA/Alameda/1234-Main-St/home/123456', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  purchase_price = EXCLUDED.purchase_price,
  market_value = EXCLUDED.market_value,
  monthly_rent = EXCLUDED.monthly_rent,
  lease_start_date = EXCLUDED.lease_start_date,
  redfin_url = EXCLUDED.redfin_url,
  updated_at = NOW();
