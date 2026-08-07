'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface TradeProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCompanyId: string;
  targetCompanyName: string;
  targetListingId: string;
  targetListingTitle: string;
  targetListingValue: number;
  availableBalance: number;
  onProposalSubmitted?: () => void;
}

export default function TradeProposalModal({
  isOpen,
  onClose,
  targetCompanyId,
  targetCompanyName,
  targetListingId,
  targetListingTitle,
  targetListingValue,
  availableBalance,
  onProposalSubmitted,
}: TradeProposalModalProps) {
  const [offeredCredits, setOfferedCredits] = useState<number>(targetListingValue);
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (offeredCredits > availableBalance) {
      setError(`Insufficient available trade credits (${availableBalance.toLocaleString()} TC available).`);
      return;
    }

    if (offeredCredits <= 0) {
      setError('Offered credits must be greater than 0.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      // 1. Initiate trade proposal and execute escrow lock via atomic RPC call
      const { error: rpcError } = await supabase.rpc('lock_escrow_credits', {
        p_target_company_id: targetCompanyId,
        p_listing_id: targetListingId,
        p_credit_amount: offeredCredits,
        p_note: note,
      });

      if (rpcError) throw rpcError;

      // Reset form & trigger callbacks
      setNote('');
      if (onProposalSubmitted) onProposalSubmitted();
      onClose();
    } catch (err: unknown) {
      console.error('Trade proposal error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit proposal and lock escrow.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
              Initiate Trade Proposal
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Target Partner: <span className="text-zinc-200 font-medium">{targetCompanyName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 text-sm font-mono p-1 rounded-md hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Listing Context */}
        <div className="my-4 p-3 rounded-lg bg-zinc-900/80 border border-zinc-800/80 text-xs font-mono flex justify-between items-center">
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">Item / Service</span>
            <span className="text-zinc-200 font-sans font-medium text-sm">{targetListingTitle}</span>
          </div>
          <div className="text-right">
            <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">List Value</span>
            <span className="text-amber-400 font-bold">{targetListingValue.toLocaleString()} TC</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-md bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmitProposal} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Trade Credits Offered
              </label>
              <span className="text-[11px] font-mono text-zinc-400">
                Available: <span className="text-emerald-400 font-semibold">{availableBalance.toLocaleString()} TC</span>
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={offeredCredits}
                onChange={(e) => setOfferedCredits(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
              <span className="absolute right-3 top-2.5 text-xs font-mono text-zinc-500">TC</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Proposal Terms / Delivery Notes
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Specify deliverable expectations, milestone schedules, or custom terms..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors resize-none placeholder:text-zinc-600"
            />
          </div>

          <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/50 text-[11px] font-mono text-zinc-400 space-y-1">
            <p className="flex items-center gap-1.5">
              <span className="text-amber-400">🔒</span>
              Credits are safely locked in escrow until both parties confirm delivery.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-zinc-950 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin h-3 w-3 border-2 border-zinc-950 border-t-transparent rounded-full" />
                  Locking Escrow...
                </>
              ) : (
                'Submit & Lock Escrow'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}