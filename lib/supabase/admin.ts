import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client configured with the Service Role Key.
 * Bypasses Row-Level Security (RLS) to invoke restricted RPCs or perform admin operations.
 * MUST only be imported inside Server Actions or Server Components.
 */
export function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase admin environment variables: Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}