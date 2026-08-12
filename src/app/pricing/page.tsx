'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Check, Tornado, ArrowLeft, ShieldCheck, Zap, Sparkles, Building2, User, Crown, ArrowRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden">
      
      {/* Top Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <Link href="/" className="p-2 bg-red-600/10 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-600/20 transition-all">
            <Tornado className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
          </Link>
          <div>
            <h1 className="font-extrabold text-white text-base tracking-wider flex items-center gap-2">
              TRADEIT <span className="text-red-500 text-xs font-mono px-2 py-0.5 bg-red-950/80 border border-red-500/30 rounded-md">MEMBERSHIP PASS</span>
            </h1>
          </div>
        </div>

        <Link href="/">
          <Button variant="outline" size="sm" className="bg-slate-900 border-slate-800 text-slate-300 hover:text-white text-xs cursor-pointer flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Stage</span>
          </Button>
        </Link>
      </header>

      {/* Hero Header */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 py-12 space-y-12">
        
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-950/60 border border-red-500/30 rounded-full text-red-400 text-xs font-bold font-mono">
            <Sparkles className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span>0% TRANSACTION COMMISSIONS • FLAT ANNUAL NETWORK PASS</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Unlock Zero-Cash B2B Liquidity
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Trade excess capacity, inventory, and unbilled service hours with verified companies. One trade covers your entire annual pass.
          </p>

          {/* Billing Toggle */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span className={`text-xs font-bold ${billingCycle === 'annual' ? 'text-white' : 'text-slate-500'}`}>
              Annual Pass <span className="text-emerald-400 font-mono">(0% Trade Tax)</span>
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'annual' ? 'monthly' : 'annual')}
              className="w-12 h-6 bg-slate-800 rounded-full p-1 border border-slate-700 relative transition-all"
            >
              <div className={`w-4 h-4 bg-red-500 rounded-full transition-all ${billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-500'}`}>
              Flex Monthly
            </span>
          </div>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          
          {/* Card 1: Freelancer */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between space-y-6 hover:border-slate-700 transition-all">
            <div className="space-y-4">
              <div className="p-3 bg-slate-800/60 w-fit rounded-2xl border border-slate-700 text-slate-300">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Freelancer Pass</h3>
                <p className="text-xs text-slate-400 mt-1">For solopreneurs, creators & independent consultants.</p>
              </div>

              <div className="pt-2">
                <span className="text-3xl font-black text-white">$299</span>
                <span className="text-slate-400 text-xs"> / year</span>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">~$25/month billed annually</p>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Up to <strong>$25,000 CAD</strong> 0% Fee Trade Volume/yr</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>2 Active Listing Posts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Standard AI Screening Negotiator Agent</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Realtime Deal Room & Chat</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1 Team User Seat</span>
                </li>
              </ul>
            </div>

            <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3 rounded-xl border border-slate-700 cursor-pointer">
              Get Freelancer Pass
            </Button>
          </div>

          {/* Card 2: Small Business (Hero / Highlighted) */}
          <div className="bg-gradient-to-b from-red-950/40 via-slate-900 to-slate-900 border-2 border-red-500 rounded-3xl p-8 flex flex-col justify-between space-y-6 shadow-2xl shadow-red-950/50 relative transform md:-translate-y-2">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-black tracking-widest px-3 py-0.5 rounded-full uppercase shadow-lg">
              MOST POPULAR • HIGH ROI
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-red-600/10 w-fit rounded-2xl border border-red-500/30 text-red-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Small Business Pass</h3>
                <p className="text-xs text-slate-400 mt-1">For boutique agencies, tech startups & retail brands (2–20 team).</p>
              </div>

              <div className="pt-2">
                <span className="text-4xl font-black text-white">$999</span>
                <span className="text-slate-400 text-xs"> / year</span>
                <p className="text-[10px] text-emerald-400 font-mono mt-0.5">~$83/month • Saves $10,000+ in cash outlay</p>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-200 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Up to <strong>$150,000 CAD</strong> 0% Fee Trade Volume/yr</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>10 Active Video Pitch & Need Listings</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Auto-Sign AI Agent</strong> (Custom Policy Boundaries)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Priority 3-Way Loop Matching Engine</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Automated AI Escrow Deliverable Auditor</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Up to 3 Team User Seats</span>
                </li>
              </ul>
            </div>

            <Button className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-red-600/30 cursor-pointer">
              Get Small Business Pass
            </Button>
          </div>

          {/* Card 3: Corporate / Pro Pass */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between space-y-6 hover:border-slate-700 transition-all">
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/10 w-fit rounded-2xl border border-amber-500/20 text-amber-400">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Corporate / Pro Pass</h3>
                <p className="text-xs text-slate-400 mt-1">For mid-market enterprises, multi-location retail & large firms.</p>
              </div>

              <div className="pt-2">
                <span className="text-3xl font-black text-white">$2,999</span>
                <span className="text-slate-400 text-xs"> / year</span>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">~$250/month billed annually</p>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>UNLIMITED</strong> 0% Fee Trade Volume</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited Offer & Need Listings</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Multi-Agent Fleet</strong> (Brand-specific negotiation)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>API Access (Auto-sync inventory & idle hours)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>VIP Instant Loop Matching & SLA Escrow</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited Team Seats & Dedicated Matchmaker</span>
                </li>
              </ul>
            </div>

            <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3 rounded-xl border border-slate-700 cursor-pointer">
              Contact Enterprise Sales
            </Button>
          </div>

        </div>

        {/* Instant ROI Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-base font-extrabold text-white flex items-center justify-center sm:justify-start gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              How 1 Trade Pays For Your Entire Pass
            </h4>
            <p className="text-xs text-slate-400 max-w-xl">
              Trading $10,000 worth of excess stock or service hours saves your business $10,000 in direct cash outlay—yielding a 10x ROI on a $999 Small Business Pass on day one.
            </p>
          </div>

          <Link href="/">
            <Button className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-6 h-10 rounded-xl flex items-center gap-2 cursor-pointer shrink-0">
              <span>Explore Active Stage</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

      </main>
    </div>
  );
}