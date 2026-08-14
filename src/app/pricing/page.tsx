'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { 
  Check, ShieldCheck, X, CheckCircle2, Sparkles, CreditCard, 
  Wallet, ArrowRight, Loader2, BadgeCheck, HelpCircle, Building2, 
  User, Lock, Mail, Briefcase, Code, Terminal, Globe
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  annualPrice: number;
  monthlyEquivalent: number;
  description: string;
  targetUser: string;
  features: string[];
  ctaText: string;
  badge?: string;
  highlighted: boolean;
}

export default function PricingPage() {
  const [activePlanId, setActivePlanId] = useState<string>('freelancer');

  // Registration & Activation Modal State
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyOrStudio, setCompanyOrStudio] = useState('');
  const [skillOrCategory, setSkillOrCategory] = useState('');
  const [password, setPassword] = useState('');
  const [paymentOption, setPaymentOption] = useState<'free' | 'card' | 'crypto'>('free');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const plans: Plan[] = [
    {
      id: 'freelancer',
      name: 'Freelancer & Solo',
      annualPrice: 0,
      monthlyEquivalent: 0,
      description: 'Built for independent developers, designers, video creators, and solo consultants.',
      targetUser: 'Freelancers & Studios',
      features: [
        'Trade Skill Hours & Portfolio Services',
        '3 Active Reciprocal Listings',
        'Direct 2-Way Reciprocal Swaps',
        'Standard AI Trade Matcher Access',
        'CRA T2125 / IRS Barter Tax Export',
        'Solana Devnet Wallet Setup'
      ],
      ctaText: 'Activate Freelancer Membership',
      highlighted: false
    },
    {
      id: 'pro',
      name: 'Pro B2B',
      annualPrice: 1188,
      monthlyEquivalent: 99,
      description: 'For growing SMBs and agencies converting surplus inventory and team capacity into purchasing power.',
      targetUser: 'Growing SMBs & Agencies',
      features: [
        'Unlimited Active Trade Offers',
        'Autonomous 3-Way & 4-Way Circular Loops',
        '2-of-2 Solana Multi-Sig Escrow Vaults',
        'Priority Autonomous AI Negotiator Agent',
        'D-U-N-S Verified Entity Badge',
        'Full Audit Ledger Export'
      ],
      badge: 'MOST POPULAR FOR SMBS',
      ctaText: 'Start Pro B2B Membership',
      highlighted: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise Network',
      annualPrice: 4788,
      monthlyEquivalent: 399,
      description: 'For corporate procurement, manufacturing overstock, and institutional RWA asset tokenization.',
      targetUser: 'Corporations & RWAs',
      features: [
        'All Pro B2B Features Included',
        'Full RWA Tokenization Studio (Token-2022)',
        'Multi-Seat Team Approvals & Roles',
        'Custom ERP & QuickBooks API Connectors',
        'Dedicated Account Manager',
        '0% Protocol Swap Fees'
      ],
      ctaText: 'Activate Enterprise Network',
      highlighted: false
    }
  ];

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setRegStep(1);
    setPaymentOption(plan.annualPrice === 0 ? 'free' : 'card');
  };

  const handleCompleteRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !companyOrStudio) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setRegStep(3);
      if (selectedPlan) {
        setActivePlanId(selectedPlan.id);
      }
    }, 1400);
  };

  const faqs = [
    {
      q: 'Are all memberships billed annually?',
      a: 'Yes. All TradeIt B2B plans are annual memberships to ensure stable network liquidity, multi-sig vault security, and seamless CRA/IRS barter tax reporting throughout the fiscal year.'
    },
    {
      q: 'How does the Freelancer tier work?',
      a: 'Freelancers can list their billable service hours (e.g., Web Development, 4K Video Editing, Design) in exchange for physical surplus or services from other businesses without spending cash.'
    },
    {
      q: 'How does 2-of-2 Multi-Sig Escrow protect my trades?',
      a: 'Every deal creates a dedicated vault on the Solana blockchain. Deliverables or assets are held safely until both parties sign off on fulfillment.'
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
            <span>ANNUAL B2B MEMBERSHIPS ONLY</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Reciprocal Trade Memberships
          </h1>

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
            Turn unbilled hours, service capacity, and surplus inventory into direct purchasing power. Guaranteed annual network liquidity.
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
                    <span className="text-[10px] font-mono text-amber-300 uppercase tracking-wider font-bold">{plan.targetUser}</span>
                    <h3 className="text-xl font-extrabold text-white mt-0.5">{plan.name}</h3>
                    <p className="text-xs text-slate-300 mt-1 min-h-[32px]">{plan.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1.5 border-b border-white/10 pb-4">
                    {plan.annualPrice === 0 ? (
                      <span className="text-4xl font-black text-white">$0 <span className="text-xs text-slate-300 font-mono font-normal">/ year</span></span>
                    ) : (
                      <div>
                        <span className="text-4xl font-black text-white">${plan.annualPrice.toLocaleString()}</span>
                        <span className="text-xs text-slate-300 font-mono font-normal"> / year</span>
                        <p className="text-[11px] text-amber-300 font-mono mt-0.5">(${plan.monthlyEquivalent}/mo billed annually)</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-200 pt-2">
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

        {/* FAQ SECTION */}
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

      {/* REGISTRATION & ACTIVATION MODAL */}
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
                  <span className="text-[10px] font-mono text-amber-300 uppercase font-bold">STEP 1 OF 2 • PROFILE REGISTRATION</span>
                  <h3 className="text-xl font-extrabold text-white">{selectedPlan.name} Signup</h3>
                  <p className="text-xs text-slate-300">Set up your trade entity details to begin reciprocal trading.</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-200 mb-1 font-medium">Full Name / Contact Person</label>
                    <div className="flex items-center gap-2 bg-[#3a4f5c] border border-white/20 rounded-xl px-3 py-2.5">
                      <User className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Alex Rivera"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="bg-transparent text-white w-full focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-200 mb-1 font-medium">
                      {selectedPlan.id === 'freelancer' ? 'Studio / Freelance Brand Name' : 'Company / Entity Name'}
                    </label>
                    <div className="flex items-center gap-2 bg-[#3a4f5c] border border-white/20 rounded-xl px-3 py-2.5">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder={selectedPlan.id === 'freelancer' ? 'e.g. Rivera Creative Studio' : 'e.g. Easy Mondays Apparel'}
                        value={companyOrStudio}
                        onChange={(e) => setCompanyOrStudio(e.target.value)}
                        className="bg-transparent text-white w-full focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-200 mb-1 font-medium">
                      {selectedPlan.id === 'freelancer' ? 'Primary Skill / Trade Offer' : 'Primary Business Category'}
                    </label>
                    <div className="flex items-center gap-2 bg-[#3a4f5c] border border-white/20 rounded-xl px-3 py-2.5">
                      <Briefcase className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder={selectedPlan.id === 'freelancer' ? 'e.g. 4K Video Editing / Fullstack Dev' : 'e.g. Apparel Surplus / Office Space'}
                        value={skillOrCategory}
                        onChange={(e) => setSkillOrCategory(e.target.value)}
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

            {regStep === 2 && (
              <form onSubmit={handleCompleteRegister} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-amber-300 uppercase font-bold">STEP 2 OF 2 • ANNUAL ACTIVATION</span>
                  <h3 className="text-xl font-extrabold text-white">Confirm Plan Activation</h3>
                  <p className="text-xs text-slate-300">Set up settlement for {selectedPlan.name}.</p>
                </div>

                {selectedPlan.annualPrice === 0 ? (
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-400/30 text-xs text-emerald-200 space-y-1">
                    <p className="font-bold">✓ Free Freelancer Plan Selected</p>
                    <p className="text-[11px] opacity-80">Instant access to post skill hours and initiate direct 2-way swaps.</p>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div 
                      onClick={() => setPaymentOption('card')}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between ${paymentOption === 'card' ? 'bg-[#3a4f5c] border-amber-400' : 'bg-[#24343e] border-white/10'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="w-4 h-4 text-amber-400" />
                        <span>Corporate Card (${selectedPlan.annualPrice}/yr)</span>
                      </div>
                      <input type="radio" checked={paymentOption === 'card'} readOnly className="accent-amber-400" />
                    </div>

                    <div 
                      onClick={() => setPaymentOption('crypto')}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between ${paymentOption === 'crypto' ? 'bg-[#3a4f5c] border-amber-400' : 'bg-[#24343e] border-white/10'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Wallet className="w-4 h-4 text-amber-400" />
                        <span>Solana Devnet Wallet USDC</span>
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
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Activate Annual Membership</span>}
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
                  <h3 className="text-xl font-black text-white">{selectedPlan.name} Activated!</h3>
                  <p className="text-xs text-slate-300">
                    Welcome <strong className="text-white">{fullName}</strong> ({companyOrStudio}). Your trade account is officially live.
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
        <div><strong>TradeIt B2B Network</strong> • Annual Reciprocal Memberships</div>
        <Link href="/" className="hover:text-white">Back to Dashboard</Link>
      </footer>

    </div>
  );
}