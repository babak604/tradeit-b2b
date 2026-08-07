'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * Retrieve the current authenticated user's wallet & escrow balance
 */
export async function getUserWalletAction() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized', wallet: null };
  }

  const { data: wallet, error } = await supabase
    .from('wallets')
    .select('balance, locked_escrow')
    .eq('user_id', user.id)
    .single();

  if (error) {
    return { success: false, error: error.message, wallet: null };
  }

  return { success: true, wallet };
}

/**
 * Create a new barter proposal in draft status
 */
export async function createDealAction({
  offerId,
  receiverId,
  proposedTerms,
}: {
  offerId: string;
  receiverId: string;
  proposedTerms: string;
}) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'You must be logged in to propose a deal.' };
  }

  if (user.id === receiverId) {
    return { success: false, error: 'You cannot propose a barter on your own offer.' };
  }

  // 🔒 Security Check: Verify that receiverId actually owns the targeted offer
  const { data: offer, error: offerError } = await supabase
    .from('offers')
    .select('user_id')
    .eq('id', offerId)
    .single();

  if (offerError || !offer) {
    return { success: false, error: 'Target offer not found.' };
  }

  if (offer.user_id !== receiverId) {
    return { success: false, error: 'Invalid receiver for this offer.' };
  }

  const { data, error } = await supabase
    .from('deals')
    .insert({
      offer_id: offerId,
      initiator_id: user.id,
      receiver_id: receiverId,
      terms: proposedTerms,
      status: 'draft',
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/deals');
  return { success: true, data };
}

/**
 * Retrieve all deals involving the current user
 */
export async function getUserDealsAction() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized', userId: null, deals: [] };
  }

  const { data: deals, error } = await supabase
    .from('deals')
    .select(`
      id,
      initiator_id,
      receiver_id,
      status,
      terms,
      created_at,
      value_credits,
      offers (
        title,
        credits
      )
    `)
    .or(`initiator_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: error.message, userId: user.id, deals: [] };
  }

  return { success: true, error: null, userId: user.id, deals: deals || [] };
}

/**
 * Execute private schema RPC to sign/lock deal escrow
 */
export async function signDealAction(dealId: string) {
  const supabase = await createClient();

  // 🔒 Auth verification
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Executing via admin client to access the 'private' schema safely,
  // passing verified user.id strictly from server-authenticated context
  const { data, error } = await supabaseAdmin
    .schema('private')
    .rpc('sign_deal', {
      p_deal_id: dealId,
      p_user_id: user.id, // Strictly server-derived auth ID
    });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/deals');
  revalidatePath(`/deals/${dealId}`);
  return { success: true, data };
}

/**
 * Execute private schema RPC to settle escrow and release credits
 */
export async function settleDealAction(dealId: string) {
  const supabase = await createClient();

  // 🔒 Auth verification
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { data, error } = await supabaseAdmin
    .schema('private')
    .rpc('settle_deal', {
      p_deal_id: dealId,
      p_releasing_user_id: user.id, // Strictly server-derived auth ID
    });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/deals');
  revalidatePath(`/deals/${dealId}`);
  return { success: true, data };
}