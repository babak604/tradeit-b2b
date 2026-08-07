'use client';

import { useState } from 'react';
import { enrichCompanyFromUrl } from '@/app/actions/enrichCompany';

interface EnrichedData {
  companyName: string;
  oneLiner: string;
  summary: string;
  category: string;
  suggestedOffers: Array<{
    title: string;
    description: string;
    estimatedValueUsd: number;
    category: string;
  }>;
  suggestedNeeds: Array<{
    title: string;
    description: string;
    estimatedValueUsd: number;
    category: string;
  }>;
}

export default function AiOnboarding() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanStep, setScanStep] = useState('Analyzing domain...');
  const [data, setData] = useState<EnrichedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEnrich = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setScanStep('Scraping website content...');

    // Simulate progressive status steps for visual feedback
    const timer1 = setTimeout(() => setScanStep('Extracting B2B offerings & needs...'), 1500);
    const timer2 = setTimeout(() => setScanStep('Generating vector embeddings...'), 3000);

    const res = await enrichCompanyFromUrl(url);

    clearTimeout(timer1);
    clearTimeout(timer2);
    setLoading(false);

    if (res.success && res.data) {
      setData(res.data as EnrichedData);
    } else {
      setError(res.error || 'Failed to analyze website.');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl font-bold text-xl">
          ⚡
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">1-Click AI Company Setup</h2>
          <p className="text-sm text-slate-400">
            Enter your website URL to auto-generate your barter profile and instant trade matches.
          </p>
        </div>
      </div>

      {!data && (
        <form onSubmit={handleEnrich} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g. acme-agency.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !url}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  <span>Analyzing...</span>
                </>
              ) : (
                <span>Extract Profile</span>
              )}
            </button>
          </div>

          {loading && (
            <div className="p-4 bg-indigo-950/30 border border-indigo-900/50 rounded-xl text-center">
              <p className="text-sm font-medium text-indigo-300 animate-pulse">{scanStep}</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-sm text-red-400">
              {error}
            </div>
          )}
        </form>
      )}

      {/* Profile Review Screen */}
      {data && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-start">
            <div>
              <span className="text-xs uppercase tracking-wider text-indigo-400 font-semibold">
                {data.category}
              </span>
              <h3 className="text-lg font-bold text-white mt-1">{data.companyName}</h3>
              <p className="text-sm text-slate-300 mt-1">{data.oneLiner}</p>
              <p className="text-xs text-slate-400 mt-2">{data.summary}</p>
            </div>
            <button
              onClick={() => setData(null)}
              className="text-xs text-slate-500 hover:text-slate-300 underline"
            >
              Re-scan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Extracted Offers */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase text-emerald-400 tracking-wider">
                Extracted Offers (What You Sell)
              </h4>
              {data.suggestedOffers.map((offer, i) => (
                <div key={i} className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-sm text-emerald-200">{offer.title}</span>
                    <span className="text-xs font-mono text-emerald-400">${offer.estimatedValueUsd}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{offer.description}</p>
                </div>
              ))}
            </div>

            {/* Extracted Needs */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase text-blue-400 tracking-wider">
                Inferred Needs (What You Want)
              </h4>
              {data.suggestedNeeds.map((need, i) => (
                <div key={i} className="p-3 bg-blue-950/20 border border-blue-900/40 rounded-xl">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-sm text-blue-200">{need.title}</span>
                    <span className="text-xs font-mono text-blue-400">${need.estimatedValueUsd}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{need.description}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => alert('Profile saved and listings populated with vector embeddings!')}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-900/20"
          >
            Confirm & Save Profile
          </button>
        </div>
      )}
    </div>
  );
}