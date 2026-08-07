'use server';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface CreditSummary {
  availableBalance: number;
  escrowLocked: number;
}

export async function getUserCreditSummary(
  userId: string
): Promise<{ success: boolean; data?: CreditSummary; error?: string }> {
  try {
    // 1. Fetch available credit balance
    const { data: balanceData, error: balanceError } = await supabase
      .from('trade_credit_balances')
      .select('balance_usd')
      .eq('company_id', userId)
      .maybeSingle();

    if (balanceError) throw balanceError;

    // 2. Fetch total active escrow locked as payer
    const { data: escrowData, error: escrowError } = await supabase
      .from('escrow_holds')
      .select('amount_usd')
      .eq('payer_id', userId)
      .eq('status', 'HELD');

    if (escrowError) throw escrowError;

    const availableBalance = balanceData?.balance_usd ? Number(balanceData.balance_usd) : 0;
    const escrowLocked = escrowData
      ? escrowData.reduce((acc, curr) => acc + Number(curr.amount_usd), 0)
      : 0;

    return {
      success: true,
      data: {
        availableBalance,
        escrowLocked,
      },
    };
  } catch (err: unknown) {
    console.error('Error fetching trade credit summary:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch credit summary';
    return { success: false, error: errorMessage };
  }
}