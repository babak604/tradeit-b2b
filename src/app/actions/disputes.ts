'use server';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function arbitrateDisputeAction(dealId: string, newStatus: string) {
  try {
    const { data, error } = await supabase
      .from('barter_deals')
      .update({ status: newStatus })
      .eq('id', dealId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}