"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface DealHistoryRow {
  id: string;
  deal_id: string;
  event_type: "INITIALIZE" | "DEPOSIT" | "SETTLEMENT";
  tx_signature: string;
  wallet_address: string;
  mint_address?: string;
  amount?: number;
  recipient_address?: string;
  created_at: string;
}

interface DealAuditTrailProps {
  dealId: string;
}

export function DealAuditTrail({ dealId }: DealAuditTrailProps) {
  const [logs, setLogs] = useState<DealHistoryRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch audit trail logs from Supabase
  const fetchAuditLogs = useCallback(async () => {
    if (!dealId) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("deal_history")
        .select("*")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLogs((data as DealHistoryRow[]) || []);
    } catch (err: any) {
      console.error("Error fetching deal audit trail:", err.message);
      setError("Failed to load audit history.");
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    fetchAuditLogs();

    // Real-time listener for new events on this deal_id
    const channel = supabase
      .channel(`deal_audit_${dealId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "deal_history",
          filter: `deal_id=eq.${dealId}`,
        },
        (payload) => {
          const newRow = payload.new as DealHistoryRow;
          setLogs((prev) => [newRow, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId, fetchAuditLogs]);

  // Address truncator helper
  const truncate = (str?: string) =>
    str ? `${str.slice(0, 4)}...${str.slice(-4)}` : "—";

  // Event Badge Styling Helper
  const renderBadge = (type: DealHistoryRow["event_type"]) => {
    switch (type) {
      case "INITIALIZE":
        return (
          <span className="px-2.5 py-1 text-xs font-mono font-semibold rounded-md bg-sky-950 text-sky-400 border border-sky-800/80">
            INITIALIZE
          </span>
        );
      case "DEPOSIT":
        return (
          <span className="px-2.5 py-1 text-xs font-mono font-semibold rounded-md bg-amber-950 text-amber-400 border border-amber-800/80">
            DEPOSIT
          </span>
        );
      case "SETTLEMENT":
        return (
          <span className="px-2.5 py-1 text-xs font-mono font-semibold rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800/80">
            SETTLEMENT
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            📜 Deal Audit Trail
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            On-chain transaction history for <span className="text-sky-400 font-mono">{dealId}</span>
          </p>
        </div>
        <button
          onClick={fetchAuditLogs}
          disabled={loading}
          className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
        >
          {loading ? "Refreshing..." : "🔄 Refresh"}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs">
          {error}
        </div>
      )}

      {loading && logs.length === 0 ? (
        <p className="text-xs font-mono text-slate-500 py-6 text-center animate-pulse">
          Loading on-chain records from Supabase...
        </p>
      ) : logs.length === 0 ? (
        <p className="text-xs font-mono text-slate-500 py-6 text-center italic">
          No transactions recorded for deal "{dealId}" yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-slate-400 border-b border-slate-800 bg-slate-950/50">
              <tr>
                <th className="py-3 px-3">Event</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Wallet</th>
                <th className="py-3 px-3">Recipient / Mint</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3 text-right">Transaction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3">{renderBadge(log.event_type)}</td>
                  <td className="py-3 px-3 font-semibold text-slate-200">
                    {log.amount
                      ? log.event_type === "INITIALIZE"
                        ? `${(log.amount / 1_000_000_000).toFixed(2)} SOL`
                        : `${(log.amount / 10 ** 6).toLocaleString()} RWA`
                      : "—"}
                  </td>
                  <td className="py-3 px-3 text-slate-400">{truncate(log.wallet_address)}</td>
                  <td className="py-3 px-3 text-slate-400">
                    {log.recipient_address
                      ? truncate(log.recipient_address)
                      : log.mint_address
                      ? truncate(log.mint_address)
                      : "—"}
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {new Date(log.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <a
                      href={`https://explorer.solana.com/tx/${log.tx_signature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:text-sky-300 hover:underline inline-flex items-center gap-1"
                    >
                      {truncate(log.tx_signature)} ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}