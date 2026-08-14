import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DealHistoryRecord {
  id: string;
  deal_id: string;
  event_type: string;
  tx_signature: string;
  wallet_address: string;
  mint_address?: string;
  recipient_address?: string;
  amount?: number;
  created_at?: string;
}

/**
 * Fetch past deal transaction records from Supabase
 */
export async function fetchDealHistory(): Promise<DealHistoryRecord[]> {
  try {
    const { data, error } = await supabase
      .from("deal_history")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching deal history from Supabase:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Unexpected error fetching deal history:", err);
    return [];
  }
}

/**
 * Subscribe to real-time inserts on the deal_history table
 */
export function subscribeToDealHistory(callback: (record: DealHistoryRecord) => void) {
  const channel = supabase
    .channel("public:deal_history")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "deal_history" },
      (payload) => {
        callback(payload.new as DealHistoryRecord);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

/**
 * Log a new transaction event to Supabase & auto-sync deal status
 */
export async function logDealTransaction(payload: {
  dealId: string;
  eventType: string;
  txSignature: string;
  walletAddress: string;
  mintAddress?: string;
  recipientAddress?: string;
  amount?: number;
}) {
  try {
    // 1. Log transaction to audit trail
    const { error: historyError } = await supabase.from("deal_history").insert([
      {
        deal_id: payload.dealId,
        event_type: payload.eventType,
        tx_signature: payload.txSignature,
        wallet_address: payload.walletAddress,
        mint_address: payload.mintAddress,
        recipient_address: payload.recipientAddress,
        amount: payload.amount,
      },
    ]);

    if (historyError) {
      console.error("Error logging deal transaction to Supabase:", historyError.message);
    }

    // 2. Map event to deal status & attempt sync
    let dealStatus = "";
    if (payload.eventType === "INITIALIZE") dealStatus = "ESCROW_INITIALIZED";
    if (payload.eventType === "DEPOSIT") dealStatus = "ESCROW_FUNDED";
    if (payload.eventType === "SETTLEMENT") dealStatus = "SETTLED";

    if (dealStatus) {
      const { error: dealSyncError } = await supabase
        .from("deals")
        .update({ status: dealStatus, updated_at: new Date().toISOString() })
        .eq("id", payload.dealId);

      if (dealSyncError) {
        console.warn("Notice: Status update on 'deals' table skipped (table or record may not exist yet).");
      }
    }
  } catch (err) {
    console.error("Unexpected error logging transaction or syncing deal state:", err);
  }
}