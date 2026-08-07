import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Optional: Resend integration for transactional emails
// import { Resend } from 'resend';
// const resend = new Resend(process.env.RESEND_API_KEY);

interface WebhookPayload {
  type: 'UPDATE';
  table: string;
  schema: string;
  record: {
    id: string;
    status: string;
    party_a_id: string;
    party_b_id: string;
    credit_amount: number;
  };
  old_record: {
    status: string;
  };
}

export async function POST(req: Request) {
  try {
    // 1. Verify Webhook Secret Header
    const authHeader = req.headers.get('x-webhook-secret');
    if (authHeader !== process.env.SUPABASE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload: WebhookPayload = await req.json();

    // Only run if the status column actually changed
    if (payload.record.status === payload.old_record.status) {
      return NextResponse.json({ message: 'No status change' }, { status: 200 });
    }

    const { id: dealId, status, party_a_id, party_b_id } = payload.record;

    // Helper text for each deal state
    const statusMessages: Record<string, { title: string; body: (recipient: string) => string }> = {
      funded_in_escrow: {
        title: 'Deal Signed & Escrow Funded 🔒',
        body: (recipient) =>
          recipient === party_b_id
            ? 'The counterparty has signed the deal. Escrow credits are locked!'
            : 'You signed the deal. Credits are now securely held in escrow.',
      },
      completed: {
        title: 'Deal Settled & Credits Released 🎉',
        body: () => 'The deal has been finalized and escrow credits have been transferred.',
      },
      disputed: {
        title: 'Deal Under Dispute ⚠️',
        body: () => 'A dispute has been raised on this deal. Support has been notified.',
      },
    };

    const notificationConfig = statusMessages[status];
    if (!notificationConfig) {
      return NextResponse.json({ message: 'No notification rules for status' }, { status: 200 });
    }

    // 2. Insert In-App Notifications for both counterparties
    const notificationsToInsert = [party_a_id, party_b_id].map((userId) => ({
      user_id: userId,
      deal_id: dealId,
      title: notificationConfig.title,
      message: notificationConfig.body(userId),
    }));

    const { error: notifError } = await supabaseAdmin
      .from('notifications')
      .insert(notificationsToInsert);

    if (notifError) {
      console.error('Failed to insert notifications:', notifError);
    }

    // 3. (Optional) Trigger Email Notifications via Resend or Postmark
    /*
    await resend.emails.send({
      from: 'Barter Escrow <notifications@yourdomain.com>',
      to: party_b_email,
      subject: notificationConfig.title,
      html: `<p>${notificationConfig.body(party_b_id)}</p><a href="https://yourdomain.com/deals/${dealId}">View Deal Room</a>`,
    });
    */

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}