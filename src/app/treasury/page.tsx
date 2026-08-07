'use client';

import { useEffect, useState, useTransition } from 'react';
import { getOrCreateWallet, depositTestCredits, WalletData } from '@/app/actions/treasury';
import { createClient } from '@/lib/supabase/client';
import {
  Wallet,
  Lock,
  Coins,
  ArrowUpRight,
  ShieldCheck,
  PlusCircle,
  FileText,
  Clock,
  ArrowLeft,
  Radio,
} from 'lucide-react';
import Link from 'next/link';

export default function TreasuryPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  const loadTreasuryData = async () => {
    setLoading(true);
    const res = await getOrCreateWallet();
    if (res.wallet) {
      setWallet(res.wallet);
    } else if (res.error) {
      setErrorMsg(res.error);
    }
    setLoading(false);
  };

  // 1. Initial Load
  useEffect(() => {
    loadTreasuryData();
  }, []);

  // 2. Supabase Realtime Listener for Instant Balance Updates
  useEffect(() => {
    if (!wallet?.user_id) return;

    const channel = supabase
      .channel(`treasury-wallet-${wallet.user_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${wallet.user_id}`,
        },
        (payload) => {
          if (payload.new) {
            setWallet(payload.new as WalletData);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [wallet?.user_id, supabase]);

  const handleDeposit = () => {
    startTransition(async () => {
      const res = await depositTestCredits(5000);
      if (res.success) {
        await loadTreasuryData();
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-mono text-xs text-slate-500">
        Loading Treasury Ledger & Escrow Balances...
      </div>
    );
  }

  const available = Number(wallet?.balance ?? 0);
  const locked = Number(wallet?.locked_escrow ?? 0);
  const totalValue = available + locked;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-6">
          <Link
            href="/deals"
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Deals Dashboard</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Live Socket Status */}
            <div className="flex items-center gap-2 font-mono text-xs px-3 py-1 bg-slate-900 border border-slate-800 rounded-full">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span className="text-slate-400 hidden sm:inline">Ledger Socket Active</span>
            </div>

            <span className="text-xs font-mono px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Isolated Escrow
            </span>
          </div>
        </div>

        {/* Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Wallet className="w-8 h-8 text-emerald-400" />
              <span>Corporate Treasury & Escrow</span>
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Real-time audit of liquid credits and locked deal reserves.
            </p>
          </div>

          <button
            onClick={handleDeposit}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs font-mono transition-all shadow-lg shadow-emerald-500/15 disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isPending ? 'Minting...' : '+ Deposit 5,000 Test Credits'}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Capital Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Value */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase tracking-wider">
              <span>Total Treasury Value</span>
              <Coins className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {totalValue.toLocaleString()} <span className="text-xs text-slate-500 font-normal">CR</span>
            </div>
            <p className="text-[11px] font-mono text-slate-500">Liquid + Escrow combined</p>
          </div>

          {/* Available Liquid */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-emerald-400 uppercase tracking-wider">
              <span>Available Liquid</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div className="text-3xl font-black text-emerald-400 font-mono">
              {available.toLocaleString()} <span className="text-xs text-emerald-600 font-normal">CR</span>
            </div>
            <p className="text-[11px] font-mono text-slate-500">Ready for new deal proposals</p>
          </div>

          {/* Locked Escrow */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-sky-400 uppercase tracking-wider">
              <span>Locked in Escrow</span>
              <Lock className="w-4 h-4" />
            </div>
            <div className="text-3xl font-black text-sky-400 font-mono">
              {locked.toLocaleString()} <span className="text-xs text-sky-600 font-normal">CR</span>
            </div>
            <p className="text-[11px] font-mono text-slate-500">Committed to active deals</p>
          </div>
        </div>

        {/* Treasury Breakdown & Security Notes */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-6">
          <h2 className="text-sm font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-400" />
            <span>Escrow Guarantee Protocol</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-400 leading-relaxed">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <h3 className="font-bold text-white flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-sky-400" />
                1. Proposal Lock Routine
              </h3>
              <p>
                When a bilateral barter is signed, the stipulated credit valuation is moved from your
                <strong> Available Liquid</strong> balance into <strong> Locked Escrow</strong> via an atomic database RPC function (`private.sign_deal`).
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <h3 className="font-bold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                2. Settlement & Release
              </h3>
              <p>
                Upon mutual delivery verification in the Deal Room, executing `private.settle_deal` releases locked escrow credits directly into the recipient company&apos;s treasury balance.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}