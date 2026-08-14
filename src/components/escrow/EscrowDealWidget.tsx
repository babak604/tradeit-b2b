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
  const { 
    fetchEscrowState, 
    depositToken, 
    initializeEscrow, 
    executeSettlement, 
    loading, 
    error, 
    isWalletConnected 
  } = useTradeItEscrow();

  const [escrowState, setEscrowState] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<"deposit" | "settle">("deposit");
  const [mintAddress, setMintAddress] = useState<string>(defaultMintAddress);
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [settleAmount, setSettleAmount] = useState<number>(100);
  const [toastMsg, setToastMsg] = useState<{ text: string; txSignature?: string; type: "success" | "error" } | null>(null);

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

  const showToast = (text: string, type: "success" | "error" = "success", txSignature?: string) => {
    setToastMsg({ text, type, txSignature });
    setTimeout(() => setToastMsg(null), 8000);
  };

  const handleInit = async () => {
    setToastMsg(null);
    try {
      const tx = await initializeEscrow(dealId, 1000);
      showToast("Escrow Vault Initialized!", "success", tx);
      await loadState();
    } catch (err: any) {
      showToast(err.message || "Initialization failed", "error");
    }
  };

  const handleDeposit = async () => {
    setToastMsg(null);
    if (!mintAddress) return showToast("Enter SPL Token Mint Address", "error");
    try {
      const mintPubkey = new PublicKey(mintAddress);
      const tx = await depositToken(dealId, mintPubkey, depositAmount);
      showToast(`Deposited ${depositAmount} RWA Tokens!`, "success", tx);
      await loadState();
    } catch (err: any) {
      showToast(err.message || "Deposit failed", "error");
    }
  };

  const handleSettlement = async () => {
    setToastMsg(null);
    if (!mintAddress) return showToast("Enter SPL Token Mint Address", "error");
    if (!recipientAddress) return showToast("Enter Recipient Wallet Address", "error");
    try {
      const mintPubkey = new PublicKey(mintAddress);
      const recipientPubkey = new PublicKey(recipientAddress);
      const tx = await executeSettlement(dealId, mintPubkey, recipientPubkey, settleAmount);
      showToast(`Atomic Settlement Executed (${settleAmount} Tokens)!`, "success", tx);
      await loadState();
    } catch (err: any) {
      showToast(err.message || "Settlement failed", "error");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-slate-100 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
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
        <p className="text-sm text-slate-400">Connect Phantom wallet to manage deal escrow.</p>
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
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-950 p-3 text-xs text-slate-300 border border-slate-800 space-y-1">
                <p><strong>Initializer:</strong> {escrowState.initializer.toBase58().slice(0, 10)}...</p>
                <p><strong>Capacity:</strong> {escrowState.cycleCapacity.toString()} Units</p>
                <p><strong>Status:</strong> {escrowState.isSettled ? "Settled" : "Open / Active"}</p>
              </div>

              {/* Sub-Tabs: Deposit vs Settle */}
              <div className="flex border-b border-slate-800 text-xs font-semibold">
                <button
                  onClick={() => setActiveSubTab("deposit")}
                  className={`flex-1 py-1.5 transition-all ${activeSubTab === "deposit" ? "border-b-2 border-teal-400 text-teal-300" : "text-slate-400"}`}
                >
                  Deposit
                </button>
                <button
                  onClick={() => setActiveSubTab("settle")}
                  className={`flex-1 py-1.5 transition-all ${activeSubTab === "settle" ? "border-b-2 border-purple-400 text-purple-300" : "text-slate-400"}`}
                >
                  Atomic Settle
                </button>
              </div>

              {/* Common Token Mint Input */}
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

              {/* DEPOSIT ACTION */}
              {activeSubTab === "deposit" && (
                <div className="space-y-2">
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
                      className="w-2/3 rounded-lg bg-teal-600 py-2 text-xs font-semibold text-white transition-all hover:bg-teal-500 disabled:opacity-50"
                    >
                      {loading ? "Processing..." : `Deposit ${depositAmount} Tokens`}
                    </button>
                  </div>
                </div>
              )}

              {/* SETTLE ACTION */}
              {activeSubTab === "settle" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Recipient Public Key</label>
                    <input
                      type="text"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      placeholder="Paste Recipient Wallet Address"
                      className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={settleAmount}
                      onChange={(e) => setSettleAmount(Number(e.target.value))}
                      className="w-1/3 rounded-lg bg-slate-950 border border-slate-800 p-2 text-xs font-mono text-slate-200"
                    />
                    <button
                      onClick={handleSettlement}
                      disabled={loading || !mintAddress || !recipientAddress}
                      className="w-2/3 rounded-lg bg-purple-600 py-2 text-xs font-semibold text-white transition-all hover:bg-purple-500 disabled:opacity-50"
                    >
                      {loading ? "Settling..." : `Execute Settlement (${settleAmount})`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Real-time Toast Feedback */}
          {toastMsg && (
            <div className={`rounded-xl border p-3 text-xs space-y-1 ${
              toastMsg.type === "success" 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" 
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}>
              <p className="font-semibold">{toastMsg.type === "success" ? "✅ Success" : "⚠️ Error"}</p>
              <p>{toastMsg.text}</p>
              {toastMsg.txSignature && (
                <a
                  href={`https://explorer.solana.com/tx/${toastMsg.txSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-indigo-400 hover:underline font-mono text-[11px] mt-1"
                >
                  View on Solana Explorer ↗
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}