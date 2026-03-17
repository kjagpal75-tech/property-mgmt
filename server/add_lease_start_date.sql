-- Migration to add lease start date field
-- Run this to add lease_start_date column to properties table

ALTER TABLE properties ADD COLUMN lease_start_date DATE;

-- Add comment to document the field
COMMENT ON COLUMN properties.lease_start_date IS 'Date when lease started for the property';
