'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * 1. LOCK ESCROW CREDITS
 */
export async function lockTradeEscrowAction(matchId: string, creditValue: number) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized session.' };
  }

  try {
    const { data, error } = await supabase.rpc('lock_trade_escrow', {
      p_match_id: matchId,
      p_amount: creditValue,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (typeof data === 'object' && data !== null && 'success' in data) {
      const resultObj = data as { success?: boolean; error?: string };
      if (!resultObj.success) {
        return { success: false, error: resultObj.error || 'Failed to lock escrow.' };
      }
    }

    return { success: true, data };
  } catch (err: unknown) {
    console.error('lockTradeEscrowAction exception:', err);
    return { success: false, error: 'Internal server error while locking escrow.' };
  }
}

/**
 * 2. SETTLE ESCROW CREDITS
 */
export async function settleTradeEscrowAction(matchId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized session.' };
  }

  try {
    const { data, error } = await supabase.rpc('settle_trade_escrow', {
      p_match_id: matchId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (typeof data === 'object' && data !== null && 'success' in data) {
      const resultObj = data as { success?: boolean; error?: string };
      if (!resultObj.success) {
        return { success: false, error: resultObj.error || 'Failed to settle escrow.' };
      }
    }

    return { success: true, data };
  } catch (err: unknown) {
    console.error('settleTradeEscrowAction exception:', err);
    return { success: false, error: 'Internal server error while settling escrow.' };
  }
}

/**
 * 3. CANCEL ESCROW & REFUND CREDITS
 */
export async function cancelTradeEscrowAction(matchId: string, creditValue: number) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized session.' };
  }

  try {
    const { data, error } = await supabase.rpc('cancel_trade_escrow', {
      p_match_id: matchId,
      p_amount: creditValue,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (typeof data === 'object' && data !== null && 'success' in data) {
      const resultObj = data as { success?: boolean; error?: string };
      if (!resultObj.success) {
        return { success: false, error: resultObj.error || 'Cancellation failed.' };
      }
    }

    return { success: true, data };
  } catch (err: unknown) {
    console.error('cancelTradeEscrowAction exception:', err);
    return { success: false, error: 'Internal server error while cancelling escrow.' };
  }
}