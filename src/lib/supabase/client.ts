'use client';

import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return client;
}

type SupabaseClientInstance = ReturnType<typeof createClient>;

// Lazy proxy for legacy code importing `{ supabase }`
export const supabase = new Proxy({} as SupabaseClientInstance, {
  get(_target, prop: string | symbol) {
    const instance = createClient();
    const key = prop as keyof SupabaseClientInstance;
    const value = instance[key];

    return typeof value === 'function' ? value.bind(instance) : value;
  },
});