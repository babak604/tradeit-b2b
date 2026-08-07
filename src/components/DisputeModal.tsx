'use client';

import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, Loader2, X } from 'lucide-react';
import { raiseDealDisputeAction } from '@/app/actions/disputes';

interface DisputeModalProps {
  dealId: string;
  isOpen: boolean;
  onClose: () => void;
  onDisputeSuccess: () => void;
}

export function DisputeModal({ dealId, isOpen, onClose, onDisputeSuccess }: DisputeModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await raiseDealDisputeAction(dealId, reason);

    if (res.success) {
      setReason('');
      onDisputeSuccess();
      onClose();
    } else {
      setError(res.error || 'Failed to freeze escrow.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5 text-rose-400 font-mono text-sm font-bold">
            <ShieldAlert className="w-5 h-5" />
            <span>Raise Deal Dispute</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 font-sans leading-relaxed">
          Raising a dispute will immediately freeze escrow credits. Neither party can execute settlement until support reviews the deliverable attachments.
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">
              Reason for Contesting Deliverables
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Party B deliverable zip file is missing source files or contains invalid assets."
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500 font-sans"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 text-xs font-mono hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-2 shadow-lg shadow-rose-500/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
              <span>Freeze Escrow & Dispute</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}