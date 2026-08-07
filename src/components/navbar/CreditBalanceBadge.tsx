'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import LedgerDrawer from './LedgerDrawer';

interface CreditBalanceBadgeProps {
  companyId: string;
  initialAvailable: number;
  initialEscrow: number;
}

export default function CreditBalanceBadge({
  companyId,
  initialAvailable,
  initialEscrow,
}: CreditBalanceBadgeProps) {
  const [balance, setBalance] = useState({
    available: initialAvailable,
    escrow: initialEscrow,
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Listen for live balance changes
    const channel = supabase
      .channel(`balance_changes_${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trade_credit_balances',
          filter: `company_id=eq.${companyId}`,
        },
        (payload: any) => {
          if (payload.new) {
            setBalance({
              available: Number(payload.new.available_balance) || 0,
              escrow: Number(payload.new.escrow_balance) || 0,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  return (
    <>
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono shadow-sm hover:border-zinc-700 transition-colors cursor-pointer group"
        title="Click to view transaction history"
      >
        {/* Available Balance */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-zinc-400 group-hover:text-zinc-300">Available:</span>
          <span className="text-emerald-400 font-semibold">
            {balance.available.toLocaleString()} TC
          </span>
        </div>

        {/* Escrow Balance */}
        {balance.escrow > 0 && (
          <>
            <span className="text-zinc-700">|</span>
            <div className="flex items-center gap-1.5 text-zinc-400 group-hover:text-zinc-300">
              <span>Escrow:</span>
              <span className="text-amber-400 font-medium">
                {balance.escrow.toLocaleString()} TC
              </span>
            </div>
          </>
        )}
      </button>

      {/* Slide-over Audit Trail Drawer */}
      <LedgerDrawer
        companyId={companyId}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}