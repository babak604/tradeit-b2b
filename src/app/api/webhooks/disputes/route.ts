import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY || 're_demo_key';
  const resend = new Resend(apiKey);

  try {
    const body = await req.json();
    // Your dispute webhook logic here...

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}