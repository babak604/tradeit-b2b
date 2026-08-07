'use server';

import { createClient } from '@/lib/supabase/server';

export interface AdminMetrics {
  total_settled_volume: number;
  total_locked_escrow: number;
  total_liquid_balance: number;
  total_companies: number;
  total_deals: number;
  proposed_deals: number;
  signed_deals: number;
  settled_deals: number;
  disputed_deals: number;
}

export interface AdminRecentDeal {
  id: string;
  credit_amount: number;
  status: string;
  created_at: string;
  party_a: { name: string };
  party_b: { name: string };
}

export async function fetchAdminDashboardDataAction() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized session.' };
  }

  // 1. Fetch aggregated stats via private RPC
  const { data: metricsData, error: metricsError } = await supabase.rpc('get_admin_metrics');

  if (metricsError) {
    return { error: metricsError.message };
  }

  // 2. Fetch recent deal transactions log
  const { data: recentDeals, error: dealsError } = await supabase
    .from('deals')
    .select(`
      id,
      credit_amount,
      status,
      created_at,
      party_a:companies!party_a_id(name),
      party_b:companies!party_b_id(name)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (dealsError) {
    return { error: dealsError.message };
  }

  return {
    success: true,
    metrics: metricsData as AdminMetrics,
    recentDeals: recentDeals as unknown as AdminRecentDeal[],
  };
}