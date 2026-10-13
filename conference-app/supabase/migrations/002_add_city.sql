-- ============================================================
-- Migration: 002_add_city
-- Run this in the Supabase SQL Editor
-- Adds 'city' column to registrations table with index
-- ============================================================

-- Add city column (defaulting to 'ahmedabad' for existing registrations)
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT 'ahmedabad';

-- Index on city for filtered queries in admin dashboards and check-ins
CREATE INDEX IF NOT EXISTS registrations_city_idx 
  ON registrations (city);

-- Optional: ensure city is one of the valid cities
-- ALTER TABLE registrations ADD CONSTRAINT check_valid_city CHECK (city IN ('ahmedabad', 'surat', 'rajkot'));
