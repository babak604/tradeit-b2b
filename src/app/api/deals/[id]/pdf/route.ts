import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: dealId } = await params;
  const supabase = await createClient();

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 2. Fetch Deal details with Company relationships
  const { data: deal, error } = await supabase
    .from('deals')
    .select(`
      *,
      party_a:companies!party_a_id(id, name),
      party_b:companies!party_b_id(id, name)
    `)
    .eq('id', dealId)
    .single();

  if (error || !deal) {
    return new NextResponse('Deal record not found', { status: 404 });
  }

  const generatedAt = new Date().toISOString();

  // 3. Render Legal Contract Document
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>TradeIt.tv B2B Contract - ${deal.id}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: 900; color: #0284c7; letter-spacing: -0.5px; }
        .title { font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #334155; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: #e0f2fe; color: #0369a1; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .meta-item { font-size: 12px; }
        .meta-label { text-transform: uppercase; color: #64748b; font-size: 10px; font-weight: 700; display: block; margin-bottom: 2px; }
        .meta-value { font-weight: 600; color: #0f172a; }
        .terms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .term-box { border: 1px solid #cbd5e1; padding: 16px; border-radius: 8px; font-size: 13px; }
        .term-title { font-weight: 700; color: #0369a1; margin-bottom: 8px; font-size: 11px; text-transform: uppercase; }
        .escrow-banner { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 16px; border-radius: 8px; font-size: 12px; margin-bottom: 30px; }
        .footer { border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 10px; color: #94a3b8; text-align: center; margin-top: 40px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body onload="window.print()">
      <div class="header">
        <div>
          <div class="logo">TradeIt<span style="color: #0284c7;">.tv</span></div>
          <div style="font-size: 11px; color: #64748b;">Immutable B2B Barter Escrow Ledger</div>
        </div>
        <div style="text-align: right;">
          <div class="title">Bilateral Trade Agreement</div>
          <span class="badge">Status: ${deal.status}</span>
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Contract Reference ID</span>
          <span class="meta-value">${deal.id}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Escrow Credit Valuation</span>
          <span class="meta-value">${Number(deal.credit_amount).toLocaleString()} CR</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Party A (Initiator)</span>
          <span class="meta-value">${deal.party_a?.name || 'N/A'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Party B (Counterparty)</span>
          <span class="meta-value">${deal.party_b?.name || 'N/A'}</span>
        </div>
      </div>

      <div class="escrow-banner">
        <strong>Escrow Security Guarantee:</strong> This contract was digitally logged and executed via atomic PostgreSQL private schema RPC functions (<code style="background:#dcfce7; padding:2px 4px;">private.sign_deal</code> / <code style="background:#dcfce7; padding:2px 4px;">private.settle_deal</code>) on the TradeIt.tv network.
      </div>

      <div class="terms-grid">
        <div class="term-box">
          <div class="term-title">${deal.party_a?.name} Deliverable Commitment</div>
          <div>${deal.party_a_deliverable}</div>
        </div>
        <div class="term-box">
          <div class="term-title">${deal.party_b?.name} Deliverable Commitment</div>
          <div>${deal.party_b_deliverable}</div>
        </div>
      </div>

      <div class="footer">
        Generated automatically on ${new Date(generatedAt).toUTCString()} &bull; TradeIt.tv Corporate Barter Network &bull; Page 1 of 1
      </div>
    </body>
    </html>
  `;

  return new NextResponse(htmlContent, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}