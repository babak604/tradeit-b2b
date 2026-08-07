'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface WalletData {
  available_credits: number;
  escrow_credits: number;
}

const DEV_MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';

export default function WalletDashboard({ initialUserId }: { initialUserId?: string }) {
  const [wallet, setWallet] = useState<WalletData>({
    available_credits: 50000, // Dev fallback default
    escrow_credits: 12500,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const userId = initialUserId || DEV_MOCK_USER_ID;

  useEffect(() => {
    async function fetchBalance() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        // 💡 maybeSingle() prevents 406 / HTTP crashes when zero rows exist
        const { data, error: fetchError } = await supabase
          .from('user_balances')
          .select('available_credits, escrow_credits')
          .eq('user_id', userId)
          .maybeSingle();

        if (fetchError) {
          console.warn('Wallet fetch warning:', fetchError.message);
          setError('Could not fetch live balance. Showing cached/fallback data.');
        } else if (data) {
          setWallet({
            available_credits: Number(data.available_credits ?? 0),
            escrow_credits: Number(data.escrow_credits ?? 0),
          });
        } else {
          // Row doesn't exist yet for this user ID
          setWallet({ available_credits: 0, escrow_credits: 0 });
        }
      } catch (err: any) {
        console.error('Unexpected wallet error:', err);
        setError('Database connection offline.');
      } finally {
        setLoading(false);
      }
    }

    fetchBalance();
  }, [userId]);

  const totalValuation = wallet.available_credits + wallet.escrow_credits;

  return (
    <div className="w-full rounded-xl border border-slate-800 bg-slate-950 p-6 text-slate-100 shadow-lg">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Corporate Credit Wallet</h2>
          <p className="text-xs text-slate-400">Account ID: <code className="text-indigo-400">{userId.slice(0, 8)}...</code></p>
        </div>
        {loading && (
          <span className="inline-flex items-center gap-2 text-xs text-indigo-400 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
            Syncing Ledger...
          </span>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-400">
          ⚠️ {error}
        </div>
      )}

      {/* Credit Metric Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Available Credits */}
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">Available Credits</p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-300">
            {wallet.available_credits.toLocaleString()} <span className="text-sm font-semibold">CR</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">Ready for instant barter allocation</p>
        </div>

        {/* Escrowed Credits */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-950/20 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-400">In Escrow</p>
          <p className="mt-2 text-3xl font-extrabold text-amber-300">
            {wallet.escrow_credits.toLocaleString()} <span className="text-sm font-semibold">CR</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">Locked in pending trade executions</p>
        </div>

        {/* Total Valuation */}
        <div className="rounded-lg border border-indigo-500/20 bg-indigo-950/20 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-indigo-400">Total Portfolio</p>
          <p className="mt-2 text-3xl font-extrabold text-indigo-300">
            {totalValuation.toLocaleString()} <span className="text-sm font-semibold">CR</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">Combined credit valuation</p>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={() => alert('Deposit flow triggered (Dev Mode)')}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 active:scale-95"
        >
          + Add Test Credits
        </button>
        <button
          onClick={() => alert('Escrow audit modal (Dev Mode)')}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 active:scale-95"
        >
          View Trade Ledger
        </button>
      </div>
    </div>
  );
}