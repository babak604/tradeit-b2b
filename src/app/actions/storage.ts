'use server';

import { createClient } from '@/lib/supabase/server';

export interface SignedEvidenceUrl {
  path: string;
  signedUrl: string | null;
  error?: string;
}

export async function getSignedEvidenceUrls(
  paths: string[],
  expiresInSeconds: number = 3600
): Promise<{ success: boolean; data?: SignedEvidenceUrl[]; error?: string }> {
  if (!paths || paths.length === 0) {
    return { success: true, data: [] };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized user session.' };
  }

  const { data, error } = await supabase.storage
    .from('deal-inspection-evidence')
    .createSignedUrls(paths, expiresInSeconds);

  if (error) {
    return { success: false, error: error.message };
  }

  const results: SignedEvidenceUrl[] = data.map((item) => ({
    path: item.path || '',
    signedUrl: item.signedUrl || null,
    error: item.error || undefined,
  }));

  return { success: true, data: results };
}