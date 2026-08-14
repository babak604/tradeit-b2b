"use client";

import React, { useState, useEffect } from "react";
import { useTradeItEscrow } from "@/hooks/useTradeItEscrow";
import { PublicKey } from "@solana/web3.js";

interface EscrowDealWidgetProps {
  dealId: string;
  defaultMintAddress?: string;
  title?: string;
}

export function EscrowDealWidget({ dealId, defaultMintAddress = "", title }: EscrowDealWidgetProps) {
  const { fetchEscrowState, depositToken, initializeEscrow, loading, error, isWalletConnected } = useTradeItEscrow();

  const [escrowState, setEscrowState] = useState<any>(null);
  const [mintAddress, setMintAddress] = useState<string>(defaultMintAddress);
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadState = async () => {
    try {
      const state = await fetchEscrowState(dealId);
      setEscrowState(state);
    } catch (e) {
      console.warn("Vault state fetch error:", e);
    }
  };

  useEffect(() => {
    if (isWalletConnected) {
      loadState();
    }
  }, [isWalletConnected, dealId]);

  const handleInit = async () => {
    setStatusMessage(null);
    try {
      const tx = await initializeEscrow(dealId, 1000);
      setStatusMessage(`Vault Initialized! Tx: ${tx.slice(0, 8)}...`);
      await loadState();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDeposit = async () => {
    setStatusMessage(null);
    if (!mintAddress) return;
    try {
      const mintPubkey = new PublicKey(mintAddress);
      const tx = await depositToken(dealId, mintPubkey, depositAmount);
      setStatusMessage(`Deposited ${depositAmount} RWA Tokens! Tx: ${tx.slice(0, 8)}...`);
      await loadState();
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-slate-100 shadow-xl">
      <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-lg font-bold text-teal-400">{title || `Escrow Vault: ${dealId}`}</h3>
          <p className="text-xs text-slate-400">Non-Custodial Solana PDA Escrow</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
          escrowState ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
        }`}>
          {escrowState ? "Active On-Chain" : "Not Initialized"}
        </span>
      </div>

      {!isWalletConnected && (
        <p className="text-sm text-slate-400">Please connect your Phantom wallet to manage deal escrow.</p>
      )}

      {isWalletConnected && (
        <div className="space-y-4">
          {!escrowState ? (
            <button
              onClick={handleInit}
              disabled={loading}
              className="w-full rounded-xl bg-teal-600 py-2.5 font-semibold text-white transition-all hover:bg-teal-500 disabled:opacity-50"
            >
              {loading ? "Initializing..." : "Initialize Escrow Vault"}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl bg-slate-950 p-3 text-xs text-slate-300 border border-slate-800">
                <p><strong>Initializer:</strong> {escrowState.initializer.toBase58().slice(0, 12)}...</p>
                <p><strong>Capacity:</strong> {escrowState.cycleCapacity.toString()}</p>
                <p><strong>Status:</strong> {escrowState.isSettled ? "Settled" : escrowState.isLocked ? "Locked" : "Open"}</p>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">RWA Token Mint Address</label>
                <input
                  type="text"
                  value={mintAddress}
                  onChange={(e) => setMintAddress(e.target.value)}
                  placeholder="Paste SPL Token Mint Address"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2 text-xs font-mono text-slate-200"
                />
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-1/3 rounded-lg bg-slate-950 border border-slate-800 p-2 text-xs font-mono text-slate-200"
                />
                <button
                  onClick={handleDeposit}
                  disabled={loading || !mintAddress}
                  className="w-2/3 rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white transition-all hover:bg-indigo-500 disabled:opacity-50"
                >
                  {loading ? "Processing..." : `Deposit ${depositAmount} Tokens`}
                </button>
              </div>
            </div>
          )}

          {statusMessage && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2 text-xs text-emerald-300">
              {statusMessage}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2 text-xs text-red-300">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}