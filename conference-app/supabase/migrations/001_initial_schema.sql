-- ============================================================
-- Migration: 001_initial_schema
-- Run this in the Supabase SQL Editor (or via Supabase CLI)
-- ============================================================

-- Enable UUID generation (already available on Supabase by default)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------
-- Table: registrations
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS registrations (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL    DEFAULT NOW(),

  -- Attendee info
  company_name  TEXT        NOT NULL,
  visitor_name  TEXT        NOT NULL,
  designation   TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  phone         TEXT        NOT NULL,   -- E.164-ish, used as WhatsApp JID

  -- Attendance code
  code          TEXT        NOT NULL UNIQUE,  -- 6-digit numeric string

  -- Delivery status
  email_sent      BOOLEAN     NOT NULL DEFAULT FALSE,
  whatsapp_sent   BOOLEAN     NOT NULL DEFAULT FALSE,

  -- Check-in status
  attended      BOOLEAN     NOT NULL DEFAULT FALSE,
  attended_at   TIMESTAMPTZ          -- NULL until checked in
);

-- -----------------------------------------------
-- Indexes
-- -----------------------------------------------
-- Unique index on code (attendance code lookups)
CREATE UNIQUE INDEX IF NOT EXISTS registrations_code_unique_idx
  ON registrations (code);

-- Index on phone (WhatsApp sender lookups)
CREATE INDEX IF NOT EXISTS registrations_phone_idx
  ON registrations (phone);

-- Index on email (resend / lookup)
CREATE INDEX IF NOT EXISTS registrations_email_idx
  ON registrations (email);

-- -----------------------------------------------
-- Row Level Security
-- -----------------------------------------------
-- Enable RLS — the service-role key bypasses this automatically.
-- The anon key (used client-side) gets no access by default.
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- No permissive policies for anon role — all writes go through API routes
-- using the service-role key which bypasses RLS.
