'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function uploadDealAttachmentAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized session.' };
  }

  const file = formData.get('file') as File;
  const dealId = formData.get('deal_id') as string;

  if (!file || file.size === 0) {
    return { error: 'Please select a valid file to attach.' };
  }

  if (!dealId) {
    return { error: 'Missing deal room identifier.' };
  }

  // 1. Fetch user's company ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) {
    return { error: 'User is not linked to an active company.' };
  }

  // 2. Upload file to Supabase Storage Bucket
  const fileExt = file.name.split('.').pop();
  const filePath = `${dealId}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('deal-attachments')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { error: `Storage upload failed: ${uploadError.message}` };
  }

  // 3. Save metadata into deal_attachments table
  const { error: dbError } = await supabase.from('deal_attachments').insert({
    deal_id: dealId,
    company_id: profile.company_id,
    file_name: file.name,
    file_path: filePath,
    file_size: file.size,
    mime_type: file.type,
  });

  if (dbError) {
    return { error: `Database logging failed: ${dbError.message}` };
  }

  revalidatePath(`/deals/${dealId}`);
  return { success: true };
}