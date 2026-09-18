// lib/supabase/server.ts
// Service-role Supabase client — SERVER ONLY.
// Import this ONLY in API routes and Server Components.
// Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.

import { createClient } from '@supabase/supabase-js';

// A new client instance per call (fine for serverless / edge functions).
// We intentionally omit the Database generic here so that query results don't
// infer as `never` — we cast results to the Registration type at the call site.
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

