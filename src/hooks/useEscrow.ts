'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export type EscrowActionType = 'lock' | 'settle' | 'refund';

export interface UseEscrowReturn {
  lockEscrow: (dealId: string) => Promise<boolean>;
  settleEscrow: (dealId: string) => Promise<boolean>;
  refundEscrow: (dealId: string) => Promise<boolean>;
  activeAction: EscrowActionType | null;
  isPending: boolean;
  error: string | null;
  clearError: () => void;
}

export function useEscrow(): UseEscrowReturn {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<EscrowActionType | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Client-side Supabase instance tied to active user browser cookies/JWT
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  const executeRpc = async (
    rpcName: 'lock_deal_escrow' | 'settle_deal_escrow' | 'refund_deal_escrow',
    actionType: EscrowActionType,
    dealId: string
  ): Promise<boolean> => {
    setActiveAction(actionType);
    setError(null);

    try {
      // 1. Invoke PostgreSQL RPC function with caller's auth.uid() context
      const { error: rpcError } = await supabase.rpc(rpcName, {
        p_deal_id: dealId,
      });

      if (rpcError) throw rpcError;

      // 2. Refresh Next.js Server Components without a full page reload
      startTransition(() => {
        router.refresh();
      });

      return true;
    } catch (err: unknown) {
      console.error(`Escrow operation [${actionType}] failed:`, err);
      const message =
        err instanceof Error ? err.message : `Failed to execute ${actionType} action.`;
      setError(message);
      return false;
    } finally {
      setActiveAction(null);
    }
  };

  const lockEscrow = (dealId: string) => executeRpc('lock_deal_escrow', 'lock', dealId);
  const settleEscrow = (dealId: string) => executeRpc('settle_deal_escrow', 'settle', dealId);
  const refundEscrow = (dealId: string) => executeRpc('refund_deal_escrow', 'refund', dealId);

  const clearError = () => setError(null);

  return {
    lockEscrow,
    settleEscrow,
    refundEscrow,
    activeAction,
    isPending,
    error,
    clearError,
  };
}