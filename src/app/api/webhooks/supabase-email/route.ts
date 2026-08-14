import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key");

export async function POST(req: Request) {
  try {
    // 1. Verify Authorization Header
    const expectedSecret = process.env.WEBHOOK_SECRET;
    const incomingSecret =
      req.headers.get("x-webhook-secret") ||
      req.headers.get("authorization");

    if (
      expectedSecret &&
      incomingSecret !== expectedSecret &&
      incomingSecret !== `Bearer ${expectedSecret}`
    ) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing webhook secret header" },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Supabase Database Webhook Payload
    const record = body?.record || body?.new;
    const eventType = record?.event_type || record?.status;
    const dealId = record?.deal_id || record?.id;
    const txSignature = record?.tx_signature || "";

    if (!dealId || !eventType) {
      return NextResponse.json(
        { message: "Payload missing required deal parameters" },
        { status: 200 }
      );
    }

    // 2. Vault Funded Alert
    if (eventType === "DEPOSIT" || eventType === "ESCROW_FUNDED") {
      await resend.emails.send({
        from: "TradeIt B2B Escrow ",
        to: ["notifications@tradeit.com"],
        subject: `🔒 Escrow Vault Funded: ${dealId}`,
        html: `
          
            Vault Funded Successfully
            The escrow vault for Deal ${dealId} received funds on Solana Devnet.
            
              Event: ESCROW_FUNDED
              ${txSignature ? `Tx: ${txSignature}` : ""}
            
            View Deal Overview ↗
          
        `,
      });
    }

    // 3. Settlement Alert
    if (eventType === "SETTLEMENT" || eventType === "SETTLED") {
      await resend.emails.send({
        from: "TradeIt B2B Escrow ",
        to: ["notifications@tradeit.com"],
        subject: `🎉 Atomic Settlement Executed: ${dealId}`,
        html: `
          
            Atomic Ring Settlement Complete
            Vaulted assets for Deal ${dealId} have been released on-chain.
            
              Event: SETTLED
              ${txSignature ? `Tx: ${txSignature}` : ""}
            
            Download Settlement Certificate ↗
          
        `,
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Resend Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}