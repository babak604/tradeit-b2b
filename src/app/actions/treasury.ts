'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface WalletData {
  id: string;
  user_id: string;
  balance: number;
  locked_escrow: number;
  updated_at: string;
}

export async function getOrCreateWallet() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized', wallet: null };
  }

  // 1. Fetch wallet
  const { data: wallet, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!error && wallet) {
    return { success: true, wallet: wallet as WalletData };
  }

  // 2. Auto-provision starting wallet if missing
  const { data: newWallet, error: createError } = await supabase
    .from('wallets')
    .insert({
      user_id: user.id,
      balance: 25000,
      locked_escrow: 0,
    })
    .select('*')
    .single();

  if (createError) {
    return { error: createError.message, wallet: null };
  }

  return { success: true, wallet: newWallet as WalletData };
}

export async function depositTestCredits(amount: number = 5000) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', user.id)
    .single();

  const currentBalance = wallet?.balance || 0;

  const { error } = await supabase
    .from('wallets')
    .update({ balance: currentBalance + amount })
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/treasury');
  return { success: true };
}