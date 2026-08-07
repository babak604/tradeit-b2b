'use client';

import { useState } from 'react';
import { Lock, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';

interface EscrowPanelProps {
  dealId: string;
  initialStatus: string;
  isUserA: boolean;
  signedA: boolean;
  signedB: boolean;
  lockedA: boolean;
  lockedB: boolean;
  onUpdate: () => void;
}

export default function EscrowActionPanel({
  dealId,
  initialStatus,
  isUserA,
  signedA,
  signedB,
  lockedA,
  lockedB,
  onUpdate,
}: EscrowPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userSigned = isUserA ? signedA : signedB;
  const userLocked = isUserA ? lockedA : lockedB;

  const handleEscrowAction = async (action: 'sign' | 'lock' | 'complete') => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/deals/${dealId}/escrow`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, role: isUserA ? 'A' : 'B' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update escrow state.');
      }

      onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-xl max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <h3 className="font-semibold text-lg">Atomic Escrow Control</h3>
        </div>
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-slate-800 text-slate-300 uppercase tracking-wider">
          {initialStatus.replace('_', ' ')}
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-950/50 border border-rose-800 rounded-lg text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Status Matrix */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Party A Status</p>
          <div className="flex items-center space-x-2 text-sm">
            <span className={signedA ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
              {signedA ? '✓ Signed' : 'Pending Signature'}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm mt-1">
            <span className={lockedA ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
              {lockedA ? '🔒 Locked' : 'Unlocked'}
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Party B Status</p>
          <div className="flex items-center space-x-2 text-sm">
            <span className={signedB ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
              {signedB ? '✓ Signed' : 'Pending Signature'}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm mt-1">
            <span className={lockedB ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
              {lockedB ? '🔒 Locked' : 'Unlocked'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {!userSigned && (
          <button
            onClick={() => handleEscrowAction('sign')}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 font-medium rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Sign Escrow Agreement</span>
          </button>
        )}

        {userSigned && !userLocked && (
          <button
            onClick={() => handleEscrowAction('lock')}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 font-medium rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <Lock className="w-4 h-4" />
            <span>Lock Escrow Credits</span>
          </button>
        )}

        {signedA && signedB && lockedA && lockedB && initialStatus !== 'completed' && (
          <button
            onClick={() => handleEscrowAction('complete')}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 font-medium rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <CheckCircle2 className="w-4 h-4" />
            <span>Finalize & Complete Deal</span>
          </button>
        )}
      </div>
    </div>
  );
}