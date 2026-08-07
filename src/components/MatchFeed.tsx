'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  lockTradeEscrowAction,
  settleTradeEscrowAction,
  cancelTradeEscrowAction,
} from '@/app/actions/trades';

// Strictly aligned with Postgres deal_status enum
export type EscrowStatus =
  | 'draft'
  | 'pending'
  | 'pending_signatures'
  | 'accepted'
  | 'active'
  | 'settled'
  | 'completed'
  | 'cancelled';

export interface TradeMatch {
  id: string;
  title: string;
  offeredItem: string;
  requestedItem: string;
  creditValue: number;
  status: EscrowStatus;
}

interface MatchFeedProps {
  initialMatches?: TradeMatch[];
}

export default function MatchFeed({ initialMatches = [] }: MatchFeedProps) {
  const router = useRouter();
  const [matches, setMatches] = useState<TradeMatch[]>(initialMatches ?? []);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string | null>>({});

  // Helper to manage loading states per match ID
  const setItemLoading = (id: string, isLoading: boolean) => {
    setLoadingMap((prev) => ({ ...prev, [id]: isLoading }));
  };

  // Helper to manage inline error messages per match ID
  const setItemError = (id: string, error: string | null) => {
    setErrorMap((prev) => ({ ...prev, [id]: error }));
  };

  // Helper to transition state in client UI
  const updateMatchStatus = (id: string, newStatus: EscrowStatus) => {
    setMatches((prev) =>
      (prev ?? []).map((m) => (m.id === id ? { ...m, status: newStatus } : m))
    );
  };

  // ============================================================================
  // 1. LOCK ESCROW CREDITS (Pending / Accepted -> Active)
  // ============================================================================
  const handleLock = async (matchId: string, creditValue: number) => {
    setItemLoading(matchId, true);
    setItemError(matchId, null);

    try {
      const result = await lockTradeEscrowAction(matchId, creditValue);

      if (!result.success) {
        setItemError(matchId, result.error || 'Failed to lock escrow credits.');
        return;
      }

      // Transition to 'active' (Credits locked in escrow)
      updateMatchStatus(matchId, 'active');
      router.refresh();
    } catch (err) {
      console.error('Error locking escrow:', err);
      setItemError(matchId, 'An unexpected error occurred while locking credits.');
    } finally {
      setItemLoading(matchId, false);
    }
  };

  // ============================================================================
  // 2. SETTLE TRADE & ESCROW (Active -> Settled)
  // ============================================================================
  const handleSettle = async (matchId: string) => {
    setItemLoading(matchId, true);
    setItemError(matchId, null);

    try {
      const result = await settleTradeEscrowAction(matchId);

      if (!result.success) {
        setItemError(matchId, result.error || 'Failed to settle trade.');
        return;
      }

      // Transition to 'settled'
      updateMatchStatus(matchId, 'settled');
      router.refresh();
    } catch (err) {
      console.error('Error settling escrow:', err);
      setItemError(matchId, 'An unexpected error occurred while settling trade.');
    } finally {
      setItemLoading(matchId, false);
    }
  };

  // ============================================================================
  // 3. CANCEL ESCROW & REFUND CREDITS (Active / Pending -> Cancelled)
  // ============================================================================
  const handleCancel = async (matchId: string, creditValue: number) => {
    setItemLoading(matchId, true);
    setItemError(matchId, null);

    try {
      const result = await cancelTradeEscrowAction(matchId, creditValue);

      if (!result.success) {
        setItemError(matchId, result.error || 'Failed to cancel escrow.');
        return;
      }

      // Transition to 'cancelled'
      updateMatchStatus(matchId, 'cancelled');
      router.refresh();
    } catch (err) {
      console.error('Error cancelling escrow:', err);
      setItemError(matchId, 'An unexpected error occurred while refunding credits.');
    } finally {
      setItemLoading(matchId, false);
    }
  };

  // Safe fallback variable to guarantee an array is evaluated
  const activeMatches = matches ?? [];

  return (
    <div className="space-y-4 max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-bold tracking-tight">Active Trade Matches</h2>

      {activeMatches.length === 0 ? (
        <p className="text-gray-500">No active matches found.</p>
      ) : (
        activeMatches.map((match) => {
          const isLoading = !!loadingMap[match.id];
          const errorMessage = errorMap[match.id];

          return (
            <div
              key={match.id}
              className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              {/* Card Metadata */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{match.title}</h3>
                  <StatusBadge status={match.status} />
                </div>
                <p className="text-sm text-gray-600">
                  Offering <span className="font-medium text-gray-900">{match.offeredItem}</span> for{' '}
                  <span className="font-medium text-gray-900">{match.requestedItem}</span>
                </p>
                <p className="text-xs font-mono text-gray-500">
                  Escrow Value: {match.creditValue} Credits
                </p>

                {/* Inline Error Display */}
                {errorMessage && (
                  <p className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded mt-2">
                    {errorMessage}
                  </p>
                )}
              </div>

              {/* State Machine Action Controls */}
              <div className="flex items-center gap-2">
                {/* 1. Unlocked Deals Ready for Escrow Locking */}
                {(match.status === 'pending' || match.status === 'accepted') && (
                  <button
                    onClick={() => handleLock(match.id, match.creditValue)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? 'Locking...' : 'Lock Escrow'}
                  </button>
                )}

                {/* 2. Escrow Locked & Active (Ready for Settlement or Cancellation) */}
                {match.status === 'active' && (
                  <>
                    <button
                      onClick={() => handleSettle(match.id)}
                      disabled={isLoading}
                      className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      {isLoading ? 'Settling...' : 'Complete Trade'}
                    </button>
                    <button
                      onClick={() => handleCancel(match.id, match.creditValue)}
                      disabled={isLoading}
                      className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors"
                    >
                      {isLoading ? 'Cancelling...' : 'Refund & Cancel'}
                    </button>
                  </>
                )}

                {/* 3. Waiting Stage */}
                {match.status === 'pending_signatures' && (
                  <span className="text-xs text-purple-700 font-medium bg-purple-50 px-3 py-1.5 rounded-md border border-purple-200">
                    Awaiting Party Signatures
                  </span>
                )}

                {/* 4. Draft Stage */}
                {match.status === 'draft' && (
                  <span className="text-xs text-gray-500 font-medium italic">
                    Draft Stage
                  </span>
                )}

                {/* 5. Terminal States */}
                {(match.status === 'settled' ||
                  match.status === 'completed' ||
                  match.status === 'cancelled') && (
                  <span className="text-xs text-gray-400 font-medium italic">
                    Transaction Finalized
                  </span>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/**
 * Status Badge Sub-component
 */
function StatusBadge({ status }: { status: EscrowStatus }) {
  const styles: Record<EscrowStatus, string> = {
    draft: 'bg-gray-100 text-gray-600 border-gray-300',
    pending: 'bg-yellow-50 text-yellow-800 border-yellow-300',
    pending_signatures: 'bg-purple-50 text-purple-800 border-purple-300',
    accepted: 'bg-blue-50 text-blue-800 border-blue-300',
    active: 'bg-amber-50 text-amber-800 border-amber-300',
    settled: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    completed: 'bg-emerald-100 text-emerald-900 border-emerald-400',
    cancelled: 'bg-red-50 text-red-800 border-red-300',
  };

  const labels: Record<EscrowStatus, string> = {
    draft: 'Draft',
    pending: 'Pending',
    pending_signatures: 'Awaiting Signatures',
    accepted: 'Accepted',
    active: 'Credits Escrowed',
    settled: 'Settled',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded border font-medium ${styles[status]}`}
    >
      {labels[status] ?? status}
    </span>
  );
}