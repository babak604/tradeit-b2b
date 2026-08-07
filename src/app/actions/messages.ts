'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const sendMessageSchema = z.object({
  dealId: z.string().uuid(),
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
});

export async function sendDealMessageAction(dealId: string, content: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized session.' };
  }

  const validated = sendMessageSchema.safeParse({ dealId, content });
  if (!validated.success) {
    return { error: 'Invalid message payload.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) {
    return { error: 'User account is not linked to a company profile.' };
  }

  const { error } = await supabase.from('deal_messages').insert({
    deal_id: dealId,
    sender_id: user.id,
    company_id: profile.company_id,
    content: validated.data.content,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}