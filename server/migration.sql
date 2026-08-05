-- Migration script to add current_rent and rent_history to existing properties
-- Run this to update existing properties with the new fields

-- Update existing properties to set current_rent = monthly_rent if it's NULL
UPDATE properties 
SET current_rent = monthly_rent 
WHERE current_rent IS NULL;

-- Add some sample rent history for existing properties
INSERT INTO rental_rate_history (id, property_id, monthly_rate, effective_date, end_date, reason, created_at, updated_at)
SELECT 
    gen_random_uuid() as id,
    p.id as property_id,
    p.monthly_rent as monthly_rate,
    CURRENT_DATE - INTERVAL '6 months' as effective_date,
    CURRENT_DATE - INTERVAL '1 month' as end_date,
    'Initial rate setup' as reason,
    CURRENT_TIMESTAMP as created_at,
    CURRENT_TIMESTAMP as updated_at
FROM properties p 
WHERE p.id NOT IN (
    SELECT DISTINCT property_id FROM rental_rate_history
    EXCEPT 
    SELECT id FROM properties
)
LIMIT 1;

COMMIT;
