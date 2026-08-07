// src/app/loading.tsx
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 space-y-6">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 animate-ping absolute" />
        <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-xl shadow-sky-500/20 z-10">
          T
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Initializing TradeIt.tv Marketplace Engine...</span>
      </div>

      {/* Skeleton Feed HUD Loader */}
      <div className="max-w-md w-full rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-4 animate-pulse">
        <div className="h-4 bg-slate-800 rounded-full w-1/3" />
        <div className="h-8 bg-slate-800 rounded-2xl w-3/4" />
        <div className="h-20 bg-slate-800/60 rounded-2xl w-full" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-6 bg-slate-800 rounded-full w-24" />
          <div className="h-6 bg-slate-800 rounded-full w-20" />
        </div>
      </div>
    </div>
  );
}