'use client';

import { CircularLoopMatch } from '@/lib/matcher/circularTradeAgent';
import { RefreshCw, Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface CircularLoopBannerProps {
  loops: CircularLoopMatch[];
  onInitiateLoop: (loop: CircularLoopMatch) => void;
}

export default function CircularLoopBanner({ loops, onInitiateLoop }: CircularLoopBannerProps) {
  if (!loops || loops.length === 0) {
    // High-impact active default mock loop for demonstration
    const demoLoop: CircularLoopMatch = {
      loop_id: 'loop-demo-3way',
      parity_score: 98,
      total_liquidity_unlocked: 16500,
      node_a: { id: '1', company_name: 'Montreal Creative', offering_summary: '4K Studio Production', looking_for_summary: 'Office Space', estimated_value: 5500, category: 'B2B Services' },
      node_b: { id: '2', company_name: 'St-Laurent Tech Hub', offering_summary: 'Furnished Workspace', looking_for_summary: 'Legal Counsel', estimated_value: 5500, category: 'Real Estate' },
      node_c: { id: '3', company_name: 'Apex Legal Partners', offering_summary: 'Corporate Counsel', looking_for_summary: 'Video Production', estimated_value: 5500, category: 'B2B Services' },
    };
    return <LoopDisplay loop={demoLoop} onInitiateLoop={onInitiateLoop} />;
  }

  return <LoopDisplay loop={loops[0]} onInitiateLoop={onInitiateLoop} />;
}

function LoopDisplay({ loop, onInitiateLoop }: { loop: CircularLoopMatch; onInitiateLoop: (loop: CircularLoopMatch) => void }) {
  return (
    <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-950 border border-red-500/30 p-5 rounded-3xl shadow-2xl space-y-4 relative overflow-hidden group">
      
      {/* Background Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-red-600/10 blur-3xl rounded-full pointer-events-none" />

      {/* Header Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-600/20 rounded-lg text-red-500 border border-red-500/30">
            <RefreshCw className="w-4 h-4 animate-spin" style={{ animationDuration: '10s' }} />
          </div>
          <div>
            <h3 className="text-xs font-black text-white tracking-wider flex items-center gap-2">
              3-WAY CIRCULAR TRADE LOOP DETECTED <span className="text-[10px] bg-red-600 text-white font-mono px-2 py-0.5 rounded-full">AI Match</span>
            </h3>
            <p className="text-[11px] text-slate-400">Zero-cash multi-sided trade circuit discovered by agent.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> {loop.parity_score}% Parity
          </span>
          <span className="text-slate-300 font-bold bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            ${loop.total_liquidity_unlocked.toLocaleString()} CAD Unlocked
          </span>
        </div>
      </div>

      {/* The 3 Nodes Circuit Flow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* Node A */}
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl space-y-1">
          <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider">Node A</span>
          <p className="text-xs font-black text-white truncate">{loop.node_a.company_name}</p>
          <p className="text-[11px] text-slate-300 line-clamp-1"><strong className="text-emerald-400">Gives:</strong> {loop.node_a.offering_summary}</p>
          <p className="text-[11px] text-slate-400 line-clamp-1"><strong className="text-blue-400">To:</strong> {loop.node_b.company_name}</p>
        </div>

        {/* Node B */}
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl space-y-1">
          <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Node B</span>
          <p className="text-xs font-black text-white truncate">{loop.node_b.company_name}</p>
          <p className="text-[11px] text-slate-300 line-clamp-1"><strong className="text-emerald-400">Gives:</strong> {loop.node_b.offering_summary}</p>
          <p className="text-[11px] text-slate-400 line-clamp-1"><strong className="text-blue-400">To:</strong> {loop.node_c.company_name}</p>
        </div>

        {/* Node C */}
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl space-y-1">
          <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Node C</span>
          <p className="text-xs font-black text-white truncate">{loop.node_c.company_name}</p>
          <p className="text-[11px] text-slate-300 line-clamp-1"><strong className="text-emerald-400">Gives:</strong> {loop.node_c.offering_summary}</p>
          <p className="text-[11px] text-slate-400 line-clamp-1"><strong className="text-blue-400">To:</strong> {loop.node_a.company_name}</p>
        </div>

      </div>

      {/* CTA Trigger */}
      <button
        onClick={() => onInitiateLoop(loop)}
        className="w-full bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs py-2.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 transition-all cursor-pointer"
      >
        <Zap className="w-3.5 h-3.5" />
        <span>Initiate 3-Way Circuit Transaction</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

    </div>
  );
}