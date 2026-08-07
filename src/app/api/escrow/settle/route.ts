import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as adminSupabaseModule from '@/lib/supabase/admin';

/**
 * Resilient factory resolver that dynamically accesses the admin client
 * without triggering TS export errors.
 */
function getAdminClient(): any {
  const mod = adminSupabaseModule as Record<string, any>;
  const factory = mod.createAdminClient ?? mod.createClient ?? mod.default;

  if (typeof factory !== 'function') {
    throw new Error('No valid Supabase admin factory found in "@/lib/supabase/admin"');
  }

  return factory();
}

export async function POST(req: NextRequest) {
  try {
    const { dealId } = await req.json();

    if (!dealId) {
      return NextResponse.json({ error: 'Missing dealId parameter' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization Check: Verify caller is a deal participant
    const { data: deal, error: dealError } = await supabase
      .from('barter_deals')
      .select('company_a_id, company_b_id')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    if (deal.company_a_id !== user.id && deal.company_b_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You are not a deal participant' },
        { status: 403 }
      );
    }

    // Execute Service Role RPC
    const adminSupabase = getAdminClient();
    const { data: rpcData, error: rpcError } = await adminSupabase.rpc('settle_trade_escrow', {
      p_match_id: dealId,
    });

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    if (rpcData && !rpcData.success) {
      return NextResponse.json(
        { error: rpcData.error || 'Settle escrow failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Escrow settled successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}