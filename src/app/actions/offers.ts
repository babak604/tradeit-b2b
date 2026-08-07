'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createOfferAction(data: {
  title: string;
  description: string;
  credits: number;
  category: string;
}) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'You must be signed in to post an offer.' };
  }

  if (!data.title.trim() || !data.description.trim() || data.credits <= 0) {
    return { success: false, error: 'Please provide a valid title, description, and credit valuation.' };
  }

  const { data: newOffer, error } = await supabase
    .from('offers')
    .insert({
      user_id: user.id,
      title: data.title.trim(),
      description: data.description.trim(),
      credits: data.credits,
      category: data.category || 'General Service',
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/offers');
  return { success: true, offerId: newOffer.id };
}