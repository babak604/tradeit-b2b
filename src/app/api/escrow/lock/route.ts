import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as adminSupabaseModule from '@/lib/supabase/admin';

/**
 * Resilient factory resolver that dynamically accesses the admin client
 * without triggering TS2305 export errors.
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
    const { dealId, amount } = await req.json();

    if (!dealId || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid or missing parameters: dealId and amount' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization Check: Verify caller is Party A
    const { data: deal, error: dealError } = await supabase
      .from('barter_deals')
      .select('company_a_id')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    if (deal.company_a_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Only Party A can lock escrow' },
        { status: 403 }
      );
    }

    // Execute Service Role RPC
    const adminSupabase = getAdminClient();
    const { data: rpcData, error: rpcError } = await adminSupabase.rpc(
      'lock_trade_escrow',
      {
        p_match_id: dealId,
        p_amount: amount,
      }
    );

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    if (rpcData && !rpcData.success) {
      return NextResponse.json(
        { error: rpcData.error || 'Lock escrow failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Escrow locked successfully',
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}