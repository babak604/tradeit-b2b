'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { 
  Check, ShieldCheck, X, CheckCircle2, Sparkles, CreditCard, 
  Wallet, ArrowRight, Loader2, BadgeCheck, HelpCircle, Building2, 
  User, Lock, Mail, Briefcase, Zap, ChevronRight, Percent, Scale
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  targetAudience: string;
  annualPrice: number;
  monthlyEquivalent: number;
  tradeFee: string;
  description: string;
  features: string[];
  ctaText: string;
  badge?: string;
  highlighted: boolean;
}

export default function PricingPage() {
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  // Registration & Activation Modal State
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyOrStudio, setCompanyOrStudio] = useState('');
  const [tradeOffer, setTradeOffer] = useState('');
  const [password, setPassword] = useState('');
  const [paymentOption, setPaymentOption] = useState<'free' | 'card' | 'crypto'>('free');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedPda, setGeneratedPda] = useState<string>('');

  const plans: Plan[] = [
    {
      id: 'freelancer',
      name: 'Freelancer & Solo',
      targetAudience: 'FREELANCERS & CREATORS',
      annualPrice: 0,
      monthlyEquivalent: 0,
      tradeFee: '5.0% per trade',
      description: 'Zero upfront cost. Barter billable hours, software dev, 4K video, or design for goods & services.',
      features: [
        'Trade Skill Hours & Portfolio Services',
        'Up to 3 Active Reciprocal Listings',
        'Direct 2-Way Reciprocal Swaps',
        'Standard AI Loop Matcher Access',
        'CRA T2125 / IRS Barter Tax Export',
        'Solana Devnet Wallet & Escrow Setup'
      ],
      ctaText: 'Activate Free Freelancer Plan',
      highlighted: false
    },
    {
      id: 'pro',
      name: 'Pro B2B',
      targetAudience: 'GROWING SMBS & AGENCIES',
      annualPrice: 1188,
      monthlyEquivalent: 99,
      tradeFee: '2.5% per trade',
      description: 'For growing SMBs and agencies converting surplus inventory and team capacity into purchasing power.',
      features: [
        'Unlimited Active Trade Offers',
        'Autonomous 3-Way & 4-Way Circular Loops',
        '2-of-2 Solana Multi-Sig Escrow Vaults',
        'Priority Autonomous AI Negotiator Agent',
        'D-U-N-S Verified Entity Badge',
        'Full Tax & Audit Ledger Export'
      ],
      badge: 'MOST POPULAR FOR SMBS',
      ctaText: 'Start Pro B2B Trial',
      highlighted: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise Network',
      targetAudience: 'CORPORATIONS & RWAS',
      annualPrice: 4788,
      monthlyEquivalent: 399,
      tradeFee: '0% (Zero Swap Fees)',
      description: 'For corporate procurement fleets, manufacturing overstock, and institutional RWA asset tokenization.',
      features: [
        'All Pro B2B Features Included',
        'Full RWA Tokenization Studio (Token-2022)',
        'Multi-Seat Team Approvals & Governance',
        'Custom ERP & QuickBooks API Connectors',
        'Dedicated Account Manager',
        '0% Protocol Transaction Fees'
      ],
      ctaText: 'Activate Enterprise Network',
      highlighted: false
    }
  ];

  const handleOpenPlanWizard = (plan: Plan) => {
    setSelectedPlan(plan);
    setRegStep(1);
    setPaymentOption(plan.annualPrice === 0 ? 'free' : 'card');
  };

  const handleCompleteRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !companyOrStudio || !fullName) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const pda = 'SOL_VAULT_' + Math.random().toString(36).substring(2, 9).toUpperCase() + '_2026';
      setGeneratedPda(pda);
      setIsSubmitting(false);
      setRegStep(3);
      if (selectedPlan) {
        setActivePlanId(selectedPlan.id);
      }
    }, 1400);
  };

  const faqs = [
    {
      q: 'How does the Freelancer tier work?',
      a: 'The Freelancer plan is 100% free to join ($0/year) with a modest 5.0% trade execution fee paid only when a trade is successfully completed. It allows developers, designers, video editors, and consultants to trade service hours for physical goods, office space, or equipment without spending cash.'
    },
    {
      q: 'Why are Pro and Enterprise billed annually?',
      a: 'Annual commitments allow TradeIt to provision dedicated 2-of-2 Solana multi-sig vaults, guarantee network liquidity depth, and maintain continuous tax accounting compliance (CRA T2125 & IRS Schedule C) throughout the fiscal year.'
    },
    {
      q: 'What are Reciprocal Trade Execution Fees?',
      a: 'Standard barter networks charge 6% to 7.5% cash commission on every trade. TradeIt offers ultra-low rates (5% for Freelancers, 2.5% for Pro B2B, and 0% for Enterprise) enforced directly by on-chain smart contracts.'
    },
    {
      q: 'How does 2-of-2 Multi-Sig Escrow protect my trades?',
      a: 'Every transaction generates a unique vault on the Solana blockchain. Deliverables, services, or tokenized RWAs are safely locked until both parties cryptographically sign off on fulfillment.'
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
            <span>2026 B2B RECIPROCAL TRADE PRICING</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Turn Surplus Capacity Into Purchasing Power
          </h1>

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl mx-auto">
            Transparent annual memberships backed by automated 2-of-2 Solana escrow vaults and real-time CRA / IRS tax accounting logs.
          </p>
        </div>

        {/* PRICING CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const isCurrent = plan.id === activePlanId;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-8 flex flex-col justify-between space-y-6 transition-all ${
                  isCurrent 
                    ? 'bg-[#3b505d] border-2 border-emerald-400 shadow-2xl relative'
                    : plan.highlighted 
                    ? 'bg-[#3b505d] border-2 border-amber-400 shadow-2xl relative scale-105' 
                    : 'bg-[#2d404b] border border-white/15 hover:border-white/30'
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white font-black text-[10px] uppercase px-4 py-1 rounded-full shadow-md font-mono flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" /> ACTIVE MEMBERSHIP
                  </span>
                )}

                {!isCurrent && plan.badge && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-[#334652] font-black text-[10px] uppercase px-4 py-1 rounded-full shadow-md font-mono">
                    {plan.badge}
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono text-amber-300 uppercase tracking-wider font-bold block">{plan.targetAudience}</span>
                    <h3 className="text-xl font-extrabold text-white mt-1">{plan.name}</h3>
                    <p className="text-xs text-slate-300 mt-1 min-h-[36px] leading-relaxed">{plan.description}</p>
                  </div>

                  <div className="border-y border-white/10 py-4 space-y-1">
                    {plan.annualPrice === 0 ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white">$0</span>
                        <span className="text-xs text-slate-300 font-mono">/ year</span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-white">${plan.annualPrice.toLocaleString()}</span>
                          <span className="text-xs text-slate-300 font-mono">/ year</span>
                        </div>
                        <p className="text-[11px] text-amber-300 font-mono font-medium mt-0.5">
                          (${plan.monthlyEquivalent}/mo billed annually)
                        </p>
                      </div>
                    )}

                    <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-300 font-medium">
                      <Percent className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Trade Fee: <strong>{plan.tradeFee}</strong></span>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-200">
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => handleOpenPlanWizard(plan)}
                  className={`w-full py-3.5 rounded-full font-extrabold text-xs cursor-pointer shadow-lg transition-all ${
                    isCurrent
                      ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-400/50 hover:bg-emerald-800'
                      : plan.highlighted
                      ? 'bg-white text-[#334652] hover:bg-slate-100'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  {isCurrent ? 'Manage Active Plan' : plan.ctaText}
                </Button>
              </div>
            );
          })}
        </div>

        {/* COMPARISON FEATURE SUMMARY TABLE */}
        <div className="p-8 rounded-3xl bg-[#2d404b] border border-white/15 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-extrabold text-white">Network Feature Comparison</h3>
            </div>
            <span className="text-xs font-mono text-amber-300">CRA T2125 / IRS Schedule C Audit Ready</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="text-slate-400 font-bold uppercase text-[10px]">Feature / Capability</div>
            <div className="text-amber-300 font-bold">Freelancer & Solo</div>
            <div className="text-amber-300 font-bold">Pro B2B</div>
            <div className="text-amber-300 font-bold">Enterprise Network</div>

            <div className="text-slate-200 font-sans">Active Trade Listings</div>
            <div className="text-slate-300">3 Listings</div>
            <div className="text-emerald-300 font-bold">Unlimited</div>
            <div className="text-emerald-300 font-bold">Unlimited</div>

            <div className="text-slate-200 font-sans">Circular Loop Engine</div>
            <div className="text-slate-300">Direct 2-Way Swaps</div>
            <div className="text-emerald-300 font-bold">3-Way & 4-Way Loops</div>
            <div className="text-emerald-300 font-bold">3-Way & 4-Way Loops</div>

            <div className="text-slate-200 font-sans">Solana Escrow Standard</div>
            <div className="text-slate-300">Standard Escrow</div>
            <div className="text-emerald-300 font-bold">2-of-2 Multi-Sig Vaults</div>
            <div className="text-emerald-300 font-bold">Token-2022 Transfer Hooks</div>

            <div className="text-slate-200 font-sans">Trade Execution Fee</div>
            <div className="text-slate-300">5.0% per trade</div>
            <div className="text-slate-300">2.5% per trade</div>
            <div className="text-emerald-300 font-bold">0% Protocol Fees</div>
          </div>
        </div>

        {/* FAQ ACCORDION / GRID */}
        <div className="pt-8 border-t border-white/10 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold text-white flex items-center justify-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              <span>Frequently Asked Questions</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-[#2d404b] border border-white/10 space-y-2">
                <h4 className="font-bold text-xs text-white leading-snug">{faq.q}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* FULL WORKING INTERACTIVE REGISTRATION & ACTIVATION WIZARD */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#2d404b] border border-white/20 w-full max-w-md rounded-3xl p-6 sm:p-8 space-y-5 text-slate-100 shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setSelectedPlan(null)} 
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* STEP 1: ENTITY DETAILS */}
            {regStep === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); setRegStep(2); }} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-amber-300 uppercase font-bold">STEP 1 OF 2 • ENTITY REGISTRATION</span>
                  <h3 className="text-xl font-extrabold text-white">Activate {selectedPlan.name}</h3>
                  <p className="text-xs text-slate-300">Set up your trade profile for reciprocal clearance.</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-200 mb-1 font-medium">Full Name / Primary Contact</label>
                    <div className="flex items-center gap-2 bg-[#3a4f5c] border border-white/20 rounded-xl px-3 py-2.5">
                      <User className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Babak Safari"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="bg-transparent text-white w-full focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-200 mb-1 font-medium">
                      {selectedPlan.id === 'freelancer' ? 'Freelance Studio / Brand Name' : 'Company / Entity Name'}
                    </label>
                    <div className="flex items-center gap-2 bg-[#3a4f5c] border border-white/20 rounded-xl px-3 py-2.5">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder={selectedPlan.id === 'freelancer' ? 'e.g. Easy Mondays Creative Studio' : 'e.g. Easy Mondays Inc.'}
                        value={companyOrStudio}
                        onChange={(e) => setCompanyOrStudio(e.target.value)}
                        className="bg-transparent text-white w-full focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-200 mb-1 font-medium">
                      {selectedPlan.id === 'freelancer' ? 'Skill / Service You Want to Barter' : 'Surplus Asset / Service Category'}
                    </label>
                    <div className="flex items-center gap-2 bg-[#3a4f5c] border border-white/20 rounded-xl px-3 py-2.5">
                      <Briefcase className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder={selectedPlan.id === 'freelancer' ? 'e.g. 4K Video Editing, Python Dev, Graphic Design' : 'e.g. Apparel Overstock, Office Space, Equipment'}
                        value={tradeOffer}
                        onChange={(e) => setTradeOffer(e.target.value)}
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

            {/* STEP 2: SETTLEMENT SELECTION */}
            {regStep === 2 && (
              <form onSubmit={handleCompleteRegister} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-amber-300 uppercase font-bold">STEP 2 OF 2 • PLAN CONFIRMATION</span>
                  <h3 className="text-xl font-extrabold text-white">Confirm {selectedPlan.name}</h3>
                  <p className="text-xs text-slate-300">Set up annual membership settlement method.</p>
                </div>

                {selectedPlan.annualPrice === 0 ? (
                  <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-400/40 text-xs text-emerald-200 space-y-1.5">
                    <p className="font-bold flex items-center gap-1.5 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      $0/Year Freelancer Plan Selected
                    </p>
                    <p className="text-[11px] opacity-90 leading-relaxed">
                      Zero upfront annual cost. A 5% trade execution fee applies only when you complete a trade.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div 
                      onClick={() => setPaymentOption('card')}
                      className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between ${paymentOption === 'card' ? 'bg-[#3a4f5c] border-amber-400' : 'bg-[#24343e] border-white/10'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="w-4 h-4 text-amber-400" />
                        <div>
                          <span className="font-bold block text-white">Corporate Credit Card</span>
                          <span className="text-[10px] text-slate-300">${selectedPlan.annualPrice.toLocaleString()}/yr annual billing</span>
                        </div>
                      </div>
                      <input type="radio" checked={paymentOption === 'card'} readOnly className="accent-amber-400" />
                    </div>

                    <div 
                      onClick={() => setPaymentOption('crypto')}
                      className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between ${paymentOption === 'crypto' ? 'bg-[#3a4f5c] border-amber-400' : 'bg-[#24343e] border-white/10'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Wallet className="w-4 h-4 text-amber-400" />
                        <div>
                          <span className="font-bold block text-white">Solana USDC Wallet Direct</span>
                          <span className="text-[10px] text-slate-300">Pay directly on Solana Devnet</span>
                        </div>
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
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirm & Provision Solana Keypair</span>}
                  </Button>
                </div>
              </form>
            )}

            {/* STEP 3: SUCCESS CONFIRMATION */}
            {regStep === 3 && (
              <div className="py-2 space-y-4 text-center">
                <div className="p-3 bg-emerald-900/60 rounded-full w-12 h-12 mx-auto flex items-center justify-center border border-emerald-400/40">
                  <CheckCircle2 className="w-6 h-6 text-emerald-300" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white">{selectedPlan.name} Plan Active!</h3>
                  <p className="text-xs text-slate-300">
                    Welcome <strong className="text-white">{fullName}</strong> ({companyOrStudio}). Your reciprocal trading permissions are now enabled.
                  </p>
                </div>

                <div className="bg-[#24343e] p-4 rounded-2xl border border-white/10 text-xs font-mono space-y-2 text-left">
                  <div className="flex justify-between"><span className="text-slate-400">Entity:</span> <span className="text-white font-bold">{companyOrStudio}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Trade Specialty:</span> <span className="text-amber-300">{tradeOffer}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Active Membership:</span> <span className="text-emerald-300 font-bold uppercase">{selectedPlan.name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Trade Execution Fee:</span> <span className="text-amber-300 font-bold">{selectedPlan.tradeFee}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Solana Vault Key:</span> <span className="text-slate-300 text-[10px]">{generatedPda}</span></div>
                </div>

                <Link href="/">
                  <Button
                    onClick={() => setSelectedPlan(null)}
                    className="w-full bg-white hover:bg-slate-100 text-[#334652] font-extrabold text-xs py-3.5 rounded-full shadow-md cursor-pointer mt-2"
                  >
                    Go to Live Trade Stage
                  </Button>
                </Link>
              </div>
            )}

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#24333b] py-6 px-6 text-xs text-slate-300 flex items-center justify-between">
        <div><strong>TradeIt B2B Network</strong> • Annual Reciprocal Memberships</div>
        <Link href="/" className="hover:text-white">Back to Dashboard</Link>
      </footer>

    </div>
  );
}