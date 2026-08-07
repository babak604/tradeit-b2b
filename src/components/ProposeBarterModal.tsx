'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import { createDealAction } from '@/app/actions/deals';
import { Sparkles, X, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

interface ProposeBarterModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: {
    id: string;
    title: string;
    credits: number;
    user_id: string;
  };
}

export function ProposeBarterModal({ isOpen, onClose, offer }: ProposeBarterModalProps) {
  const [proposedTerms, setProposedTerms] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposedTerms.trim() || loading) return;

    setLoading(true);
    setError(null);

    const res = await createDealAction({
      offerId: offer.id,
      receiverId: offer.user_id,
      proposedTerms: proposedTerms.trim(),
    });

    if (!res.success || !res.data) {
      setError(res.error || 'Failed to initiate proposal.');
      setLoading(false);
      return;
    }

    // Redirect straight into the Deal Room for the newly created proposal
    window.location.href = `/deals/${res.data.id}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white">Propose Barter Deal</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Offer Target */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider">
            Target Service / Provision
          </div>
          <div className="text-sm font-extrabold text-white">{offer.title}</div>
          <div className="text-xs font-mono text-emerald-400 font-bold">
            ${offer.credits.toLocaleString()} Estimated Value
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-2">
              Proposed Scope & Terms
            </label>
            <textarea
              rows={4}
              value={proposedTerms}
              onChange={(e) => setProposedTerms(e.target.value)}
              placeholder="Outline what services/credits you are willing to offer in return..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono leading-relaxed resize-none"
              required
            />
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs text-slate-400 hover:text-white font-mono transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !proposedTerms.trim()}
              className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating Deal Room...
                </>
              ) : (
                <>
                  Open Deal Room <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}