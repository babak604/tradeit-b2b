import { resend, FROM_EMAIL } from '@/lib/resend';

interface DisputeOpenedParams {
  toEmail: string;
  recipientName: string;
  dealId: string;
  disputeReason: string;
  openedBy: string;
}

interface DisputeResolvedParams {
  toEmail: string;
  recipientName: string;
  dealId: string;
  resolutionOutcome: 'REFUND_BUYER' | 'RELEASE_TO_SELLER' | 'SPLIT';
  resolutionNotes: string;
}

/**
 * Sends notification when a new dispute is logged on an escrow deal.
 */
export async function sendDisputeOpenedEmail({
  toEmail,
  recipientName,
  dealId,
  disputeReason,
  openedBy,
}: DisputeOpenedParams) {
  const shortId = dealId.slice(0, 8);
  const subject = `[Dispute Filed] Escrow Deal #${shortId}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="background-color: #020617; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; margin: 0;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 32px;">
          <h2 style="color: #f8fafc; margin-top: 0;">Dispute Notification</h2>
          <p style="color: #94a3b8; font-size: 14px;">Hello ${recipientName},</p>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5;">
            A dispute has been initiated for <strong>Deal #${shortId}</strong> by <strong>${openedBy}</strong>.
          </p>

          <div style="background-color: #1e293b; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Reason for Dispute</p>
            <p style="margin: 4px 0 0 0; color: #f8fafc; font-size: 14px;">${disputeReason}</p>
          </div>

          <p style="color: #94a3b8; font-size: 13px;">
            Funds in escrow remain locked while an authorized arbitrator reviews evidence from both parties.
          </p>

          <div style="margin-top: 28px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/deals/${dealId}" 
               style="background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
               Open Deal Room
            </a>
          </div>
        </div>
      </body>
    </html>
  `;

  return await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject,
    html,
  });
}

/**
 * Sends notification when an arbitrator resolves a dispute.
 */
export async function sendDisputeResolvedEmail({
  toEmail,
  recipientName,
  dealId,
  resolutionOutcome,
  resolutionNotes,
}: DisputeResolvedParams) {
  const shortId = dealId.slice(0, 8);
  const subject = `[Dispute Resolved] Escrow Deal #${shortId}`;

  const outcomeLabels: Record<string, string> = {
    REFUND_BUYER: 'Full Refund to Buyer',
    RELEASE_TO_SELLER: 'Funds Released to Seller',
    SPLIT: 'Split Settlement',
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="background-color: #020617; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; margin: 0;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 32px;">
          <h2 style="color: #10b981; margin-top: 0;">Arbitration Resolved</h2>
          <p style="color: #94a3b8; font-size: 14px;">Hello ${recipientName},</p>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5;">
            Arbitration has finalized for <strong>Deal #${shortId}</strong>.
          </p>

          <div style="background-color: #1e293b; border-left: 4px solid #10b981; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Final Decision</p>
            <p style="margin: 4px 0 0 0; color: #f8fafc; font-size: 15px; font-weight: 600;">${outcomeLabels[resolutionOutcome] || resolutionOutcome}</p>
            <p style="margin: 8px 0 0 0; color: #cbd5e1; font-size: 13px;">${resolutionNotes}</p>
          </div>

          <div style="margin-top: 28px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/deals/${dealId}" 
               style="background-color: #0f766e; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
               View Settlement Details
            </a>
          </div>
        </div>
      </body>
    </html>
  `;

  return await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject,
    html,
  });
}