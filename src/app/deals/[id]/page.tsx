"use client";

import React, { use } from "react";
import Link from "next/link";
import { EscrowDealWidget } from "@/components/escrow/EscrowDealWidget";
import { TradeCertificate } from "@/components/escrow/TradeCertificate";

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const dealId = resolvedParams.id || "DEAL-B2B-101";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Top Navigation Breadcrumb */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <Link href="/escrow" className="text-xs font-semibold text-teal-400 hover:underline flex items-center gap-1">
            ← Back to Escrow Terminal
          </Link>
          <span className="rounded-full bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 text-xs text-indigo-300 font-mono">
            Deal ID: {dealId}
          </span>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            B2B Trade Deal Overview
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-Time On-Chain PDA Settlement & Contract Terms
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Contract Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-slate-200">Contract Summary</h2>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                  <span className="block text-slate-500">Asset Category</span>
                  <span className="font-semibold text-slate-200 text-sm">Real World Assets (RWA)</span>
                </div>
                <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                  <span className="block text-slate-500">Settlement Currency</span>
                  <span className="font-semibold text-slate-200 text-sm">SPL Token Mint</span>
                </div>
                <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                  <span className="block text-slate-500">Execution Mode</span>
                  <span className="font-semibold text-slate-200 text-sm">Atomic Ring Transfer</span>
                </div>
                <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                  <span className="block text-slate-500">Custody Type</span>
                  <span className="font-semibold text-slate-200 text-sm">Non-Custodial PDA</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed pt-2">
                This trade agreement uses Solana Program Derived Addresses (PDAs) to lock assets until settlement parameters are validated client-side.
              </p>
            </div>

            {/* Official Settlement Certificate Card */}
            <TradeCertificate dealId={dealId} amount={100} />
          </div>

          {/* Right Column: Escrow Action Widget */}
          <div className="lg:col-span-1">
            <EscrowDealWidget dealId={dealId} title="Live Escrow Status" />
          </div>
        </div>
      </div>
    </div>
  );
}