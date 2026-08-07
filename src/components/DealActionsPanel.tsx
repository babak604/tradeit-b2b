'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  CheckCircle2,
  Lock,
  Check,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  Clock,
} from 'lucide-react';

export type DealStatus =
  | 'negotiating'
  | 'terms_accepted'
  | 'escrow_locked'
  | 'disputed'
  | 'completed'
  | 'refunded'
  | 'cancelled';

interface DealActionsPanelProps {
  dealId: string;
  status: DealStatus;
  currentCompanyId: string;
}

export function DealActionsPanel({
  dealId,
  status,
  currentCompanyId,
}: DealActionsPanelProps) {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Update Deal Status (Standard Table Mutation)
  const handleUpdateStatus = async (nextStatus: DealStatus, systemNote: string) => {
    if (loading) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const { error: dealError } = await supabase
        .from('deals')
        .update({ status: nextStatus })
        .eq('id', dealId);

      if (dealError) throw dealError;

      // Seed system alert into chat room
      await supabase.from('deal_messages').insert({
        deal_id: dealId,
        sender_company_id: currentCompanyId,
        message: systemNote,
      });
    } catch (err: unknown) {
      console.error('Error updating deal status:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setLoading(false);
    }
  };

  // Escrow RPC Invocations (Lock, Settle, Refund)
  const handleEscrowRpc = async (
    rpcName: 'lock_deal_escrow' | 'settle_deal_escrow' | 'refund_deal_escrow',
    actionLabel: string
  ) => {
    if (loading) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.rpc(rpcName, {
        p_deal_id: dealId,
      });

      if (error) throw error;
      console.log(`${actionLabel} successful:`, data);
    } catch (err: unknown) {
      console.error(`Error executing ${actionLabel}:`, err);
      setErrorMsg(err instanceof Error ? err.message : `Failed to execute ${actionLabel}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-xs font-bold text-white">Escrow State Management</h3>

        {/* Status Badge */}
        <div
          className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold border flex items-center gap-1.5 ${
            status === 'negotiating'
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              : status === 'terms_accepted'
              ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
              : status === 'escrow_locked'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : status === 'completed'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}
        >
          {status === 'negotiating' && <Clock className="w-3 h-3" />}
          {status === 'terms_accepted' && <CheckCircle2 className="w-3 h-3" />}
          {status === 'escrow_locked' && <Lock className="w-3 h-3" />}
          {status === 'completed' && <Check className="w-3 h-3" />}
          <span className="capitalize">{status.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Inline Error Alert */}
      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-[10px] underline hover:no-underline font-mono ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* State Transitions */}
      <div className="space-y-2">
        {/* Step 1: Accept Terms */}
        {status === 'negotiating' && (
          <button
            onClick={() =>
              handleUpdateStatus(
                'terms_accepted',
                'SYSTEM: Terms accepted by counterparty. Ready for escrow locking.'
              )
            }
            disabled={loading}
            className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            {loading ? 'Updating Terms...' : 'Accept Terms & Freeze Offer'}
          </button>
        )}

        {/* Step 2: Lock Escrow */}
        {status === 'terms_accepted' && (
          <button
            onClick={() => handleEscrowRpc('lock_deal_escrow', 'Lock Escrow')}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            {loading ? 'Locking Ledger Escrow...' : 'Lock Escrow Ledger'}
          </button>
        )}

        {/* Step 3: Settled/Locked Active Actions */}
        {status === 'escrow_locked' && (
          <div className="space-y-2">
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs font-mono text-center flex items-center justify-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Escrow Active & Verifiable in Ledger</span>
            </div>

            <button
              onClick={() => handleEscrowRpc('settle_deal_escrow', 'Release Settlement')}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {loading ? 'Releasing Funds...' : 'Settle Deal & Release Funds'}
            </button>

            <button
              onClick={() => handleEscrowRpc('refund_deal_escrow', 'Issue Refund')}
              disabled={loading}
              className="w-full bg-slate-950 border border-rose-500/30 hover:bg-rose-500/10 text-rose-400 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              {loading ? 'Refunding...' : 'Refund Escrow Balance'}
            </button>
          </div>
        )}

        {/* Terminal States */}
        {status === 'completed' && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-3 rounded-xl text-xs font-mono text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Deal Settled & Completed</span>
          </div>
        )}

        {status === 'refunded' && (
          <div className="bg-amber-500/20 border border-amber-500/40 text-amber-300 p-3 rounded-xl text-xs font-mono text-center flex items-center justify-center gap-2">
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>Escrow Refunded to Ledger</span>
          </div>
        )}
      </div>
    </div>
  );
}