'use client';

// src/app/error.tsx
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Runtime Application Exception:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center space-y-6 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-white">Execution Exception Intercepted</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The marketplace engine encountered an unexpected client state issue.
          </p>
          {error.digest && (
            <div className="text-[10px] font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-500">
              Digest: {error.digest}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-sky-500/20"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-sync Session
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-2 transition-colors"
          >
            <Home className="w-3.5 h-3.5" /> Feed Home
          </Link>
        </div>
      </div>
    </div>
  );
}