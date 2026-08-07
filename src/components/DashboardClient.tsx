'use client';

import { useState } from 'react';
import MatchFeed from '@/components/MatchFeed';

export interface UserListing {
  id: string;
  title: string;
  price: number;
  status: string;
  description?: string;
}

interface UserBalance {
  available_credits: number;
  escrow_credits: number;
}

interface DashboardClientProps {
  initialBalance: UserBalance;
  listings: UserListing[];
  userEmail?: string;
}

export default function DashboardClient({
  initialBalance,
  listings,
  userEmail,
}: DashboardClientProps) {
  const [selectedListingId, setSelectedListingId] = useState<string>(
    listings[0]?.id || ''
  );
  const [balance] = useState<UserBalance>(initialBalance);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-extrabold text-white">
              B2B
            </div>
            <div>
              <h1 className="text-base font-bold text-white">BarterEngine Dashboard</h1>
              <p className="text-xs text-slate-400">{userEmail}</p>
            </div>
          </div>

          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            ● Atomic Escrow Active
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        {/* Live Wallet Widget */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Available Credits
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-400">
                {balance.available_credits.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-500">CR</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Ready for trade locking
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              In Escrow
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-400">
                {balance.escrow_credits.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-500">CR</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Locked in active negotiations
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Purchasing Power
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-indigo-300">
                {(balance.available_credits + balance.escrow_credits).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-500">CR</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Combined liquidity portfolio
            </p>
          </div>
        </section>

        {/* Listing Selector & Matchmaking Feed */}
        <section className="space-y-6">
          <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Target Service Offering</h2>
              <p className="text-xs text-slate-400">
                Select one of your published listings to trigger targeted AI counterparty matchmaking.
              </p>
            </div>

            {listings.length > 0 ? (
              <select
                value={selectedListingId}
                onChange={(e) => setSelectedListingId(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {listings.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} ({item.price.toLocaleString()} CR)
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-medium text-amber-400">
                No active listings found. Create a listing to start trading.
              </span>
            )}
          </div>

          {/* AI Opportunity Feed Component */}
          <MatchFeed listingId={selectedListingId} />
        </section>
      </main>
    </div>
  );
}