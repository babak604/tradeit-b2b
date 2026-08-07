'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { executeSignDeal } from '@/app/deals/actions';

interface SignDealCardProps {
  dealId: string;
  creditAmount: number;
  status: string;
  isPartyA: boolean;
  isPartyB: boolean;
  currentUserId: string;
}

export function SignDealCard({
  dealId,
  creditAmount,
  status,
  isPartyA,
  isPartyB,
}: SignDealCardProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSign = async () => {
    setLoading(true);
    setErrorMessage(null);

    const result = await executeSignDeal(dealId);

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to sign deal. Check wallet balance.');
    }
    setLoading(false);
  };

  const isSignedAndFunded = status === 'funded_in_escrow' || status === 'completed';

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl border ${
            isSignedAndFunded 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
          }`}>
            {isSignedAndFunded ? <ShieldCheck className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Escrow Agreement</h3>
            <p className="text-xs font-mono text-slate-400">
              {isSignedAndFunded ? 'Credits locked securely in vault' : 'Awaiting mutual agreement'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">Escrow Value</span>
          <span className="text-base font-mono font-bold text-emerald-400">
            ${creditAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 font-mono">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-4">
        <div className="text-xs text-slate-400">
          Status: <span className="font-mono font-semibold text-sky-400 uppercase">{status}</span>
        </div>

        {status === 'draft' || status === 'pending_signature' ? (
          <button
            onClick={handleSign}
            disabled={loading || (!isPartyA && !isPartyB)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-sky-500/10"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Locking Escrow...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Sign & Lock Escrow
              </>
            )}
          </button>
        ) : isSignedAndFunded ? (
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            <CheckCircle2 className="w-4 h-4" />
            Escrow Funded
          </div>
        ) : null}
      </div>
    </div>
  );
}