import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    // 1. Verify Webhook Secret Header
    const secretHeader = request.headers.get('x-webhook-secret');
    const expectedSecret = process.env.SUPABASE_WEBHOOK_SECRET;

    if (expectedSecret && secretHeader !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized webhook secret' }, { status: 401 });
    }

    const payload = await request.json();
    const { table, record } = payload;

    if (table !== 'barter_deals') {
      return NextResponse.json({ message: 'Ignored table event' }, { status: 200 });
    }

    const dealId = record.id;
    const newStatus = record.status;
    const companyId = record.company_id;

    // 2. Fetch associated company email for notification delivery
    let companyEmail: string | null = null;
    if (companyId) {
      const { data: companyData } = await supabase
        .from('companies')
        .select('email, name')
        .eq('id', companyId)
        .single();
      
      if (companyData?.email) {
        companyEmail = companyData.email;
      }
    }

    // 3. Dispatch Email Notification via Resend if email exists
    if (companyEmail && process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'TradeIt B2B <disputes@yourdomain.com>',
        to: companyEmail,
        subject: `Barter Deal Update: Status Changed to ${newStatus.toUpperCase()}`,
        html: `
          <div style="font-family: sans-serif; padding: 24px; color: #111;">
            <h2>Barter Deal Dispute Arbitration Update</h2>
            <p>Your deal ID <strong>${dealId}</strong> has been updated.</p>
            <p>New Status: <strong style="text-transform: uppercase; color: #2563eb;">${newStatus}</strong></p>
            <p>Please log in to your B2B dashboard to review arbitration details or submit further documentation.</p>
          </div>
        `,
      });
      return NextResponse.json({ 
        success: true, 
        message: `Status updated to ${newStatus}. Email successfully dispatched to ${companyEmail}.` 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Status updated to ${newStatus}. Skipped email dispatch (no email address found on company record).` 
    });

  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}