'use client';

import { useState } from 'react';
import { signDealAction, settleDealAction } from '@/app/actions/deals';

export interface DealDetails {
  id: string;
  status: 'draft' | 'pending_signatures' | 'in_escrow' | 'settled' | 'cancelled';
  value_credits: number;
  initiator_id: string;
  receiver_id: string;
  initiator_signed: boolean;
  receiver_signed: boolean;
}

interface DealActionBarProps {
  deal: DealDetails;
  currentUserId: string;
}

export function DealActionBar({ deal, currentUserId }: DealActionBarProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isInitiator = currentUserId === deal.initiator_id;
  const isReceiver = currentUserId === deal.receiver_id;
  const mySignature = isInitiator ? deal.initiator_signed : deal.receiver_signed;
  const counterpartSignature = isInitiator ? deal.receiver_signed : deal.initiator_signed;

  const handleSign = async () => {
    setLoading(true);
    setErrorMessage(null);

    const res = await signDealAction(deal.id);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to sign deal.');
    }
    setLoading(false);
  };

  const handleSettle = async () => {
    if (!confirm('Are you sure you want to release escrow credits to complete this deal? This action is non-reversible.')) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const res = await settleDealAction(deal.id);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to settle deal.');
    }
    setLoading(false);
  };

  const getStatusBadge = () => {
    switch (deal.status) {
      case 'draft':
      case 'pending_signatures':
        return <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">Pending Signatures</span>;
      case 'in_escrow':
        return <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20">Credits Locked in Escrow</span>;
      case 'settled':
        return <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">Deal Completed & Settled</span>;
      default:
        return <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-400">{deal.status}</span>;
    }
  };

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-md mb-6">
      {errorMessage && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Deal Overview */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">Barter Agreement</h2>
            {getStatusBadge()}
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Escrow Value: <span className="font-semibold text-emerald-400">{deal.value_credits || 0} Credits</span>
          </p>
        </div>

        {/* Signature Tracker & Controls */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Status Indicators */}
          <div className="flex items-center gap-3 border-r border-slate-800 pr-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${mySignature ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <span className="text-slate-300">You ({mySignature ? 'Signed' : 'Unsigned'})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${counterpartSignature ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <span className="text-slate-300">Partner ({counterpartSignature ? 'Signed' : 'Unsigned'})</span>
            </div>
          </div>

          {/* Action Buttons */}
          {(deal.status === 'draft' || deal.status === 'pending_signatures') && (
            <button
              onClick={handleSign}
              disabled={loading || mySignature || (!isInitiator && !isReceiver)}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg transition-all hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Locking Escrow...' : mySignature ? 'Escrow Locked & Signed' : 'Sign & Lock Credits'}
            </button>
          )}

          {deal.status === 'in_escrow' && (
            <button
              onClick={handleSettle}
              disabled={loading || (!isInitiator && !isReceiver)}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg transition-all hover:bg-emerald-500 disabled:opacity-50"
            >
              {loading ? 'Releasing Credits...' : 'Release Escrow & Settle'}
            </button>
          )}

          {deal.status === 'settled' && (
            <div className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium text-emerald-400">
              ✓ Transaction Settled
            </div>
          )}
        </div>
      </div>
    </div>
  );
}