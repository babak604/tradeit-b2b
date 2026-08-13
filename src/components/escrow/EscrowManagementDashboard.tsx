"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { PublicKey } from "@solana/web3.js";
import { useTradeItEscrow, CycleEscrowState } from "@/hooks/useTradeItEscrow";
import { DealAuditTrail } from "./DealAuditTrail";

// Dynamic import for WalletMultiButton to prevent SSR hydration mismatch
const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

export function EscrowManagementDashboard() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"init" | "deposit" | "settle" | "inspect">("init");

  // Form States
  const [dealId, setDealId] = useState("DEAL-B2B-101");
  const [capacitySol, setCapacitySol] = useState("1.0");
  const [mintAddress, setMintAddress] = useState("");
  const [depositAmount, setDepositAmount] = useState("500");
  const [recipientPubkey, setRecipientPubkey] = useState("");
  const [settleAmount, setSettleAmount] = useState("500");

  // Result States
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [inspectedState, setInspectedState] = useState<CycleEscrowState | null>(null);

  const {
    initializeEscrow,
    depositToken,
    executeSettlement,
    fetchEscrowState,
    loading,
    error,
    isWalletConnected,
  } = useTradeItEscrow();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Handlers
  const handleInitialize = async () => {
    setTxSignature(null);
    const lamports = parseFloat(capacitySol) * 1_000_000_000;
    const tx = await initializeEscrow(dealId, lamports);
    setTxSignature(tx);
  };

  const handleDeposit = async () => {
    setTxSignature(null);
    if (!mintAddress) throw new Error("Please enter a valid RWA Mint address.");
    const mint = new PublicKey(mintAddress);
    const amount = parseFloat(depositAmount) * 10 ** 6;
    const tx = await depositToken(dealId, mint, amount);
    setTxSignature(tx);
  };

  const handleSettle = async () => {
    setTxSignature(null);
    if (!mintAddress || !recipientPubkey) {
      throw new Error("Please enter both Mint and Recipient Public Key.");
    }
    const mint = new PublicKey(mintAddress);
    const recipient = new PublicKey(recipientPubkey);
    const amount = parseFloat(settleAmount) * 10 ** 6;
    const tx = await executeSettlement(dealId, mint, recipient, amount);
    setTxSignature(tx);
  };

  const handleInspect = async () => {
    const state = await fetchEscrowState(dealId);
    setInspectedState(state);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
      {/* Top Bar / Wallet Connection */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            TradeIt <span className="text-sky-400 font-mono text-sm px-2.5 py-0.5 rounded-full bg-sky-950 border border-sky-800">Escrow v0.1</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Solana RWA Escrow & Atomic Ring Settlement Terminal
          </p>
        </div>
        <WalletMultiButton className="!bg-sky-600 hover:!bg-sky-500 !rounded-xl !h-11 !transition-colors" />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab("init")}
          className={`pb-3 px-4 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "init"
              ? "border-sky-500 text-sky-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          1. Initialize Vault
        </button>
        <button
          onClick={() => setActiveTab("deposit")}
          className={`pb-3 px-4 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "deposit"
              ? "border-sky-500 text-sky-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          2. Deposit Tokens
        </button>
        <button
          onClick={() => setActiveTab("settle")}
          className={`pb-3 px-4 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "settle"
              ? "border-sky-500 text-sky-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          3. Atomic Settlement
        </button>
        <button
          onClick={() => setActiveTab("inspect")}
          className={`pb-3 px-4 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "inspect"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          🔍 Inspect On-Chain
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
        {/* Tab 1: Initialize */}
        {activeTab === "init" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-200">Initialize Cycle Escrow Account</h3>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">DEAL IDENTIFIER (SEED)</label>
              <input
                type="text"
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">CYCLE CAPACITY (SOL)</label>
              <input
                type="number"
                value={capacitySol}
                onChange={(e) => setCapacitySol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
            <button
              disabled={!isWalletConnected || loading}
              onClick={handleInitialize}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "Executing On-Chain..." : "Initialize Escrow Vault"}
            </button>
          </div>
        )}

        {/* Tab 2: Deposit */}
        {activeTab === "deposit" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-200">Deposit RWA Tokens into Escrow Vault</h3>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">DEAL ID</label>
              <input
                type="text"
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">RWA TOKEN MINT ADDRESS</label>
              <input
                type="text"
                placeholder="e.g. EN4maio8RVtJ8GVW..."
                value={mintAddress}
                onChange={(e) => setMintAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">DEPOSIT AMOUNT (UNITS)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
            <button
              disabled={!isWalletConnected || loading}
              onClick={handleDeposit}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "Transferring Tokens..." : "Deposit to Vault"}
            </button>
          </div>
        )}

        {/* Tab 3: Settle */}
        {activeTab === "settle" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-200">Execute Atomic Ring Settlement (PDA Signed CPI)</h3>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">DEAL ID</label>
              <input
                type="text"
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">RWA TOKEN MINT ADDRESS</label>
              <input
                type="text"
                placeholder="e.g. EN4maio8RVtJ8GVW..."
                value={mintAddress}
                onChange={(e) => setMintAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">RECIPIENT WALLET PUBLIC KEY</label>
              <input
                type="text"
                placeholder="e.g. 8WNkLmeYB9WtzyJxb..."
                value={recipientPubkey}
                onChange={(e) => setRecipientPubkey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">SETTLEMENT AMOUNT</label>
              <input
                type="number"
                value={settleAmount}
                onChange={(e) => setSettleAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
            <button
              disabled={!isWalletConnected || loading}
              onClick={handleSettle}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "Executing Ring Settlement..." : "Execute Atomic Settlement"}
            </button>
          </div>
        )}

        {/* Tab 4: Inspect */}
        {activeTab === "inspect" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-200">Query On-Chain Escrow State</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
                placeholder="Enter Deal ID"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleInspect}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-6 py-2 rounded-lg transition-colors"
              >
                Fetch State
              </button>
            </div>

            {inspectedState ? (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2 text-slate-300">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Initializer:</span>
                  <span>{inspectedState.initializer.toBase58()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Deal ID:</span>
                  <span className="text-sky-400">{inspectedState.dealId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Capacity (Lamports):</span>
                  <span>{inspectedState.cycleCapacity.toString()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Is Locked:</span>
                  <span className={inspectedState.isLocked ? "text-emerald-400" : "text-amber-400"}>
                    {inspectedState.isLocked ? "TRUE" : "FALSE"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Is Settled:</span>
                  <span className={inspectedState.isSettled ? "text-emerald-400" : "text-slate-400"}>
                    {inspectedState.isSettled ? "TRUE" : "FALSE"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">PDA Bump Seed:</span>
                  <span>{inspectedState.bump}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-mono italic">
                No state loaded for deal "{dealId}". Click "Fetch State" to query Devnet.
              </p>
            )}
          </div>
        )}

        {/* Notifications & Signatures */}
        {error && (
          <div className="bg-red-950/50 border border-red-800/80 rounded-xl p-4 text-red-300 text-sm font-mono break-all">
            ⚠ Error: {error}
          </div>
        )}

        {txSignature && (
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-4 text-emerald-300 text-sm space-y-2">
            <p className="font-semibold flex items-center gap-2">
              ✔ Transaction Confirmed On-Chain!
            </p>
            <a
              href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-sky-400 hover:underline break-all block"
            >
              View on Solana Explorer: {txSignature} ↗
            </a>
          </div>
        )}
      </div>

      {/* Real-time Audit Trail for current dealId */}
      <DealAuditTrail dealId={dealId} />
    </div>
  );
}