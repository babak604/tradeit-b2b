'use client';

import { useState, useTransition } from 'react';
import { signoffInspectionAction, raiseDisputeAction } from '@/app/actions/inspection';

interface InspectionPanelProps {
  dealId: string;
  userCompanyId: string;
  companyAId: string;
  companyBId: string;
  status: 'draft' | 'locked' | 'settled' | 'cancelled' | 'disputed';
  partyAInspected: boolean;
  partyBInspected: boolean;
  disputeReason?: string | null;
}

export function InspectionPanel({
  dealId,
  userCompanyId,
  companyAId,
  companyBId,
  status,
  partyAInspected,
  partyBInspected,
  disputeReason,
}: InspectionPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [reasonInput, setReasonInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isPartyA = userCompanyId === companyAId;
  const isPartyB = userCompanyId === companyBId;
  const userHasSigned = isPartyA ? partyAInspected : isPartyB ? partyBInspected : false;

  const handleSignoff = () => {
    setError(null);
    startTransition(async () => {
      const res = await signoffInspectionAction(dealId, userCompanyId);
      if (!res.success) setError(res.error || 'Failed to sign off inspection.');
    });
  };

  const handleRaiseDispute = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await raiseDisputeAction(dealId, userCompanyId, reasonInput);
      if (!res.success) {
        setError(res.error || 'Failed to freeze escrow.');
      } else {
        setIsDisputeOpen(false);
      }
    });
  };

  if (status === 'disputed') {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-slate-200">
        <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
          <span>⚠️ Escrow Frozen: Trade Disputed</span>
        </div>
        <p className="mt-2 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
          <strong className="text-slate-400">Reason:</strong> {disputeReason || 'No reason provided.'}
        </p>
        <p className="mt-2 text-[11px] text-slate-500">
          Escrow settlement and refunds are paused pending administrative arbitration.
        </p>
      </div>
    );
  }

  if (status !== 'locked') return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Goods & Services Inspection Sign-off
        </h4>

        {/* Mutual Sign-off Indicators */}
        <div className="flex items-center gap-2 text-xs">
          <span className={`px-2 py-0.5 rounded border ${partyAInspected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
            Party A: {partyAInspected ? '✓ Signed' : 'Pending'}
          </span>
          <span className={`px-2 py-0.5 rounded border ${partyBInspected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
            Party B: {partyBInspected ? '✓ Signed' : 'Pending'}
          </span>
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        {!userHasSigned ? (
          <button
            onClick={handleSignoff}
            disabled={isPending}
            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? 'Signing...' : 'Approve & Sign-off Inspection'}
          </button>
        ) : (
          <span className="text-xs text-emerald-400 font-medium">✓ Your company approved inspection</span>
        )}

        <button
          onClick={() => setIsDisputeOpen(true)}
          disabled={isPending}
          className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium px-3 py-1.5 rounded-lg transition-colors ml-auto"
        >
          Freeze Escrow & Dispute
        </button>
      </div>

      {/* Dispute Modal */}
      {isDisputeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleRaiseDispute} className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">Raise Escrow Dispute</h3>
            <p className="text-xs text-slate-400">
              Freezing escrow immediately halts settlement or automatic release. Describe the discrepancy or failed delivery.
            </p>
            <textarea
              required
              rows={4}
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              placeholder="E.g., Inspection failed: Delivered hardware model does not match contract serial numbers."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDisputeOpen(false)}
                className="text-xs px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !reasonInput.trim()}
                className="text-xs px-3 py-1.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-500 disabled:opacity-50"
              >
                {isPending ? 'Freezing...' : 'Confirm & Freeze Escrow'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}