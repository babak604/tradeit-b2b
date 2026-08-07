'use client';

import { useEffect, useState } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

export interface LedgerEntry {
  id: string;
  amount: number;
  entry_type: string;
  description: string;
  created_at: string;
}

interface LedgerDrawerProps {
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function LedgerDrawer({ companyId, isOpen, onClose }: LedgerDrawerProps) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !companyId) return;

    let isSubscribed = true;

    async function loadLedger() {
      // Break out of the synchronous effect frame to prevent render cascade warnings
      await Promise.resolve();
      if (!isSubscribed) return;

      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('trade_credit_ledger')
          .select('id, amount, entry_type, description, created_at')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (isSubscribed && !error && data) {
          setEntries(data as LedgerEntry[]);
        }
      } catch (err: unknown) {
        if (isSubscribed) {
          console.error('Error fetching ledger history:', err);
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    loadLedger();

    // Stream new ledger events in real time while open
    const supabase = createClient();
    const channel = supabase
      .channel(`ledger_realtime_${companyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trade_credit_ledger',
          filter: `company_id=eq.${companyId}`,
        },
        (payload: RealtimePostgresChangesPayload<LedgerEntry>) => {
          if (payload.new && isSubscribed) {
            setEntries((prev) => [payload.new as LedgerEntry, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      isSubscribed = false;
      supabase.removeChannel(channel);
    };
  }, [isOpen, companyId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Drawer */}
      <div className="relative z-10 w-full max-w-md bg-zinc-950 border-l border-zinc-800 p-6 flex flex-col justify-between h-full shadow-2xl animate-in slide-in-from-right duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <h3 className="font-semibold text-zinc-100 text-sm tracking-tight">
                Credit Ledger Audit Trail
              </h3>
              <p className="text-zinc-500 text-[11px] font-mono mt-0.5">
                Immutable double-entry ledger
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-100 text-sm font-mono p-1 rounded-md hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Ledger History List */}
          <div className="mt-4 space-y-2.5 overflow-y-auto max-h-[calc(100vh-120px)] pr-1">
            {loading ? (
              <p className="py-8 text-center text-zinc-500 text-xs font-mono">
                Fetching transaction history...
              </p>
            ) : entries.length === 0 ? (
              <p className="py-8 text-center text-zinc-500 text-xs font-mono">
                No ledger activity recorded yet.
              </p>
            ) : (
              entries.map((item) => {
                const isPositive = Number(item.amount) >= 0;
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800/80 text-xs font-mono flex flex-col gap-1.5"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-zinc-200 font-sans font-medium line-clamp-1">
                        {item.description || item.entry_type}
                      </span>
                      <span
                        className={`font-bold shrink-0 ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPositive ? `+${item.amount}` : item.amount} TC
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-1 border-t border-zinc-800/40">
                      <span className="uppercase tracking-wider font-semibold text-zinc-400">
                        {item.entry_type.replace(/_/g, ' ')}
                      </span>
                      <span>
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}