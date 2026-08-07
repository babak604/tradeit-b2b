'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type ResolutionType = 'full_buyer_refund' | 'full_seller_release' | 'partial_settlement';

export async function resolveDisputeAction(params: {
  dealId: string;
  resolutionType: ResolutionType;
  buyerRefundPct: number;
  notes: string;
}) {
  const { dealId, resolutionType, buyerRefundPct, notes } = params;

  // 1. Check Authenticated Session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized.' };
  }

  // 2. Verify Admin Role
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return { success: false, error: 'Forbidden. Admin credentials required.' };
  }

  if (!notes.trim()) {
    return { success: false, error: 'Resolution notes are required for compliance auditing.' };
  }

  // 3. Execute via Service Role Client
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.rpc('resolve_trade_dispute', {
    p_deal_id: dealId,
    p_resolution_type: resolutionType,
    p_buyer_refund_pct: buyerRefundPct,
    p_notes: notes,
    p_admin_id: user.id,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/disputes`);
  revalidatePath(`/deals/${dealId}`);

  return (data as { success: boolean; error?: string }) || { success: true };
}