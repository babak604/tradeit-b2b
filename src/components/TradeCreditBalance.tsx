'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface TradeCreditBalanceProps {
  companyId?: string;
  userId?: string;
}

type BalanceRecord = {
  available_credits?: number;
  escrowed_credits?: number;
};

export default function TradeCreditBalance({ companyId, userId }: TradeCreditBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [escrowHold, setEscrowHold] = useState<number>(0);

  const supabase = useMemo(() => createClient(), []);

  const targetId = companyId || userId;
  const targetColumn = companyId ? 'company_id' : 'user_id';

  useEffect(() => {
    let isMounted = true;

    if (!targetId) {
      Promise.resolve().then(() => {
        if (isMounted) {
          setBalance(0);
          setEscrowHold(0);
        }
      });
      return;
    }

    async function fetchBalances() {
      try {
        const { data, error } = await supabase
          .from('trade_credit_balances')
          .select('available_credits, escrowed_credits')
          .eq(targetColumn, targetId!)
          .maybeSingle();

        if (!isMounted) return;

        if (error) {
          console.warn('[TradeCreditBalance] Query notice:', error.message);
          setBalance(0);
          setEscrowHold(0);
          return;
        }

        if (data) {
          setBalance(data.available_credits ?? 0);
          setEscrowHold(data.escrowed_credits ?? 0);
        } else {
          setBalance(0);
          setEscrowHold(0);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.warn('[TradeCreditBalance] Request failed:', err);
          setBalance(0);
        }
      }
    }

    fetchBalances();

    const channel = supabase
      .channel(`realtime_credits_${targetId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trade_credit_balances',
          filter: `${targetColumn}=eq.${targetId}`,
        },
        (payload: RealtimePostgresChangesPayload<BalanceRecord>) => {
          if (!isMounted) return;
          const newRecord = payload.new as BalanceRecord;
          if (newRecord && 'available_credits' in newRecord) {
            setBalance(newRecord.available_credits ?? 0);
            setEscrowHold(newRecord.escrowed_credits ?? 0);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [targetId, targetColumn, supabase]);

  if (balance === null) {
    return (
      <div className="text-xs text-slate-500 animate-pulse px-3 py-1.5 rounded-full bg-slate-900/50 border border-slate-800">
        Loading credits...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono font-medium text-slate-200 shadow-inner">
      <span className="text-emerald-400 font-bold tracking-tight">
        {balance.toLocaleString()} <span className="text-[10px] text-emerald-500/80 uppercase font-sans">Credits</span>
      </span>
      {escrowHold > 0 && (
        <span className="text-amber-400 text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
          ({escrowHold.toLocaleString()} locked)
        </span>
      )}
    </div>
  );
}