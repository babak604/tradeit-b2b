'use client';

import { useState } from 'react';
import { generateBarterContract } from '@/app/actions/generateContract';

export interface ListingItem {
  title: string;
  description: string;
  value: number;
}

export interface PartyDetails {
  deliverables: string[];
  deadlineDays: number;
}

export interface Milestone {
  phase: string;
  description: string;
  releaseCondition: string;
}

export interface BarterContract {
  title: string;
  totalEstimatedValueUsd: number;
  partyA: PartyDetails;
  partyB: PartyDetails;
  valueAdjustment: string;
  milestones: Milestone[];
  disputeResolutionClause: string;
}

interface DealCopilotProps {
  myListing: ListingItem;
  partnerListing: ListingItem;
}

export default function DealCopilot({ myListing, partnerListing }: DealCopilotProps) {
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState<BarterContract | null>(null);
  const [signed, setSigned] = useState(false);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const res = await generateBarterContract(myListing, partnerListing);

      if (res?.success && res.contract) {
        setContract(res.contract as BarterContract);
      }
    } catch (err: unknown) {
      console.error('Failed to generate contract:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl font-bold text-xl">
            🤝
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">AI Deal Copilot</h2>
            <p className="text-sm text-slate-400">
              Autonomous SOW Contract Generation & Value Balancing
            </p>
          </div>
        </div>
        {!contract && (
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-medium text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Drafting SOW...
              </>
            ) : (
              '⚡ Draft Smart SOW'
            )}
          </button>
        )}
      </div>

      {/* Side-by-side trade view */}
      {!contract && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-xs uppercase text-indigo-400 font-semibold tracking-wider">
              Your Deliverable
            </span>
            <h3 className="text-base font-bold text-white mt-1">{myListing.title}</h3>
            <p className="text-xs text-slate-400 mt-1">{myListing.description}</p>
            <div className="mt-3 text-xs font-mono text-emerald-400">
              Est. Value: ${myListing.value.toLocaleString()}
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-xs uppercase text-indigo-400 font-semibold tracking-wider">
              Partner Deliverable
            </span>
            <h3 className="text-base font-bold text-white mt-1">{partnerListing.title}</h3>
            <p className="text-xs text-slate-400 mt-1">{partnerListing.description}</p>
            <div className="mt-3 text-xs font-mono text-emerald-400">
              Est. Value: ${partnerListing.value.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Generated Contract Document */}
      {contract && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-indigo-300">{contract.title}</h3>
              <span className="text-xs font-mono px-3 py-1 bg-indigo-950/60 border border-indigo-800/60 rounded-full text-indigo-300">
                Total Deal: ${contract.totalEstimatedValueUsd.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="font-bold text-slate-200">Party A Responsibilities:</span>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
                  {contract.partyA.deliverables.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
                <p className="mt-2 text-slate-500">Timeline: {contract.partyA.deadlineDays} days</p>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="font-bold text-slate-200">Party B Responsibilities:</span>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
                  {contract.partyB.deliverables.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
                <p className="mt-2 text-slate-500">Timeline: {contract.partyB.deadlineDays} days</p>
              </div>
            </div>

            <div className="p-3 bg-indigo-950/30 border border-indigo-900/40 rounded-lg text-xs text-indigo-200">
              <span className="font-semibold text-indigo-400">Value Parity Note:</span> {contract.valueAdjustment}
            </div>

            {/* Milestones */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Execution Milestones
              </h4>
              <div className="space-y-2">
                {contract.milestones.map((m, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs flex justify-between">
                    <div>
                      <span className="font-bold text-slate-300">{m.phase}: </span>
                      <span className="text-slate-400">{m.description}</span>
                    </div>
                    <span className="text-slate-500 font-mono">{m.releaseCondition}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Dispute Terms:</span> {contract.disputeResolutionClause}
            </div>
          </div>

          {!signed ? (
            <button
              onClick={() => setSigned(true)}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-900/20 cursor-pointer"
            >
              Sign & Execute Barter Agreement
            </button>
          ) : (
            <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 rounded-xl text-center text-sm font-medium">
              ✓ Agreement Signed & Locked in Escrow!
            </div>
          )}
        </div>
      )}
    </div>
  );
}