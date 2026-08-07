'use client';

import { useState } from 'react';
import { resolveDisputeAction } from '@/app/actions/disputes';

export type ResolutionOutcome = 'REFUND_BUYER' | 'RELEASE_TO_SELLER' | 'SPLIT';

interface ArbitratorResolutionModalProps {
  dealId: string;
  companyAName?: string;
  companyBName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ArbitratorResolutionModal({
  dealId,
  companyAName = 'Company A (Initiator)',
  companyBName = 'Company B (Counterparty)',
  isOpen,
  onClose,
  onSuccess,
}: ArbitratorResolutionModalProps) {
  const [outcome, setOutcome] = useState<ResolutionOutcome | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!outcome) {
      setError('Please select a resolution outcome.');
      return;
    }
    if (!notes.trim() || notes.trim().length < 15) {
      setError('Arbitrator notes are required (at least 15 characters).');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await resolveDisputeAction(dealId, outcome, notes.trim());
      setSubmitting(false);
      setShowConfirm(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to resolve dispute:', err);
      setError(err.message || 'An error occurred while finalizing dispute resolution.');
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  const outcomeOptions: {
    id: ResolutionOutcome;
    title: string;
    description: string;
    badgeColor: string;
  }[] = [
    {
      id: 'REFUND_BUYER',
      title: `Refund ${companyAName}`,
      description: 'Cancels the trade and returns escrowed assets/funds back to Party A.',
      badgeColor: 'border-blue-500/50 bg-blue-950/40 text-blue-300 hover:border-blue-400',
    },
    {
      id: 'RELEASE_TO_SELLER',
      title: `Release to ${companyBName}`,
      description: 'Disburses escrowed assets/funds to Party B in fulfillment of the deal.',
      badgeColor: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300 hover:border-emerald-400',
    },
    {
      id: 'SPLIT',
      title: 'Equal Split (50 / 50)',
      description: 'Splits held escrow assets equally between both counterparties.',
      badgeColor: 'border-purple-500/50 bg-purple-950/40 text-purple-300 hover:border-purple-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-6 relative">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 bg-amber-950/80 border border-amber-800/60 px-2 py-0.5 rounded">
              Arbitrator Privilege
            </span>
            <h2 className="text-lg font-bold text-slate-100 mt-1">Resolve Trade Dispute</h2>
            <p className="text-xs text-slate-400">
              Executing this action will finalize the escrow release and dispatch binding notices.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-slate-400 hover:text-slate-200 transition text-lg font-bold p-1"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* Outcome Selector */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            1. Select Settlement Determination
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            {outcomeOptions.map((opt) => {
              const isSelected = outcome === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setOutcome(opt.id)}
                  className={`text-left p-3.5 rounded-lg border transition ${
                    isSelected
                      ? 'border-blue-500 bg-slate-800/90 ring-1 ring-blue-500'
                      : opt.badgeColor
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-100">{opt.title}</span>
                    {isSelected && (
                      <span className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                        ✓ Selected
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{opt.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Arbitrator Rationale Notes */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            2. Arbitrator Rationale & Legal Findings <span className="text-rose-400">*</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Document key facts, evidence reviewed, and legal justification for this decision. This statement will be included in the binding settlement certificate."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none"
          />
        </div>

        {/* Action Controls / Confirmation Step */}
        {!showConfirm ? (
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!outcome) {
                  setError('Please select a resolution outcome.');
                  return;
                }
                if (!notes.trim() || notes.trim().length < 15) {
                  setError('Arbitrator notes are required (at least 15 characters).');
                  return;
                }
                setError(null);
                setShowConfirm(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition shadow-lg"
            >
              Review Settlement
            </button>
          </div>
        ) : (
          <div className="p-4 bg-amber-950/40 border border-amber-800/80 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
              <span>⚠️ Final Confirmation Check</span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              Are you sure you want to execute <strong>{outcome}</strong>? This will release or refund escrow funds irrevocably and issue settlement emails to both companies.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold rounded transition shadow"
              >
                {submitting ? 'Executing Escrow Settlement...' : 'Confirm & Execute Settlement'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}