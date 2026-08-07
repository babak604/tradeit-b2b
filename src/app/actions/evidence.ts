'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface EvidenceRecord {
  id: string;
  deal_id: string;
  uploaded_by: string;
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: string;
  created_at: string;
  uploader_email?: string;
}

interface RecordEvidenceParams {
  dealId: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export async function recordEvidenceAction({
  dealId,
  filePath,
  fileName,
  fileSize,
  fileType,
}: RecordEvidenceParams) {
  const supabase = await createClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();

  if (userErr || !user) {
    return { success: false, error: 'Unauthorized user.' };
  }

  const { data, error } = await supabase
    .from('dispute_evidence')
    .insert({
      deal_id: dealId,
      uploaded_by: user.id,
      file_path: filePath,
      file_name: fileName,
      file_size: fileSize,
      file_type: fileType,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/deals/${dealId}`);
  return { success: true, evidence: data };
}

/**
 * Fetches all evidence records for a given barter deal
 */
export async function getDisputeEvidenceAction(dealId: string): Promise<{
  success: boolean;
  data?: EvidenceRecord[];
  error?: string;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('dispute_evidence')
    .select('*')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data as EvidenceRecord[] };
}

/**
 * Generates a temporary 1-hour signed URL for secure document downloading/viewing
 */
export async function getEvidenceDownloadUrlAction(filePath: string): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from('dispute-evidence')
    .createSignedUrl(filePath, 3600); // 1 hour validity

  if (error || !data) {
    return { success: false, error: error?.message || 'Failed to generate signed download link.' };
  }

  return { success: true, url: data.signedUrl };
}