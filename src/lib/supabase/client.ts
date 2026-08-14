import { createClient as createSupabaseJSClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

/**
 * Factory function expected by pages calling createClient()
 */
export function createClient() {
  return createSupabaseJSClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Singleton instance expected by pages importing { supabase }
 */
export const supabase = createClient();

export default supabase;