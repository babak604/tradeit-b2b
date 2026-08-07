'use client';

import { useState, useTransition } from 'react';
import { resolveTradeDispute } from '../../app/actions/disputes';

interface DisputeResolutionModalProps {
  dealId: string;
  companyAName?: string;
  companyBName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DisputeResolutionModal({
  dealId,
  companyAName = 'Company A (Buyer)',
  companyBName = 'Company B (Seller)',
  isOpen,
  onClose,
}: DisputeResolutionModalProps) {
  const [companyAPct, setCompanyAPct] = useState<number>(50);
  const [rationale, setRationale] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const companyBPct = 100 - companyAPct;

  const handlePresetSelect = (aPct: number) => {
    setCompanyAPct(aPct);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const result = await resolveTradeDispute({
        dealId,
        companyAPct,
        companyBPct,
        rationale,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to settle dispute.');
      } else {
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-base font-semibold text-white">
                Arbitration Dispute Settlement
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              Execute final funds distribution and record binding rationale.
            </p>
          </div>
          <span className="rounded-md border border-amber-800/60 bg-amber-950/40 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
            Admin Governance
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Quick Split Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePresetSelect(100)}
                className={`rounded-lg border py-1.5 text-xs font-medium transition-colors ${
                  companyAPct === 100
                    ? 'border-blue-500 bg-blue-950/60 text-blue-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                }`}
              >
                100% {companyAName.split(' ')[0]}
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect(50)}
                className={`rounded-lg border py-1.5 text-xs font-medium transition-colors ${
                  companyAPct === 50
                    ? 'border-purple-500 bg-purple-950/60 text-purple-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                }`}
              >
                50% / 50% Split
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect(0)}
                className={`rounded-lg border py-1.5 text-xs font-medium transition-colors ${
                  companyAPct === 0
                    ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                }`}
              >
                100% {companyBName.split(' ')[0]}
              </button>
            </div>
          </div>

          {/* Allocation Bar & Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono font-medium">
              <span className="text-blue-400">
                {companyAName}: {companyAPct}%
              </span>
              <span className="text-emerald-400">
                {companyBName}: {companyBPct}%
              </span>
            </div>

            {/* Split Visual Bar */}
            <div className="h-3 w-full rounded-full bg-slate-950 overflow-hidden flex border border-slate-800">
              <div
                className="bg-blue-600 transition-all duration-150"
                style={{ width: `${companyAPct}%` }}
              />
              <div
                className="bg-emerald-600 transition-all duration-150"
                style={{ width: `${companyBPct}%` }}
              />
            </div>

            {/* Range Input */}
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={companyAPct}
              onChange={(e) => setCompanyAPct(Number(e.target.value))}
              disabled={isPending}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Rationale Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Arbitration Rationale & Finding Notes *
            </label>
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="State the rationale based on trade agreement terms, inspection findings, and submitted evidence..."
              rows={4}
              required
              disabled={isPending}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Error Feedback */}
          {errorMessage && (
            <p className="text-xs text-red-400 bg-red-950/40 p-2.5 rounded border border-red-900">
              {errorMessage}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || rationale.trim().length < 10}
              className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
            >
              {isPending ? 'Settling Escrow...' : 'Execute Settlement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}