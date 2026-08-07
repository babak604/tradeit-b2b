'use client';

import { useState, useTransition } from 'react';
import { generateBarterMatchesAction, BarterMatch } from '@/app/actions/matchmaker';
import { Sparkles, Building2, Coins, ArrowRight, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function MatchmakerPage() {
  const [matches, setMatches] = useState<BarterMatch[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRunMatchmaker = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await generateBarterMatchesAction();
      if (res.success && res.matches) {
        setMatches(res.matches);
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-6">
          <Link
            href="/deals"
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Deals Dashboard</span>
          </Link>
          <span className="text-xs font-mono px-3 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-full flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Vercel AI SDK Engine Active
          </span>
        </div>

        {/* Title & Engine Trigger */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-sky-400" />
              <span>AI Barter Matchmaker</span>
            </h1>
            <p className="text-xs font-mono text-slate-400">
              Autonomously discover counterparty trade opportunities across the directory.
            </p>
          </div>

          <button
            onClick={handleRunMatchmaker}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-mono font-black text-xs transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
            <span>{isPending ? 'Scanning Synergy Matrix...' : 'Run AI Synergy Scan'}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Empty State */}
        {!isPending && matches.length === 0 && (
          <div className="text-center py-20 bg-slate-900/40 border border-slate-900 rounded-3xl space-y-4">
            <Sparkles className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-300">No active AI matches generated yet</h3>
              <p className="text-xs font-mono text-slate-500">Click &apos;Run AI Synergy Scan&apos; to query directory counterparty compatibility.</p>
            </div>
          </div>
        )}

        {/* Matches Grid */}
        <div className="grid grid-cols-1 gap-6">
          {matches.map((match, idx) => (
            <div
              key={idx}
              className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 hover:border-slate-700 transition-all space-y-6"
            >
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">{match.counterparty_company_name}</h2>
                    <span className="text-xs font-mono text-slate-500">ID: {match.counterparty_company_id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" />
                    <span>Est. {match.suggested_credit_amount.toLocaleString()} CR</span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 font-mono text-xs font-bold">
                    {match.match_score}% Synergy
                  </div>
                </div>
              </div>

              {/* Rationale */}
              <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl text-xs font-sans text-slate-300 leading-relaxed">
                <span className="font-mono text-[10px] text-sky-400 uppercase tracking-wider block mb-1">
                  AI Match Rationale
                </span>
                {match.match_rationale}
              </div>

              {/* Deliverables Preview Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Your Proposed Deliverable</span>
                  <p className="text-xs text-slate-300">{match.my_proposed_deliverable}</p>
                </div>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Their Proposed Deliverable</span>
                  <p className="text-xs text-slate-300">{match.their_proposed_deliverable}</p>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-2">
                <Link
                  href={`/deals/new?party_b_id=${match.counterparty_company_id}&credits=${match.suggested_credit_amount}`}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/15"
                >
                  <span>Initiate Proposal with AI Terms</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}