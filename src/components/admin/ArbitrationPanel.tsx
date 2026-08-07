'use client';

import { useState } from 'react';
import { resolveDisputeAction, ResolutionType } from '@/app/actions/arbitration';

interface ArbitrationPanelProps {
  dealId: string;
  disputeReason?: string;
  dealValue: number;
}

export function ArbitrationPanel({ dealId, disputeReason, dealValue }: ArbitrationPanelProps) {
  const [resolutionType, setResolutionType] = useState<ResolutionType>('partial_settlement');
  const [buyerRefundPct, setBuyerRefundPct] = useState<number>(50);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

  const handleTypeChange = (type: ResolutionType) => {
    setResolutionType(type);
    if (type === 'full_buyer_refund') setBuyerRefundPct(100);
    if (type === 'full_seller_release') setBuyerRefundPct(0);
  };

  const buyerAmount = (dealValue * (buyerRefundPct / 100)).toFixed(2);
  const sellerAmount = (dealValue * ((100 - buyerRefundPct) / 100)).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    const res = await resolveDisputeAction({
      dealId,
      resolutionType,
      buyerRefundPct,
      notes,
    });

    setLoading(false);
    if (res.success) {
      setFeedback({ success: true, message: 'Dispute successfully arbitrated and status updated.' });
    } else {
      setFeedback({ success: false, message: res.error || 'Failed to resolve dispute.' });
    }
  };

  return (
    <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm dark:border-red-900/50 dark:bg-zinc-900">
      <div className="mb-4 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Admin Arbitration Panel
        </h3>
        <p className="text-sm text-zinc-500">Deal ID: {dealId}</p>
      </div>

      {disputeReason && (
        <div className="mb-6 rounded-md bg-red-50 p-4 dark:bg-red-950/30">
          <span className="text-xs font-semibold uppercase tracking-wider text-red-800 dark:text-red-400">
            Dispute Reason Raised:
          </span>
          <p className="mt-1 text-sm text-red-900 dark:text-red-200">{disputeReason}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Preset Resolution Selector */}
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Resolution Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleTypeChange('full_buyer_refund')}
              className={`rounded-md border p-3 text-sm font-medium transition ${
                resolutionType === 'full_buyer_refund'
                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                  : 'border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              Full Buyer Refund (100%)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('full_seller_release')}
              className={`rounded-md border p-3 text-sm font-medium transition ${
                resolutionType === 'full_seller_release'
                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                  : 'border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              Full Release to Seller (100%)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('partial_settlement')}
              className={`rounded-md border p-3 text-sm font-medium transition ${
                resolutionType === 'partial_settlement'
                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                  : 'border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              Custom Partial Split
            </button>
          </div>
        </div>

        {/* Custom Split Range Slider */}
        {resolutionType === 'partial_settlement' && (
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
            <div className="mb-2 flex justify-between text-sm font-medium">
              <span>Buyer Refund: {buyerRefundPct}% (${buyerAmount})</span>
              <span>Seller Payout: {100 - buyerRefundPct}% (${sellerAmount})</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={buyerRefundPct}
              onChange={(e) => setBuyerRefundPct(Number(e.target.value))}
              className="h-2 w-full cursor-pointer rounded-lg bg-zinc-200 accent-blue-600 dark:bg-zinc-700"
            />
          </div>
        )}

        {/* Resolution Notes */}
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Arbitration Notes & Rationale *
          </label>
          <textarea
            required
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Provide explicit reasons for this settlement decision..."
            className="w-full rounded-md border border-zinc-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        {feedback && (
          <div
            className={`rounded-md p-3 text-sm ${
              feedback.success
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300'
            }`}
          >
            {feedback.message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
        >
          {loading ? 'Processing Arbitration...' : 'Finalize & Execute Dispute Resolution'}
        </button>
      </form>
    </div>
  );
}