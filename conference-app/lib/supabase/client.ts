// lib/supabase/client.ts
// Anon (public) Supabase client — safe to use in client components.
// This key only has the permissions your RLS policies allow.
// All writes go through server-side API routes using the service-role client.

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
