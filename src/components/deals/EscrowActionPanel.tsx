'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export type DealState = 'pending' | 'active' | 'settled' | 'cancelled' | 'disputed';

interface EscrowActionPanelProps {
  deal: {
    id: string;
    status: string;
    company_a_id: string;
    company_b_id: string;
    company_a_signed: boolean;
    company_b_signed: boolean;
  };
  currentCompanyId: string;
}

export function EscrowActionPanel({ deal, currentCompanyId }: EscrowActionPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCompanyA = deal.company_a_id === currentCompanyId;
  const hasAlreadySigned = isCompanyA ? deal.company_a_signed : deal.company_b_signed;

  const handleSignDeal = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/deals/${deal.id}/sign`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign deal.');
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSettleDeal = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/deals/${deal.id}/settle`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to settle deal.');
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Signature Status Overview */}
      <div className="space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-slate-400">Company A Signature</span>
          {deal.company_a_signed ? (
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" /> Signed
            </span>
          ) : (
            <span className="text-amber-400">Pending</span>
          )}
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-slate-400">Company B Signature</span>
          {deal.company_b_signed ? (
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" /> Signed
            </span>
          ) : (
            <span className="text-amber-400">Pending</span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-400 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Buttons based on status */}
      <div className="space-y-3">
        {deal.status === 'pending' && !hasAlreadySigned && (
          <button
            onClick={handleSignDeal}
            disabled={loading}
            className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold font-mono py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/10"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Sign & Lock Escrow
          </button>
        )}

        {deal.status === 'pending' && hasAlreadySigned && (
          <div className="text-center p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-mono">
            Waiting for counterparty signature to lock escrow.
          </div>
        )}

        {deal.status === 'active' && (
          <button
            onClick={handleSettleDeal}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold font-mono py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Settle Deal & Release Funds
          </button>
        )}

        {deal.status === 'settled' && (
          <div className="text-center p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
            Deal successfully settled & atomic credits distributed.
          </div>
        )}
      </div>
    </div>
  );
}