'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, ArrowLeft, ShieldCheck, X, CheckCircle2 } from 'lucide-react';

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'starter',
      name: 'Starter Barter',
      price: '$0',
      period: 'Forever Free',
      description: 'Ideal for independent creators, freelancers, and boutique service studios.',
      features: [
        'Post up to 3 Active Trade Offers',
        'Direct 2-Way Reciprocal Swaps',
        'Standard AI Matcher Access',
        'Basic Tax Accounting Export (CRA / IRS)',
        'Standard Community Support'
      ],
      buttonText: 'Start Trading Free',
      highlighted: false
    },
    {
      id: 'growth',
      name: 'Growth B2B',
      price: '$149',
      period: 'per month',
      description: 'Designed for growing SMBs looking to monetize surplus inventory & capacity.',
      features: [
        'Unlimited Active Trade Offers',
        'Autonomous 3-Way & 4-Way Circular Loop Matching',
        'Solana 2-of-2 Multi-Sig Escrow Vaults',
        'Priority AI Agent Negotiation Engine',
        'Full Tax & Audit Ledger Export',
        'D-U-N-S Business Verification Badge'
      ],
      buttonText: 'Upgrade to Growth',
      highlighted: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise Network',
      price: '$499',
      period: 'per month',
      description: 'Built for corporate procurement teams, logistics fleets, and institutional RWAs.',
      features: [
        'All Growth Features Included',
        'Full RWA Tokenization Studio & Token-2022 Access',
        'Multi-Seat Team Governance & Approval Roles',
        'Custom ERP & QuickBooks API Connectors',
        'Dedicated Network Relationship Manager',
        '0% Protocol Fee on High-Volume Reciprocal Swaps'
      ],
      buttonText: 'Contact Enterprise Sales',
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#4a6370] text-slate-100 flex flex-col font-sans">
      
      {/* HEADER */}
      <header className="border-b border-white/10 bg-[#425965]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center gap-2 text-xs text-slate-200 hover:text-white font-bold">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-[1300px] w-full mx-auto p-6 sm:p-12 space-y-12 flex-1">
        
        {/* HERO */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-black text-white">Transparent B2B Membership</h1>
          <p className="text-sm text-slate-200 leading-relaxed">
            Trade surplus capacity with zero cash outlay. Choose the plan that best fits your business size and procurement needs.
          </p>
        </div>

        {/* PRICING CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-3xl p-8 flex flex-col justify-between space-y-6 transition-all ${
                plan.highlighted 
                  ? 'bg-[#3b505d] border-2 border-amber-400 shadow-2xl relative scale-105' 
                  : 'bg-[#2d404b] border border-white/15'
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-[#334652] font-black text-[10px] uppercase px-4 py-1 rounded-full shadow-md font-mono">
                  MOST POPULAR FOR SMBS
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-extrabold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-300 mt-1">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-xs text-slate-300 font-mono">{plan.period}</span>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-white/10 text-xs text-slate-200">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => setSelectedPlan(plan.name)}
                className={`w-full py-3.5 rounded-full font-extrabold text-xs cursor-pointer shadow-lg transition-all ${
                  plan.highlighted
                    ? 'bg-white text-[#334652] hover:bg-slate-100'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                }`}
              >
                {plan.buttonText}
              </Button>
            </div>
          ))}
        </div>

        {/* TAX & COMPLIANCE FOOTNOTE */}
        <div className="p-6 rounded-3xl bg-[#2d404b] border border-white/15 flex items-center justify-start gap-3 text-xs font-mono text-slate-200">
          <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0" />
          <span>Tax Compliant: Automatic non-cash barter ledger exports (CRA T2125 / IRS Schedule C).</span>
        </div>

      </main>

      {/* MEMBERSHIP PLAN ACTION MODAL */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#2d404b] border border-white/20 w-full max-w-md rounded-3xl p-6 space-y-5 text-center text-slate-100 shadow-2xl relative">
            <button 
              onClick={() => setSelectedPlan(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-3 bg-amber-400/10 rounded-full w-12 h-12 mx-auto flex items-center justify-center border border-amber-400/30">
              <CheckCircle2 className="w-6 h-6 text-amber-400" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Select {selectedPlan} Plan</h3>
              <p className="text-xs text-slate-300">
                Your account is being configured for the <strong className="text-amber-300">{selectedPlan}</strong> tier on Solana Devnet.
              </p>
            </div>

            <Button
              onClick={() => setSelectedPlan(null)}
              className="w-full bg-white hover:bg-slate-100 text-[#334652] font-extrabold text-xs py-3 rounded-full shadow-md cursor-pointer"
            >
              Proceed to Dashboard
            </Button>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#24333b] py-6 px-6 text-xs text-slate-300 flex items-center justify-between">
        <div><strong>TradeIt Pricing & Governance</strong></div>
        <Link href="/" className="hover:text-white">Back to Dashboard</Link>
      </footer>

    </div>
  );
}