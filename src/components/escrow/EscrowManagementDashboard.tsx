"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { useTradeItEscrow } from "@/hooks/useTradeItEscrow";
import { NetworkWarningBanner } from "@/components/escrow/NetworkWarningBanner";
import { downloadDealReceiptJSON } from "@/lib/escrow/exportReceipt";
import {
  subscribeToDealHistory,
  fetchDealHistory,
  DealHistoryRecord,
} from "@/lib/supabase/dealHistory";

export function EscrowManagementDashboard() {
  const { connected, publicKey } = useWallet();
  const {
    mintMockRwaTokens,
    initializeEscrow,
    depositToken,
    executeSettlement,
    fetchEscrowState,
    loading,
    error,
  } = useTradeItEscrow();

  // Active Tab State
  const [activeTab, setActiveTab] = useState<"init" | "deposit" | "settle" | "inspect">("init");

  // Form States
  const [dealId, setDealId] = useState<string>("DEAL-B2B-101");
  const [capacity, setCapacity] = useState<number>(1000);
  const [mintAddress, setMintAddress] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState<number>(500);
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [settleAmount, setSettleAmount] = useState<number>(500);

  // Status & State Feedback
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [fetchedState, setFetchedState] = useState<any>(null);
  const [historyLogs, setHistoryLogs] = useState<DealHistoryRecord[]>([]);

  // Real-Time Supabase Subscription
  useEffect(() => {
    fetchDealHistory().then(setHistoryLogs).catch(console.error);

    const subscription = subscribeToDealHistory((newRecord) => {
      setHistoryLogs((prev) => [newRecord, ...prev]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 0. Faucet Mint Handler
  const handleMintFaucet = async () => {
    setStatusMsg(null);
    try {
      const result = await mintMockRwaTokens(1000);
      setMintAddress(result.mintAddress);
      setStatusMsg(`Success! Minted 1,000 RWA Tokens. Mint: ${result.mintAddress}`);
    } catch (err: any) {
      console.error(err);
    }
  };

  // 1. Initialize Handler
  const handleInitialize = async () => {
    setStatusMsg(null);
    try {
      const tx = await initializeEscrow(dealId, capacity);
      setStatusMsg(`Vault initialized successfully! Tx: ${tx}`);
    } catch (err: any) {
      console.error(err);
    }
  };

  // 2. Deposit Handler
  const handleDeposit = async () => {
    setStatusMsg(null);
    try {
      if (!mintAddress) throw new Error("Please enter a valid SPL Token Mint Address.");
      const mintPubkey = new PublicKey(mintAddress);
      const tx = await depositToken(dealId, mintPubkey, depositAmount);
      setStatusMsg(`Successfully deposited ${depositAmount} RWA tokens! Tx: ${tx}`);
    } catch (err: any) {
      console.error(err);
    }
  };

  // 3. Settlement Handler
  const handleSettlement = async () => {
    setStatusMsg(null);
    try {
      if (!mintAddress) throw new Error("Please enter a valid SPL Token Mint Address.");
      if (!recipientAddress) throw new Error("Please enter a recipient wallet public key.");

      const mintPubkey = new PublicKey(mintAddress);
      const recipientPubkey = new PublicKey(recipientAddress);

      const tx = await executeSettlement(dealId, mintPubkey, recipientPubkey, settleAmount);
      setStatusMsg(`Atomic settlement completed! Tx: ${tx}`);
    } catch (err: any) {
      console.error(err);
    }
  };

  // 4. Fetch State Handler
  const handleFetchState = async () => {
    setStatusMsg(null);
    try {
      const state = await fetchEscrowState(dealId);
      setFetchedState(state);
      if (!state) setStatusMsg(`No active on-chain vault found for Deal ID: ${dealId}`);
    } catch (err: any) {
      console.error(err);
    }
  };

  // 5. Download Audit Receipt Handler
  const handleDownloadReceipt = () => {
    if (historyLogs.length === 0) return;
    downloadDealReceiptJSON(dealId, historyLogs);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      {/* Network Warning Guardrail */}
      <NetworkWarningBanner />

      {/* Header & Wallet Section */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            B2B Escrow Terminal
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Non-Custodial Solana PDA Vaults & Atomic Settlement
          </p>
        </div>
        <div>
          <WalletMultiButton />
        </div>
      </div>

      {/* Mock RWA Faucet Banner */}
      {connected && (
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-900/30 via-slate-900 to-purple-900/30 p-5 shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-indigo-200">🪂 RWA Test Token Faucet</h3>
              <p className="text-xs text-slate-400">
                Mint 1,000 mock RWA tokens to your connected wallet to test escrow deposits.
              </p>
            </div>
            <button
              onClick={handleMintFaucet}
              disabled={loading}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? "Minting..." : "Mint 1,000 RWA Tokens 🪂"}
            </button>
          </div>
        </div>
      )}

      {/* Status & Error Display */}
      {statusMsg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-mono text-emerald-300">
          ✅ {statusMsg}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-mono text-red-300">
          ⚠️ {error}
        </div>
      )}

      {/* Main Terminal Tabs */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl">
        <div className="flex border-b border-slate-800 pb-4 text-sm font-semibold text-slate-400 gap-2 overflow-x-auto">
          {[
            { id: "init", label: "1. Initialize Vault" },
            { id: "deposit", label: "2. Deposit Tokens" },
            { id: "settle", label: "3. Atomic Settlement" },
            { id: "inspect", label: "4. Inspect On-Chain" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`rounded-xl px-4 py-2 transition-all ${
                activeTab === tab.id
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                  : "hover:bg-slate-800 text-slate-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {/* TAB 1: INITIALIZE */}
          {activeTab === "init" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">DEAL IDENTIFIER (SEED)</label>
                <input
                  type="text"
                  value={dealId}
                  onChange={(e) => setDealId(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">CYCLE CAPACITY (UNITS)</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-slate-200"
                />
              </div>
              <button
                onClick={handleInitialize}
                disabled={loading || !connected}
                className="w-full rounded-xl bg-teal-600 py-3 font-semibold text-white transition-all hover:bg-teal-500 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Initialize Escrow Vault"}
              </button>
            </div>
          )}

          {/* TAB 2: DEPOSIT */}
          {activeTab === "deposit" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">RWA TOKEN MINT ADDRESS</label>
                <input
                  type="text"
                  value={mintAddress}
                  onChange={(e) => setMintAddress(e.target.value)}
                  placeholder="Paste SPL Token Mint Address"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm font-mono text-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">DEPOSIT AMOUNT</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-slate-200"
                />
              </div>
              <button
                onClick={handleDeposit}
                disabled={loading || !connected}
                className="w-full rounded-xl bg-teal-600 py-3 font-semibold text-white transition-all hover:bg-teal-500 disabled:opacity-50"
              >
                {loading ? "Depositing..." : "Deposit to Vault"}
              </button>
            </div>
          )}

          {/* TAB 3: SETTLEMENT */}
          {activeTab === "settle" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">RECIPIENT PUBLIC KEY</label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="Recipient Wallet Public Key"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm font-mono text-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">SETTLEMENT AMOUNT</label>
                <input
                  type="number"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(Number(e.target.value))}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-slate-200"
                />
              </div>
              <button
                onClick={handleSettlement}
                disabled={loading || !connected}
                className="w-full rounded-xl bg-purple-600 py-3 font-semibold text-white transition-all hover:bg-purple-500 disabled:opacity-50"
              >
                {loading ? "Settling..." : "Execute Atomic Ring Settlement"}
              </button>
            </div>
          )}

          {/* TAB 4: INSPECT */}
          {activeTab === "inspect" && (
            <div className="space-y-4">
              <button
                onClick={handleFetchState}
                disabled={loading || !connected}
                className="w-full rounded-xl bg-slate-800 py-3 font-semibold text-slate-200 hover:bg-slate-700"
              >
                {loading ? "Fetching..." : `Fetch State for ${dealId}`}
              </button>

              {fetchedState && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs font-mono text-slate-300 space-y-2">
                  <p><strong className="text-teal-400">Initializer:</strong> {fetchedState.initializer.toBase58()}</p>
                  <p><strong className="text-teal-400">Deal ID:</strong> {fetchedState.dealId}</p>
                  <p><strong className="text-teal-400">Capacity:</strong> {fetchedState.cycleCapacity.toString()}</p>
                  <p><strong className="text-teal-400">Is Locked:</strong> {fetchedState.isLocked ? "Yes" : "No"}</p>
                  <p><strong className="text-teal-400">Is Settled:</strong> {fetchedState.isSettled ? "Yes" : "No"}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Real-time Supabase Deal Audit Trail */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">📜 Live Deal Audit Trail</h3>
            <p className="text-xs text-slate-400">Real-time Supabase WebSocket sync from Solana Devnet</p>
          </div>
          <button
            onClick={handleDownloadReceipt}
            disabled={historyLogs.length === 0}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition-all hover:bg-slate-700 disabled:opacity-50"
          >
            📥 Download Audit Receipt
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400">
              <tr>
                <th className="p-3">EVENT</th>
                <th className="p-3">DEAL ID</th>
                <th className="p-3">WALLET</th>
                <th className="p-3">AMOUNT</th>
                <th className="p-3">TX SIGNATURE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {historyLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/50">
                  <td className="p-3 font-bold text-teal-400">{log.event_type}</td>
                  <td className="p-3 font-mono">{log.deal_id}</td>
                  <td className="p-3 font-mono text-slate-400">{log.wallet_address.slice(0, 8)}...</td>
                  <td className="p-3 font-mono">{log.amount ?? "-"}</td>
                  <td className="p-3 font-mono">
                    <a
                      href={`https://explorer.solana.com/tx/${log.tx_signature}?cluster=devnet`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:underline"
                    >
                      {log.tx_signature.slice(0, 10)}... ↗
                    </a>
                  </td>
                </tr>
              ))}
              {historyLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500">
                    No transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}