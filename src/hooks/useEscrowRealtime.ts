'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function useEscrowRealtime(dealId: string) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to changes on the specific deal row
    const channel = supabase
      .channel(`deal_escrow:${dealId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'barter_deals',
          filter: `id=eq.${dealId}`,
        },
        (payload) => {
          // Re-evaluate Next.js Server Components with fresh DB state
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId, router]);
}