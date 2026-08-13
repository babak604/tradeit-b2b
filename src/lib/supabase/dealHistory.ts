import { createClient } from "@/lib/supabase/client";

export interface LogDealEventParams {
  dealId: string;
  eventType: "INITIALIZE" | "DEPOSIT" | "SETTLEMENT";
  txSignature: string;
  walletAddress: string;
  mintAddress?: string;
  amount?: number;
  recipientAddress?: string;
}

export async function logDealTransaction(params: LogDealEventParams) {
  const supabase = createClient();

  const { data, error } = await supabase.from("deal_history").insert({
    deal_id: params.dealId,
    event_type: params.eventType,
    tx_signature: params.txSignature,
    wallet_address: params.walletAddress,
    mint_address: params.mintAddress,
    amount: params.amount,
    recipient_address: params.recipientAddress,
  });

  if (error) {
    console.error("❌ Failed to log deal history to Supabase:", error);
    throw error;
  }

  console.log(`✅ Logged ${params.eventType} for deal ${params.dealId} in Supabase`);
  return data;
}