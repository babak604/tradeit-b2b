'use me'; // Server Action
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function sendMessageAction(formData: FormData) {
  const supabase = await createClient();

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized.' };
  }

  const dealId = formData.get('dealId') as string;
  const senderCompanyId = formData.get('senderCompanyId') as string;
  const content = (formData.get('content') as string) || '';
  const file = formData.get('attachment') as File | null;

  if (!dealId || !senderCompanyId) {
    return { success: false, error: 'Missing deal or company ID.' };
  }

  if (!content.trim() && (!file || file.size === 0)) {
    return { success: false, error: 'Message cannot be empty.' };
  }

  // 2. Verify user belongs to the sending company
  const { data: member } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .eq('company_id', senderCompanyId)
    .single();

  if (!member) {
    return { success: false, error: 'User does not belong to this company.' };
  }

  // 3. Handle File Upload (Optional Inspection Proof / Document)
  const attachments: { name: string; url: string; size: number }[] = [];

  if (file && file.size > 0) {
    const fileExt = file.name.split('.').pop();
    const filePath = `${dealId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('deal-attachments')
      .upload(filePath, file);

    if (uploadError) {
      return { success: false, error: `Attachment upload failed: ${uploadError.message}` };
    }

    const { data: publicUrlData } = supabase.storage
      .from('deal-attachments')
      .getPublicUrl(filePath);

    attachments.push({
      name: file.name,
      url: publicUrlData.publicUrl,
      size: file.size,
    });
  }

  // 4. Insert Message
  const { error: insertError } = await supabase.from('deal_messages').insert({
    deal_id: dealId,
    sender_company_id: senderCompanyId,
    content: content.trim(),
    attachments: attachments.length > 0 ? attachments : null,
  });

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  revalidatePath(`/deals/${dealId}`);
  return { success: true };
}