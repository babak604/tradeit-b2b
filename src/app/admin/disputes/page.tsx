'use client';

import { useEffect, useState, useTransition } from 'react';
import { fetchAdminDashboardDataAction, AdminMetrics, AdminRecentDeal } from '@/app/actions/admin';
import {
  TrendingUp,
  ShieldAlert,
  Coins,
  Building2,
  FileCheck2,
  ArrowLeft,
  RefreshCw,
  Wallet,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [recentDeals, setRecentDeals] = useState<AdminRecentDeal[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadDashboardData = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await fetchAdminDashboardDataAction();
      if (res.success && res.metrics && res.recentDeals) {
        setMetrics(res.metrics);
        setRecentDeals(res.recentDeals);
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    });
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-6">
          <Link
            href="/deals"
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Deals Room</span>
          </Link>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="px-3 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-full flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Platform Analytics Engine
            </span>
            <button
              onClick={loadDashboardData}
              disabled={isPending}
              className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-emerald-400" />
            <span>Executive Admin Analytics</span>
          </h1>
          <p className="text-xs font-mono text-slate-400">
            Real-time telemetry on transaction volume, active escrow reserves, and systemic deal health.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Core KPI Cards */}
        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Settled Volume */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3">
              <div className="flex items-center justify-between text-slate-400 font-mono text-xs uppercase">
                <span>Total Settled Volume</span>
                <Coins className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {Number(metrics.total_settled_volume).toLocaleString()} <span className="text-emerald-400 text-sm">CR</span>
              </div>
              <p className="text-[10px] font-mono text-slate-500">Cumulative completed trade value</p>
            </div>

            {/* Locked Escrow */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3">
              <div className="flex items-center justify-between text-slate-400 font-mono text-xs uppercase">
                <span>Active Escrow Locked</span>
                <ShieldAlert className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {Number(metrics.total_locked_escrow).toLocaleString()} <span className="text-sky-400 text-sm">CR</span>
              </div>
              <p className="text-[10px] font-mono text-slate-500">Frozen in active & disputed deals</p>
            </div>

            {/* Liquid Balances */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3">
              <div className="flex items-center justify-between text-slate-400 font-mono text-xs uppercase">
                <span>Corporate Liquid Reserves</span>
                <Wallet className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {Number(metrics.total_liquid_balance).toLocaleString()} <span className="text-amber-400 text-sm">CR</span>
              </div>
              <p className="text-[10px] font-mono text-slate-500">Available across corporate wallets</p>
            </div>

            {/* Active Companies */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3">
              <div className="flex items-center justify-between text-slate-400 font-mono text-xs uppercase">
                <span>Corporate Entities</span>
                <Building2 className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {metrics.total_companies}
              </div>
              <p className="text-[10px] font-mono text-slate-500">Verified B2B directory members</p>
            </div>
          </div>
        )}

        {/* Deal Room Lifecycle Distribution */}
        {metrics && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-sky-400" />
              <span>Deal Lifecycle Distribution</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" /> Proposed
                </span>
                <p className="text-xl font-mono font-bold text-white">{metrics.proposed_deals}</p>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1">
                  <Activity className="w-3 h-3 text-sky-400" /> Signed (In Escrow)
                </span>
                <p className="text-xl font-mono font-bold text-white">{metrics.signed_deals}</p>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Settled
                </span>
                <p className="text-xl font-mono font-bold text-white">{metrics.settled_deals}</p>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Disputed
                </span>
                <p className="text-xl font-mono font-bold text-white">{metrics.disputed_deals}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Platform Activity Log */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span>Recent Platform Transactions</span>
          </h2>

          {recentDeals.length === 0 ? (
            <div className="text-center py-8 font-mono text-xs text-slate-500">
              No deal activity logged yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 px-4">Deal Reference</th>
                    <th className="pb-3 px-4">Parties</th>
                    <th className="pb-3 px-4">Valuation</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 px-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {recentDeals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-3 px-4 text-slate-400">{deal.id.substring(0, 8)}...</td>
                      <td className="py-3 px-4 font-sans text-slate-200">
                        {deal.party_a?.name || 'Party A'} <span className="text-slate-500">↔</span> {deal.party_b?.name || 'Party B'}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-400">
                        {Number(deal.credit_amount).toLocaleString()} CR
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                            deal.status === 'settled'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : deal.status === 'disputed'
                              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                              : deal.status === 'signed'
                              ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          }`}
                        >
                          {deal.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 text-[10px]">
                        {new Date(deal.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}