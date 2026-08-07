'use server';

import { createClient } from '@/lib/supabase/server';

export interface CreateListingParams {
  user_id?: string;
  userId?: string;
  title: string;
  description: string;
  category: string;
  credit_value: number;
  type: 'OFFER' | 'WANT';
  status?: 'ACTIVE' | 'PENDING' | 'COMPLETED';
}

/**
 * Creates a new barter listing in Supabase
 */
export async function createListingAction(params: CreateListingParams) {
  try {
    const supabase = await createClient();
    const targetUserId = params.user_id || params.userId || '00000000-0000-0000-0000-000000000001';

    const { data, error } = await supabase
      .from('user_listings')
      .insert({
        user_id: targetUserId,
        title: params.title,
        description: params.description,
        category: params.category,
        credit_value: params.credit_value,
        type: params.type,
        status: params.status || 'ACTIVE',
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Database insertion error:', error.message);
      return { error: error.message };
    }

    return { data };
  } catch (err: any) {
    console.error('Failed to create listing:', err);
    return { error: err.message || 'Server action failed' };
  }
}

/**
 * Deletes a listing by ID
 */
export async function deleteListing(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('user_listings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete listing:', error.message);
      return { error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete listing:', err);
    return { error: err.message || 'Server action failed' };
  }
}

/**
 * Updates status ('ACTIVE' | 'PENDING' | 'COMPLETED') of a listing
 */
export async function updateListingStatus(
  id: string,
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED'
) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('user_listings')
      .update({ status })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Failed to update listing status:', error.message);
      return { error: error.message };
    }

    return { data };
  } catch (err: any) {
    console.error('Failed to update listing status:', err);
    return { error: err.message || 'Server action failed' };
  }
}