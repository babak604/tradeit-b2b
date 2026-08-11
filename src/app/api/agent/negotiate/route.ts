import { NextRequest, NextResponse } from 'next/server';
import { runAutonomousNegotiator, CompanyAgentPolicy } from '@/lib/agents/autonomousNegotiator';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { 
      policy, 
      myOfferSummary, 
      theirOfferSummary, 
      theirCompany, 
      chatHistory 
    } = await req.json();

    const defaultPolicy: CompanyAgentPolicy = policy || {
      companyName: 'Your Agent Rep',
      minAcceptableValueCAD: 4500,
      maxDeliveryDaysAllowed: 14,
      flexibilityStrategy: 'balanced',
      requiredDeliverables: ['Source files', 'Verification report'],
    };

    const agentDecision = await runAutonomousNegotiator(
      defaultPolicy,
      myOfferSummary || 'B2B Services',
      theirOfferSummary || 'B2B Services',
      theirCompany || 'Counterparty',
      chatHistory || []
    );

    return NextResponse.json({ success: true, decision: agentDecision });
  } catch (err: any) {
    console.error('Agent Negotiation Exception:', err);
    return NextResponse.json({ error: err.message || 'Agent failed to process proposal' }, { status: 500 });
  }
}