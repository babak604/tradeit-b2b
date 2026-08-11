import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_demo_key');

export async function POST(req: NextRequest) {
  try {
    const { to, type, dealData } = await req.json();

    if (!to) {
      return NextResponse.json({ error: 'Recipient email required' }, { status: 400 });
    }

    let subject = 'TradeIt AI Notification';
    let htmlContent = '';

    if (type === 'match_found') {
      subject = '⚡ New Zero-Cash Trade Match Discovered on TradeIt AI';
      htmlContent = `
        <div style="font-family: sans-serif; background: #020617; color: #f8fafc; padding: 24px; border-radius: 16px;">
          <h2 style="color: #ef4444; margin-bottom: 8px;">New Trade Match Discovered</h2>
          <p style="font-size: 14px; color: #94a3b8;">An optimal Offer & Need alignment has been matched to your company profile.</p>
          <div style="background: #0f172a; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #1e293b;">
            <p style="margin: 0; font-weight: bold; color: #10b981;">Offer: ${dealData?.offering || 'B2B Services'}</p>
            <p style="margin: 4px 0 0 0; font-weight: bold; color: #60a5fa;">Need: ${dealData?.looking_for || 'B2B Services'}</p>
          </div>
          <a href="https://tradeit.ai" style="display: inline-block; background: #dc2626; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 12px;">Open Deal Room</a>
        </div>
      `;
    } else if (type === 'contract_executed') {
      subject = '📜 Executed Barter Agreement - TradeIt AI Contract Vault';
      htmlContent = `
        <div style="font-family: sans-serif; background: #020617; color: #f8fafc; padding: 24px; border-radius: 16px;">
          <h2 style="color: #10b981; margin-bottom: 8px;">Contract Successfully Executed</h2>
          <p style="font-size: 14px; color: #94a3b8;">Both parties have digitally signed the zero-cash exchange agreement.</p>
          <p style="font-size: 12px; color: #cbd5e1;">Contract ID: <strong>${dealData?.id || 'demo-123'}</strong></p>
          <a href="https://tradeit.ai" style="display: inline-block; background: #059669; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 12px;">Download PDF Executed Copy</a>
        </div>
      `;
    }

    const data = await resend.emails.send({
      from: 'TradeIt AI <notifications@tradeit.ai>',
      to: [to],
      subject,
      html: htmlContent,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Email route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}