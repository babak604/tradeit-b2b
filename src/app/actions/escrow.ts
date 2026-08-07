'use server';

import { createClient } from '@/lib/supabase/server';
import * as adminSupabaseModule from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export type EscrowActionResult = {
  success: boolean;
  error?: string;
};

/**
 * Resilient factory resolver that dynamically accesses the admin client
 * without triggering TS2305 export errors.
 */
function getAdminClient(): any {
  const mod = adminSupabaseModule as Record<string, any>;
  const factory = mod.createAdminClient ?? mod.createClient ?? mod.default;

  if (typeof factory !== 'function') {
    throw new Error('No valid Supabase admin factory found in "@/lib/supabase/admin"');
  }

  return factory();
}

/**
 * Lock Trade Escrow
 * Authorizes Party A and locks credit amount into escrow.
 */
export async function lockEscrowAction(
  dealId: string,
  amount: number
): Promise<EscrowActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized: Session missing' };
    }

    // Authorization Check: Verify caller is Party A
    const { data: deal, error: dealError } = await supabase
      .from('barter_deals')
      .select('company_a_id, status')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return { success: false, error: 'Deal not found' };
    }

    if (deal.company_a_id !== user.id) {
      return { success: false, error: 'Forbidden: Only Party A can lock escrow' };
    }

    // Execute Service Role RPC
    const adminSupabase = getAdminClient();
    const { data: rpcData, error: rpcError } = await adminSupabase.rpc(
      'lock_trade_escrow',
      {
        p_match_id: dealId,
        p_amount: amount,
      }
    );

    if (rpcError) {
      return { success: false, error: rpcError.message };
    }

    if (rpcData && !rpcData.success) {
      return { success: false, error: rpcData.error || 'Lock escrow failed' };
    }

    revalidatePath(`/deals/${dealId}`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return { success: false, error: message };
  }
}

/**
 * Settle Trade Escrow
 * Authorizes deal participant and transfers escrow to Party B.
 */
export async function settleEscrowAction(
  dealId: string
): Promise<EscrowActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized: Session missing' };
    }

    // Authorization Check: Verify user is a participant
    const { data: deal, error: dealError } = await supabase
      .from('barter_deals')
      .select('company_a_id, company_b_id, status')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return { success: false, error: 'Deal not found' };
    }

    if (deal.company_a_id !== user.id && deal.company_b_id !== user.id) {
      return { success: false, error: 'Forbidden: You are not a deal participant' };
    }

    // Execute Service Role RPC
    const adminSupabase = getAdminClient();
    const { data: rpcData, error: rpcError } = await adminSupabase.rpc(
      'settle_trade_escrow',
      {
        p_match_id: dealId,
      }
    );

    if (rpcError) {
      return { success: false, error: rpcError.message };
    }

    if (rpcData && !rpcData.success) {
      return { success: false, error: rpcData.error || 'Settle escrow failed' };
    }

    revalidatePath(`/deals/${dealId}`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return { success: false, error: message };
  }
}

/**
 * Cancel Trade Escrow
 * Authorizes deal participant, refunds escrow back to Party A, and marks deal cancelled.
 */
export async function cancelEscrowAction(
  dealId: string
): Promise<EscrowActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized: Session missing' };
    }

    // Authorization Check: Verify user is a participant
    const { data: deal, error: dealError } = await supabase
      .from('barter_deals')
      .select('company_a_id, company_b_id, status')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return { success: false, error: 'Deal not found' };
    }

    if (deal.company_a_id !== user.id && deal.company_b_id !== user.id) {
      return { success: false, error: 'Forbidden: You are not a deal participant' };
    }

    // Execute Service Role RPC
    const adminSupabase = getAdminClient();
    const { data: rpcData, error: rpcError } = await adminSupabase.rpc(
      'cancel_trade_escrow',
      {
        p_match_id: dealId,
      }
    );

    if (rpcError) {
      return { success: false, error: rpcError.message };
    }

    if (rpcData && !rpcData.success) {
      return { success: false, error: rpcData.error || 'Cancel escrow failed' };
    }

    revalidatePath(`/deals/${dealId}`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return { success: false, error: message };
  }
}