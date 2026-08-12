'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ArrowRightLeft, ShieldCheck, Zap } from 'lucide-react';

const RECENT_EVENTS = [
  { id: '1', text: 'Easy Mondays Apparel swapped $8,500 inventory with Montreal Creative Studios', time: '2m ago', type: 'swap' },
  { id: '2', text: 'New 3-Way Loop Match detected: Parity Score 98%', time: '7m ago', type: 'loop' },
  { id: '3', text: 'Apex Real Estate verified Corporate Pass membership', time: '14m ago', type: 'trust' },
  { id: '4', text: 'Creative Media Hub cleared Escrow Milestone #2', time: '22m ago', type: 'escrow' },
];

export default function NetworkActivityTicker() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % RECENT_EVENTS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const current = RECENT_EVENTS[index];

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-1.5 flex items-center justify-between text-xs font-mono overflow-hidden">
      <div className="flex items-center gap-2 max-w-4xl truncate">
        <span className="flex items-center gap-1 text-red-500 font-extrabold uppercase tracking-wider text-[10px] bg-red-950/60 px-2 py-0.5 rounded border border-red-500/30">
          <Zap className="w-3 h-3 animate-pulse" /> Live Activity
        </span>
        <span className="text-slate-300 animate-in fade-in slide-in-from-bottom-1 duration-300 truncate">
          {current.text}
        </span>
      </div>
      <span className="text-[10px] text-slate-500 shrink-0 hidden sm:inline">{current.time}</span>
    </div>
  );
}