'use server';

import { createClient } from '@/lib/supabase/server';

export interface AuditLogItem {
  id: string;
  deal_id: string;
  action: string;
  performed_by: string | null;
  metadata: Record<string, any>;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export async function getDealAuditLogs(dealId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized.' };
  }

  const { data, error } = await supabase
    .from('deal_audit_logs')
    .select(`
      id,
      deal_id,
      action,
      performed_by,
      metadata,
      created_at,
      profiles:performed_by (
        full_name,
        email
      )
    `)
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, logs: (data as unknown) as AuditLogItem[] };
}