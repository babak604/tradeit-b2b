'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function resolveDisputeAction(
  dealId: string,
  resolutionType: 'release' | 'refund',
  notes: string
) {
  if (!notes.trim()) {
    return { success: false, error: 'Resolution notes are required for audit history.' };
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized.' };
  }

  const rpcFunctionName = resolutionType === 'release' 
    ? 'resolve_dispute_release' 
    : 'resolve_dispute_refund';

  const { error } = await supabase.rpc(rpcFunctionName, {
    p_deal_id: dealId,
    p_admin_user_id: user.id,
    p_notes: notes.trim(),
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/disputes');
  revalidatePath(`/deals/${dealId}`);

  return { success: true };
}