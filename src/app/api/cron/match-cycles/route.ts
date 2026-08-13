// src/app/api/cron/match-cycles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { solveAbsorptiveCycle, GraphNode } from '@/lib/graph/absorptiveCycleSolver';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    // Verify Vercel Cron Secret or Authorization Header
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized Cron Request' }, { status: 401 });
    }

    // 1. Fetch all active open offers (Services & RWAs)
    const { data: rawOffers, error: fetchErr } = await supabase
      .from('trade_offers')
      .select('id, company_id, title, estimated_value, offering_embedding, seeking_embedding, offer_type, token_mint_address')
      .eq('custody_status', 'UNLOCKED')
      .limit(100);

    if (fetchErr || !rawOffers || rawOffers.length < 3) {
      return NextResponse.json({
        success: true,
        message: 'Insufficient node pool to form 3-way cycles.',
        cyclesDiscovered: 0,
      });
    }

    // Map database records to GraphNodes
    const nodes: GraphNode[] = rawOffers.map((o) => ({
      id: o.id,
      companyName: o.title,
      offeringValueCAD: Number(o.estimated_value || 10000),
      seekingValueCAD: Number(o.estimated_value || 10000),
      offeringEmbedding: o.offering_embedding || new Array(1536).fill(0),
      seekingEmbedding: o.seeking_embedding || new Array(1536).fill(0),
    }));

    let cyclesDiscovered = 0;

    // 2. Multigraph Cycle Traversal Loop
    for (let i = 0; i < nodes.length; i++) {
      const primaryNode = nodes[i];

      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const counterpartyNode = nodes[j];

        const candidatePool = nodes.filter(
          (n) => n.id !== primaryNode.id && n.id !== counterpartyNode.id
        );

        // Solve absorptive cycle (handles $0 delta or $X delta)
        const cycleResult = solveAbsorptiveCycle(primaryNode, counterpartyNode, candidatePool);

        if (cycleResult && cycleResult.isFullyBalanced && cycleResult.cycleNodes.length === 3) {
          cyclesDiscovered++;

          // Record discovered cycle ring in database
          await supabase.from('barter_deals').insert({
            company_a_id: primaryNode.id,
            company_b_id: counterpartyNode.id,
            status: 'MATCHED_CYCLE_PENDING',
            escrow_amount: cycleResult.totalCycleValueCAD,
            notes: `3-Way Circular Ring: ${cycleResult.cycleNodes.join(' ➔ ')}`,
          });

          break; // Move to next primary node once cycle is logged
        }
      }
    }

    return NextResponse.json({
      success: true,
      cyclesDiscovered,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Cron processing error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}