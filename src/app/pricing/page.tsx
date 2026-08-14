'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { 
  Check, ShieldCheck, X, CheckCircle2, Sparkles, CreditCard, 
  Wallet, Coins, ArrowRight, Loader2, Building2, BadgeCheck, FileText 
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: string[];
  highlighted: boolean;
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [activePlanId, setActivePlanId] = useState<string>('starter'); // Default free tier
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);

  // Checkout Wizard State
  const [checkoutStep, setCheckoutStep] = useState<number>(1);
  const [companyName, setCompanyName] = useState<string>('');
  const [dunsNumber, setDunsNumber] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto' | 'barter'>('card');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [membershipVaultPda, setMembershipVaultPda] = useState<string | null>(null);

  const plans: Plan[] = [
    {
      id: 'starter',
      name: 'Starter Barter',
      monthlyPrice: 0,
      annualPrice: 0,
      description: 'Ideal for independent creators, freelancers, and boutique service studios.',
      features: [
        'Post up to 3 Active Trade Offers',
        'Direct 2-Way Reciprocal Swaps',
        'Standard AI Matcher Access',
        'Basic Tax Accounting Export (CRA / IRS)',
        'Standard Community Support'
      ],
      highlighted: false
    },
    {
      id: 'growth',
      name: 'Growth B2B',
      monthlyPrice: 149,
      annualPrice: 119,
      description: 'Designed for growing SMBs looking to monetize surplus inventory & capacity.',
      features: [
        'Unlimited Active Trade Offers',
        'Autonomous 3-Way & 4-Way Circular Loop Matching',
        'Solana 2-of-2 Multi-Sig Escrow Vaults',
        'Priority AI Agent Negotiation Engine',
        'Full Tax & Audit Ledger Export',
        'D-U-N-S Business Verification Badge'
      ],
      highlighted: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise Network',
      monthlyPrice: 499,
      annualPrice: 399,
      description: 'Built for corporate procurement teams, logistics fleets, and institutional RWAs.',
      features: [
        'All Growth Features Included',
        'Full RWA Tokenization Studio & Token-2022 Access',
        'Multi-Seat Team Governance & Approval Roles',
        'Custom ERP & QuickBooks API Connectors',
        'Dedicated Network Relationship Manager',
        '0% Protocol Fee on High-Volume Reciprocal Swaps'
      ],
      highlighted: false
    }
  ];

  const handleOpenCheckout = (plan: Plan) => {
    if (plan.id === activePlanId) return;
    setCheckoutPlan(plan);
    setCheckoutStep(1);
  };

  const handleProcessSubscription = () => {
    setIsProcessing(true);
    setCheckoutStep(3);

    setTimeout(() => {
      const generatedPda = 'MEMBERSHIP_PDA_' + Math.random().toString(36).substring(2, 9).toUpperCase() + '_sol';
      setMembershipVaultPda(generatedPda);
      setIsProcessing(false);
      setCheckoutStep(4);
      if (checkoutPlan) {
        setActivePlanId(checkoutPlan.id);
      }
    }, 2200);
  };

  return (
    <div className="min-h-screen bg-[#4a6370] text-slate-100 flex flex-col font-sans">
      
      {/* SHARED UNIFIED HEADER */}
      <Header />

      {/* MAIN CONTENT */}
      <main className="max-w-[1300px] w-full mx-auto p-6 sm:p-12 space-y-12 flex-1">
        
        {/* HERO */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/10 border border-amber-400/30 rounded-full text-xs font-semibold text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Frictionless Reciprocal Membership Tiers</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white">Transparent B2B Membership</h1>
          <p className="text-sm text-slate-200 leading-relaxed">
            Trade surplus capacity with zero cash outlay. Choose the plan that best fits your business size and procurement requirements.
          </p>

          {/* MONTHLY / ANNUAL TOGGLE */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <span className={`text-xs font-medium ${billingCycle === 'monthly' ? 'text-white font-bold' : 'text-slate-300'}`}>Monthly</span>
            <button
              onClick={() => setBillingCycle((prev) => prev === 'monthly' ? 'annual' : 'monthly')}
              className="w-12 h-6 bg-[#2d404b] border border-white/20 rounded-full p-1 flex items-center cursor-pointer transition-all"
            >
              <div className={`w-4 h-4 bg-amber-400 rounded-full transition-all transform ${billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <span className={`text-xs font-medium flex items-center gap-1.5 ${billingCycle === 'annual' ? 'text-white font-bold' : 'text-slate-300'}`}>
              Annual
              <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-mono">Save 20%</span>
            </span>
          </div>
        </div>

        {/* PRICING CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === activePlanId;
            const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-8 flex flex-col justify-between space-y-6 transition-all ${
                  isCurrentPlan 
                    ? 'bg-[#3b505d] border-2 border-emerald-400 shadow-2xl relative' 
                    : plan.highlighted 
                    ? 'bg-[#3b505d] border-2 border-amber-400 shadow-2xl relative scale-105' 
                    : 'bg-[#2d404b] border border-white/15'
                }`}
              >
                {isCurrentPlan ? (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white font-black text-[10px] uppercase px-4 py-1 rounded-full shadow-md font-mono flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" /> CURRENT ACTIVE PLAN
                  </span>
                ) : plan.highlighted ? (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-[#334652] font-black text-[10px] uppercase px-4 py-1 rounded-full shadow-md font-mono">
                    MOST POPULAR FOR SMBS
                  </span>
                ) : null}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-white">{plan.name}</h3>
                    <p className="text-xs text-slate-300 mt-1">{plan.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">${price}</span>
                    <span className="text-xs text-slate-300 font-mono">/ {billingCycle === 'annual' ? 'month (billed annually)' : 'month'}</span>
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
                  onClick={() => handleOpenCheckout(plan)}
                  disabled={isCurrentPlan}
                  className={`w-full py-3.5 rounded-full font-extrabold text-xs cursor-pointer shadow-lg transition-all ${
                    isCurrentPlan
                      ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-400/40 opacity-90 cursor-default'
                      : plan.highlighted
                      ? 'bg-white text-[#334652] hover:bg-slate-100'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  {isCurrentPlan ? 'Active Membership Tier' : plan.monthlyPrice === 0 ? 'Select Free Tier' : `Subscribe to ${plan.name}`}
                </Button>
              </div>
            );
          })}
        </div>

        {/* TAX & COMPLIANCE FOOTNOTE */}
        <div className="p-6 rounded-3xl bg-[#2d404b] border border-white/15 flex items-center justify-start gap-3 text-xs font-mono text-slate-200">
          <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0" />
          <span>Tax Compliant: Automatic non-cash barter ledger exports (CRA T2125 / IRS Schedule C).</span>
        </div>

      </main>

      {/* FULL WORKING CHECKOUT & MEMBERSHIP WIZARD MODAL */}
      {checkoutPlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#2d404b] border border-white/20 w-full max-w-lg rounded-3xl p-6 sm:p-8 space-y-6 text-slate-100 shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setCheckoutPlan(null)} 
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* STEP 1: BUSINESS IDENTITY */}
            {checkoutStep === 1 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-xs font-mono text-amber-300 font-bold">STEP 1 OF 3 • IDENTITY VERIFICATION</div>
                  <h3 className="text-xl font-black text-white">Subscribe to {checkoutPlan.name}</h3>
                  <p className="text-xs text-slate-300">
                    Set up your enterprise verification profile for reciprocal trade clearance.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-200 mb-1 font-medium">Registered Business or Studio Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Easy Mondays Apparel or Montreal Creative"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-[#3a4f5c] border border-white/20 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-200 mb-1 font-medium">D-U-N-S or Business Tax ID (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. D-U-N-S #8849201"
                      value={dunsNumber}
                      onChange={(e) => setDunsNumber(e.target.value)}
                      className="w-full bg-[#3a4f5c] border border-white/20 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-white font-mono"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => setCheckoutStep(2)}
                  disabled={!companyName.trim()}
                  className="w-full bg-white hover:bg-slate-100 text-[#334652] font-extrabold text-xs py-3 rounded-full shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>Continue to Payment & Staking</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* STEP 2: PAYMENT METHOD */}
            {checkoutStep === 2 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-xs font-mono text-amber-300 font-bold">STEP 2 OF 3 • SETTLEMENT METHOD</div>
                  <h3 className="text-xl font-black text-white">Select Payment Preference</h3>
                  <p className="text-xs text-slate-300">Choose how your membership plan is settled monthly.</p>
                </div>

                <div className="space-y-2 text-xs">
                  <div 
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between ${paymentMethod === 'card' ? 'bg-[#3a4f5c] border-amber-400' : 'bg-[#24343e] border-white/10'}`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-amber-400" />
                      <div>
                        <div className="font-bold text-white">Corporate Credit Card / ACH</div>
                        <div className="text-[10px] text-slate-300">Stripe Billing (${checkoutPlan.monthlyPrice}/mo)</div>
                      </div>
                    </div>
                    <input type="radio" checked={paymentMethod === 'card'} readOnly className="accent-amber-400" />
                  </div>

                  <div 
                    onClick={() => setPaymentMethod('crypto')}
                    className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between ${paymentMethod === 'crypto' ? 'bg-[#3a4f5c] border-amber-400' : 'bg-[#24343e] border-white/10'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Wallet className="w-5 h-5 text-amber-400" />
                      <div>
                        <div className="font-bold text-white">Solana USDC Wallet Direct</div>
                        <div className="text-[10px] text-slate-300">Pay directly from connected Solana Devnet keypair</div>
                      </div>
                    </div>
                    <input type="radio" checked={paymentMethod === 'crypto'} readOnly className="accent-amber-400" />
                  </div>

                  <div 
                    onClick={() => setPaymentMethod('barter')}
                    className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between ${paymentMethod === 'barter' ? 'bg-[#3a4f5c] border-amber-400' : 'bg-[#24343e] border-white/10'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Coins className="w-5 h-5 text-amber-400" />
                      <div>
                        <div className="font-bold text-white">Non-Cash Barter Credit Stake</div>
                        <div className="text-[10px] text-slate-300">Offset using accrued Trade Credit liquidity</div>
                      </div>
                    </div>
                    <input type="radio" checked={paymentMethod === 'barter'} readOnly className="accent-amber-400" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setCheckoutStep(1)} 
                    className="px-4 py-2.5 text-xs text-slate-300 hover:text-white font-medium"
                  >
                    Back
                  </button>
                  <Button
                    onClick={handleProcessSubscription}
                    className="flex-1 bg-white hover:bg-slate-100 text-[#334652] font-extrabold text-xs py-3 rounded-full shadow-md cursor-pointer"
                  >
                    Confirm & Activate Membership
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: PROCESSING SIMULATION */}
            {checkoutStep === 3 && (
              <div className="py-8 space-y-4 text-center">
                <Loader2 className="w-10 h-10 animate-spin text-amber-400 mx-auto" />
                <div className="space-y-1">
                  <h3 className="font-extrabold text-white text-base">Provisioning Solana Multi-Sig Vault...</h3>
                  <p className="text-xs text-slate-300 font-mono">Minting non-fungible membership PDA key on Devnet...</p>
                </div>
              </div>
            )}

            {/* STEP 4: SUCCESS CONFIRMATION */}
            {checkoutStep === 4 && (
              <div className="space-y-5 text-center">
                <div className="p-3 bg-emerald-900/60 rounded-full w-12 h-12 mx-auto flex items-center justify-center border border-emerald-400/40">
                  <CheckCircle2 className="w-6 h-6 text-emerald-300" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white">{checkoutPlan.name} Activated!</h3>
                  <p className="text-xs text-slate-300">
                    Welcome <strong className="text-white">{companyName}</strong>. Your reciprocal trade permissions are now live.
                  </p>
                </div>

                <div className="bg-[#24343e] p-4 rounded-2xl border border-white/10 text-xs font-mono space-y-2 text-left">
                  <div className="flex justify-between"><span className="text-slate-400">Company:</span> <span className="text-white font-bold">{companyName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Membership Tier:</span> <span className="text-amber-300 font-bold uppercase">{checkoutPlan.name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Membership PDA:</span> <span className="text-emerald-300">{membershipVaultPda}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Tax Logging:</span> <span>Active (CRA T2125 / IRS Schedule C)</span></div>
                </div>

                <Link href="/">
                  <Button
                    onClick={() => setCheckoutPlan(null)}
                    className="w-full bg-white hover:bg-slate-100 text-[#334652] font-extrabold text-xs py-3 rounded-full shadow-md cursor-pointer mt-2"
                  >
                    Launch Trading Dashboard
                  </Button>
                </Link>
              </div>
            )}

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#24333b] py-6 px-6 text-xs text-slate-300 flex items-center justify-between">
        <div><strong>TradeIt Membership Engine</strong> • Solana 2-of-2 Escrow Compliant</div>
        <Link href="/" className="hover:text-white">Back to Dashboard</Link>
      </footer>

    </div>
  );
}