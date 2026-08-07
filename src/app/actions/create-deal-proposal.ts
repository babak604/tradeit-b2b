'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const dealProposalSchema = z.object({
  party_b_id: z.string().uuid('Please select a valid counterparty company'),
  credit_amount: z.coerce.number().min(0, 'Credit amount must be 0 or greater'),
  party_a_deliverable: z.string().min(5, 'Your commitment must be at least 5 characters'),
  party_b_deliverable: z.string().min(5, 'Counterparty commitment must be at least 5 characters'),
});

export async function createDealProposalAction(_prevState: any, formData: FormData) {
  const supabase = await createClient();

  // 1. Verify Authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  // 2. Retrieve user's company_id (party_a_id)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.company_id) {
    return { error: 'Your account is not linked to a registered company.' };
  }

  const partyAId = profile.company_id;

  // 3. Parse and Validate Form Data
  const rawData = {
    party_b_id: formData.get('party_b_id'),
    credit_amount: formData.get('credit_amount'),
    party_a_deliverable: formData.get('party_a_deliverable'),
    party_b_deliverable: formData.get('party_b_deliverable'),
  };

  const validated = dealProposalSchema.safeParse(rawData);

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const { party_b_id, credit_amount, party_a_deliverable, party_b_deliverable } = validated.data;

  // 4. Prevent self-dealing
  if (partyAId === party_b_id) {
    return { error: 'You cannot propose a barter agreement with your own company.' };
  }

  // 5. Insert Deal Record
  const { data: newDeal, error: insertError } = await supabase
    .from('deals')
    .insert({
      party_a_id: partyAId,
      party_b_id,
      credit_amount,
      party_a_deliverable,
      party_b_deliverable,
      status: 'proposed',
    })
    .select('id')
    .single();

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath('/deals');
  redirect(`/deals/${newDeal.id}`);
}