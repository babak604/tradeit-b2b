'use me' // or standard Next.js server action declaration
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function executeSignDeal(dealId: string) {
  const supabase = await createClient();

  // 1. Ensure user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  // 2. Call the private atomic sign_deal RPC function
  const { data, error } = await supabase.rpc('sign_deal', {
    p_deal_id: dealId,
    p_user_id: user.id,
  });

  if (error) {
    console.error('Failed to sign deal:', error);
    return { success: false, error: error.message };
  }

  // 3. Revalidate the Deal Room route so UI reflects new status
  revalidatePath(`/deals/${dealId}`);

  return { success: true };
}