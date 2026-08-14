'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { 
  Check, ShieldCheck, X, CheckCircle2, Sparkles, CreditCard, 
  Wallet, ArrowRight, Loader2, BadgeCheck, HelpCircle, Building2, User, Lock, Mail
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: string[];
  ctaText: string;
  badge?: string;
  highlighted: boolean;
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [activePlanId, setActivePlanId] = useState<string>('free');

  // Registration & Checkout Modal State
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [paymentOption, setPaymentOption] = useState<'card' | 'crypto' | 'free'>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Starter',
      monthlyPrice: 0,
      annualPrice: 0,
      description: 'Ideal for testing reciprocal trades and posting boutique service offers.',
      features: [
        '3 Active Trade Offers',
        'Direct 2-Way Reciprocal Swaps',
        'Standard AI Loop Matching',
        'CRA / IRS Barter Tax Export',
        'Community Support'
      ],
      ctaText: 'Get Started Free',
      highlighted: false
    },
    {
      id: 'pro',
      name: 'Pro B2B',
      monthlyPrice: 129,
      annualPrice: 99,
      description: 'For growing SMBs looking to convert surplus inventory into purchasing power.',
      features: [
        'Unlimited Active Offers',
        '3-Way & 4-Way Circular Loop Matching',
        '2-of-2 Solana Multi-Sig Escrow',
        'Priority Autonomous AI Agent Negotiator',
        'D-U-N-S Verified Entity Badge',
        'Full Tax Audit Ledger'
      ],
      badge: 'MOST POPULAR',
      ctaText: 'Start 14-Day Free Trial',
      highlighted: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      monthlyPrice: 499,
      annualPrice: 399,
      description: 'For corporate procurement fleets, manufacturers, and institutional RWAs.',
      features: [
        'Everything in Pro Included',
        'Full RWA Tokenization Studio (Token-2022)',
        'Multi-Seat Team Approvals & Roles',
        'Custom ERP / QuickBooks Integrations',
        'Dedicated Account Manager',
        '0% Protocol Swap Fees'
      ],
      ctaText: 'Get Started with Enterprise',
      highlighted: false
    }
  ];

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setRegStep(1);
    setPaymentOption(plan.monthlyPrice === 0 ? 'free' : 'card');
  };

  const handleCompleteRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !companyName) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setRegStep(3);
      if (selectedPlan) {
        setActivePlanId(selectedPlan.id);
      }
    }, 1500);
  };

  const faqs = [
    {
      q: 'How does tax accounting work for zero-cash barter?',
      a: 'In Canada and the US, barter transactions are treated as taxable sales at fair market value (FMV). TradeIt automatically logs CRA T2125 / IRS Schedule C compliant ledgers for every completed deal.'
    },
    {
      q: 'Can I cancel or change my plan anytime?',
      a: 'Yes, you can upgrade, downgrade, or cancel your subscription at any time directly from your dashboard settings with zero penalty.'
    },
    {
      q: 'How does 2-of-2 Multi-Sig Escrow protect my business?',
      a: 'Funds or tokenized assets are locked on the Solana blockchain. Neither party can withdraw until both entities sign off on successful delivery.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#4a6370] text-slate-100 flex flex-col font-sans">
      
      {/* GLOBAL HEADER */}
      <Header />

      {/* MAIN PRICING SECTION */}
      <main className="max-w-[1250px] w-full mx-auto px-6 py-12 sm:py-16 space-y-16 flex-1">
        
        {/* HEADER TITLE */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/10 border border-amber-400/30 rounded-full text-xs font-semibold text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>SIMPLE, TRANSPARENT B2B PRICING</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Predictable Plans for Modern Trade
          </h1>

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
            Turn surplus capacity and overstock into purchasing power. Zero hidden fees.
          </p>

          {/* MONTHLY / ANNUAL SWITCH */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-300'}`}>Monthly Billing</span>
            
            <button
              onClick={() => setBillingCycle((prev) => prev === 'monthly' ? 'annual' : 'monthly')}
              className="w-12 h-6 bg-[#2d404b] border border-white/20 rounded-full p-1 flex items-center cursor-pointer transition-all"
            >
              <div className={`w-4 h-4 bg-amber-400 rounded-full transition-transform duration-200 ${billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>

            <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === 'annual' ? 'text-white' : 'text-slate-300'}`}>
              Annual Billing
              <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-mono">2 Months Free</span>
            </span>
          </div>
        </div>

        {/* PRICING CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const isCurrent = plan.id === activePlanId;
            const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-8 flex flex-col justify-between space-y-6 transition-all ${
                  isCurrent 
                    ? 'bg-[#3b505d] border-2 border-emerald-400 shadow-2xl relative'
                    : plan.highlighted 
                    ? 'bg-[#3b505d] border-2 border-amber-400 shadow-2xl relative scale-105' 
                    : 'bg-[#2d404b] border border-white/15'
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white font-black text-[10px] uppercase px-4 py-1 rounded-full shadow-md font-mono flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" /> ACTIVE PLAN
                  </span>
                )}

                {!isCurrent && plan.badge && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-[#334652] font-black text-[10px] uppercase px-4 py-1 rounded-full shadow-md font-mono">
                    {plan.badge}
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-white">{plan.name}</h3>
                    <p className="text-xs text-slate-300 mt-1 min-h-[32px]">{plan.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">${price}</span>
                    <span className="text-xs text-slate-300 font-mono">/ month {billingCycle === 'annual' && price > 0 ? '(billed yearly)' : ''}</span>
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
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCurrent}
                  className={`w-full py-3.5 rounded-full font-extrabold text-xs cursor-pointer shadow-lg transition-all ${
                    isCurrent
                      ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-400/40 cursor-default'
                      : plan.highlighted
                      ? 'bg-white text-[#334652] hover:bg-slate-100'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  {isCurrent ? 'Your Active Plan' : plan.ctaText}
                </Button>
              </div>
            );
          })}
        </div>

        {/* FAQ ACCORDION / GRID */}
        <div className="pt-12 border-t border-white/10 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold text-white flex items-center justify-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              <span>Frequently Asked Questions</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-[#2d404b] border border-white/10 space-y-2">
                <h4 className="font-bold text-xs text-white leading-snug">{faq.q}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* FAST WORKING REGISTRATION MODAL */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#2d404b] border border-white/20 w-full max-w-md rounded-3xl p-6 sm:p-8 space-y-5 text-slate-100 shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setSelectedPlan(null)} 
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {regStep === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); setRegStep(2); }} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-amber-300 uppercase font-bold">STEP 1 OF 2 • CREATE ACCOUNT</span>
                  <h3 className="text-xl font-extrabold text-white">Join on {selectedPlan.name}</h3>
                  <p className="text-xs text-slate-300">Enter your business details to unlock reciprocal trading.</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-200 mb-1 font-medium">Business / Entity Name</label>
                    <div className="flex items-center gap-2 bg-[#3a4f5c] border border-white/20 rounded-xl px-3 py-2.5">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Easy Mondays Apparel"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="bg-transparent text-white w-full focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-200 mb-1 font-medium">Work Email Address</label>
                    <div className="flex items-center gap-2 bg-[#3a4f5c] border border-white/20 rounded-xl px-3 py-2.5">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-transparent text-white w-full focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-200 mb-1 font-medium">Password</label>
                    <div className="flex items-center gap-2 bg-[#3a4f5c] border border-white/20 rounded-xl px-3 py-2.5">
                      <Lock className="w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-transparent text-white w-full focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-white hover:bg-slate-100 text-[#334652] font-extrabold text-xs py-3 rounded-full shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <span>Continue to Activation</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            )}

            {regStep === 2 && (
              <form onSubmit={handleCompleteRegister} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-amber-300 uppercase font-bold">STEP 2 OF 2 • ACTIVATION</span>
                  <h3 className="text-xl font-extrabold text-white">Select Billing Option</h3>
                  <p className="text-xs text-slate-300">Confirm payment method for {selectedPlan.name}.</p>
                </div>

                {selectedPlan.monthlyPrice === 0 ? (
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-400/30 text-xs text-emerald-200 space-y-1">
                    <p className="font-bold">✓ Free Tier Selected</p>
                    <p className="text-[11px] opacity-80">No credit card or cash required. Instant trade feed access.</p>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div 
                      onClick={() => setPaymentOption('card')}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between ${paymentOption === 'card' ? 'bg-[#3a4f5c] border-amber-400' : 'bg-[#24343e] border-white/10'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="w-4 h-4 text-amber-400" />
                        <span>Corporate Card (${billingCycle === 'annual' ? selectedPlan.annualPrice : selectedPlan.monthlyPrice}/mo)</span>
                      </div>
                      <input type="radio" checked={paymentOption === 'card'} readOnly className="accent-amber-400" />
                    </div>

                    <div 
                      onClick={() => setPaymentOption('crypto')}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between ${paymentOption === 'crypto' ? 'bg-[#3a4f5c] border-amber-400' : 'bg-[#24343e] border-white/10'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Wallet className="w-4 h-4 text-amber-400" />
                        <span>Solana USDC Keypair</span>
                      </div>
                      <input type="radio" checked={paymentOption === 'crypto'} readOnly className="accent-amber-400" />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => setRegStep(1)} 
                    className="px-4 py-2.5 text-xs text-slate-300 hover:text-white font-medium cursor-pointer"
                  >
                    Back
                  </button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-white hover:bg-slate-100 text-[#334652] font-extrabold text-xs py-3 rounded-full shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Complete Registration & Activate</span>}
                  </Button>
                </div>
              </form>
            )}

            {regStep === 3 && (
              <div className="py-4 space-y-4 text-center">
                <div className="p-3 bg-emerald-900/60 rounded-full w-12 h-12 mx-auto flex items-center justify-center border border-emerald-400/40">
                  <CheckCircle2 className="w-6 h-6 text-emerald-300" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white">{selectedPlan.name} Plan Active!</h3>
                  <p className="text-xs text-slate-300">
                    Welcome <strong className="text-white">{companyName}</strong>. Your reciprocal trading permissions are officially enabled.
                  </p>
                </div>

                <Link href="/">
                  <Button
                    onClick={() => setSelectedPlan(null)}
                    className="w-full bg-white hover:bg-slate-100 text-[#334652] font-extrabold text-xs py-3 rounded-full shadow-md cursor-pointer mt-2"
                  >
                    Go to Trading Dashboard
                  </Button>
                </Link>
              </div>
            )}

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#24333b] py-6 px-6 text-xs text-slate-300 flex items-center justify-between">
        <div><strong>TradeIt B2B Network</strong> • Zero-Cash Reciprocal Exchange</div>
        <Link href="/" className="hover:text-white">Back to Dashboard</Link>
      </footer>

    </div>
  );
}