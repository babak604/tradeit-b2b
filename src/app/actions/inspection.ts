'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function signoffTradeInspection({
  dealId,
  notes,
  attachmentPaths,
}: {
  dealId: string;
  notes?: string;
  attachmentPaths: string[];
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized user session.' };
  }

  // 1. Execute atomic PostgreSQL RPC sign-off function
  const { data, error } = await supabase.rpc('signoff_trade_inspection', {
    p_deal_id: dealId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // 2. Insert audit log event with attachment paths and notes
  await supabase.from('deal_audit_logs').insert({
    deal_id: dealId,
    action: 'INSPECTION_SIGNED_OFF',
    performed_by: user.id,
    metadata: {
      notes: notes || 'Inspection approved by counterparty.',
      attachments: attachmentPaths,
    },
  });

  revalidatePath(`/deals/${dealId}`);
  return { success: true };
}