'use client';

import { useState, useTransition } from 'react';
import { useEscrowRealtime } from '@/hooks/useEscrowRealtime';
import {
  lockEscrowAction,
  settleEscrowAction,
  cancelEscrowAction,
} from '@/app/actions/escrow';

type DealStatus = 'draft' | 'locked' | 'settled' | 'cancelled';

interface EscrowControlPanelProps {
  dealId: string;
  currentUserId: string;
  companyAId: string;
  companyBId: string;
  dealStatus: DealStatus;
  escrowAmount: number;
}

export default function EscrowControlPanel({
  dealId,
  currentUserId,
  companyAId,
  companyBId,
  dealStatus,
  escrowAmount,
}: EscrowControlPanelProps) {
  // ⚡ Live Websocket Listener: Auto-refreshes component when DB state changes
  useEscrowRealtime(dealId);

  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPartyA = currentUserId === companyAId;
  const isPartyB = currentUserId === companyBId;
  const isParticipant = isPartyA || isPartyB;

  const handleLock = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await lockEscrowAction(dealId, escrowAmount);
      if (!res.success) setErrorMessage(res.error || 'Failed to lock escrow.');
    });
  };

  const handleSettle = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await settleEscrowAction(dealId);
      if (!res.success) setErrorMessage(res.error || 'Failed to settle deal.');
    });
  };

  const handleCancel = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await cancelEscrowAction(dealId);
      if (!res.success) setErrorMessage(res.error || 'Failed to cancel deal.');
    });
  };

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-lg text-neutral-100">
      {/* Header & Status Badge */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
        <div>
          <h3 className="text-lg font-semibold">Trade Escrow Control</h3>
          <p className="text-sm text-neutral-400">
            Escrow Amount: <span className="font-mono text-emerald-400">${escrowAmount.toLocaleString()}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-neutral-400">Status:</span>
          <StatusBadge status={dealStatus} />
        </div>
      </div>

      {/* Error Output Banner */}
      {errorMessage && (
        <div className="mb-4 rounded-md bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
          {errorMessage}
        </div>
      )}

      {/* Action Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* LOCK ESCROW: Only Party A, when draft */}
        {dealStatus === 'draft' && isPartyA && (
          <button
            onClick={handleLock}
            disabled={isPending}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 transition-all"
          >
            {isPending ? 'Locking Funds...' : `Lock $${escrowAmount} in Escrow`}
          </button>
        )}

        {/* SETTLE ESCROW: Either participant, when locked */}
        {dealStatus === 'locked' && isParticipant && (
          <button
            onClick={handleSettle}
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-all"
          >
            {isPending ? 'Settling Trade...' : 'Confirm & Settle Escrow'}
          </button>
        )}

        {/* CANCEL ESCROW: Either participant, when draft or locked */}
        {(dealStatus === 'draft' || dealStatus === 'locked') && isParticipant && (
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-700 hover:text-white disabled:opacity-50 transition-all"
          >
            {isPending ? 'Cancelling...' : 'Cancel & Refund Escrow'}
          </button>
        )}

        {/* NON-PARTICIPANT / READ-ONLY VIEW */}
        {!isParticipant && (
          <p className="text-xs text-neutral-500 italic">
            You are viewing this deal as a read-only spectator.
          </p>
        )}

        {/* COMPLETED / TERMINATED STATES */}
        {dealStatus === 'settled' && (
          <p className="text-sm text-emerald-400 font-medium">
            ✓ Deal complete. Escrow funds released to Party B.
          </p>
        )}
        {dealStatus === 'cancelled' && (
          <p className="text-sm text-neutral-400 font-medium">
            ✕ Deal cancelled. Escrow refunded to Party A.
          </p>
        )}
      </div>
    </div>
  );
}

/** Helper component for state badge formatting */
function StatusBadge({ status }: { status: DealStatus }) {
  const styles: Record<DealStatus, string> = {
    draft: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    locked: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    settled: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    cancelled: 'bg-neutral-800 text-neutral-400 border-neutral-700',
  };

  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}