"use client";

import React, { useRef } from "react";

interface TradeCertificateProps {
  dealId: string;
  settlementTx?: string;
  initializerWallet?: string;
  recipientWallet?: string;
  amount?: number;
  mintAddress?: string;
  settledAt?: string;
}

export function TradeCertificate({
  dealId,
  settlementTx = "3TDzHXAi...",
  initializerWallet,
  recipientWallet,
  amount = 100,
  mintAddress,
  settledAt = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }),
}: TradeCertificateProps) {
  const certRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Printable Certificate Frame */}
      <div
        ref={certRef}
        className="relative overflow-hidden rounded-3xl border-2 border-indigo-500/40 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-8 text-slate-100 shadow-2xl print:bg-white print:text-black print:border-black print:shadow-none"
      >
        {/* Background Security Watermark Styling */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl print:hidden" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl print:hidden" />

        {/* Certificate Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6 print:border-slate-300">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛡️</span>
              <h2 className="text-xl font-extrabold tracking-wider text-teal-400 print:text-indigo-900">
                TRADEIT B2B
              </h2>
            </div>
            <p className="text-xs text-slate-400 print:text-slate-600">
              Decentralized Non-Custodial Escrow Network
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 print:border-emerald-700 print:bg-emerald-50 print:text-emerald-800">
              OFFICIAL SETTLEMENT RECORD
            </span>
            <p className="mt-1 text-[10px] font-mono text-slate-500 print:text-slate-600">
              Solana Cluster: Devnet
            </p>
          </div>
        </div>

        {/* Certificate Body */}
        <div className="my-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white print:text-slate-900">
              Certificate of Trade Settlement
            </h1>
            <p className="mt-1 text-xs text-slate-400 print:text-slate-600">
              This document verifies the atomic execution of funds via Solana Program Derived Address (PDA)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs font-mono print:border-slate-300 print:bg-slate-50">
            <div>
              <span className="block text-[10px] uppercase text-slate-500">Deal Reference Seed</span>
              <span className="font-bold text-teal-300 print:text-slate-900">{dealId}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-slate-500">Settlement Timestamp</span>
              <span className="font-semibold text-slate-300 print:text-slate-900">{settledAt}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-slate-500">Asset Units Settled</span>
              <span className="font-bold text-purple-300 print:text-slate-900">{amount} RWA Tokens</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-slate-500">Execution Mode</span>
              <span className="font-semibold text-slate-300 print:text-slate-900">PDA Atomic Ring Transfer</span>
            </div>
          </div>

          {/* Cryptographic Signatures */}
          <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-xs print:border-slate-300 print:bg-slate-50">
            <h4 className="font-bold text-slate-300 print:text-slate-900 border-b border-slate-800 pb-2 print:border-slate-300">
              Cryptographic Proof
            </h4>
            <div className="space-y-1.5 font-mono text-[11px] text-slate-400 print:text-slate-700">
              <p className="truncate">
                <strong className="text-slate-300 print:text-slate-900">Tx Signature:</strong> {settlementTx}
              </p>
              {initializerWallet && (
                <p className="truncate">
                  <strong className="text-slate-300 print:text-slate-900">Initializer Wallet:</strong> {initializerWallet}
                </p>
              )}
              {recipientWallet && (
                <p className="truncate">
                  <strong className="text-slate-300 print:text-slate-900">Recipient Wallet:</strong> {recipientWallet}
                </p>
              )}
              {mintAddress && (
                <p className="truncate">
                  <strong className="text-slate-300 print:text-slate-900">SPL Token Mint:</strong> {mintAddress}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Certificate Footer / Seal */}
        <div className="flex items-end justify-between border-t border-slate-800 pt-6 print:border-slate-300">
          <div>
            <p className="text-[10px] text-slate-500 print:text-slate-600">
              Verified by TradeIt Program Escrow Engine v1.0
            </p>
            <p className="text-[10px] text-slate-500 print:text-slate-600">
              Immutable ledger record on Solana Blockchain
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg transition-all hover:bg-indigo-500 print:hidden"
          >
            🖨️ Print / Save PDF Certificate
          </button>
        </div>
      </div>
    </div>
  );
}