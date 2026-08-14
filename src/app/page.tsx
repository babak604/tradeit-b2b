'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase/client';
import { DEMO_PRESET_OFFERS } from '@/lib/demo/demoSeedData';
import { CircularLoopMatch } from '@/lib/matcher/circularTradeAgent';
import { Button } from '@/components/ui/button';
import { 
  Tornado, PlusCircle, ShieldCheck, 
  Send, X, ArrowLeftRight, FileText, Download, CheckCircle2, UserCheck, LogIn, Bot, Loader2, Sparkles,
  Coins, Search, Command, Activity, BadgeCheck, Check, ArrowRight, FileCheck, Layers, Lock, KeyRound, Receipt, Scale,
  Building2, Megaphone, FileSpreadsheet, Calculator, Briefcase, ExternalLink, Clock, Wallet
} from 'lucide-react';

// Dynamic Client Component Imports
const GlobalStageFeed = dynamic(() => import('@/components/GlobalStageFeed'), { ssr: false });
const PitchUpload = dynamic(() => import('@/components/PitchUpload'), { ssr: false });
const CircularLoopBanner = dynamic(() => import('@/components/CircularLoopBanner'), { ssr: false });
const AuthModal = dynamic(() => import('@/components/AuthModal'), { ssr: false });
const EscrowMilestoneTracker = dynamic(() => import('@/components/EscrowMilestoneTracker'), { ssr: false });
const DemoStoryController = dynamic(() => import('@/components/DemoStoryController'), { ssr: false });
const CompanyProfileDrawer = dynamic(() => import('@/components/CompanyProfileDrawer'), { ssr: false });
const HowItWorksSection = dynamic(() => import('@/components/HowItWorksSection'), { ssr: false });

export default function MasterDashboardPage() {
  const [mounted, setMounted] = useState(false);

  // Single-Page Modal & Drawer States
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedCompanyProfile, setSelectedCompanyProfile] = useState<string | null>(null);

  // Command Palette (Cmd + K) State
  const [isCmdKOpen, setIsCmdKOpen] = useState(false);
  const [cmdSearchQuery, setCmdSearchQuery] = useState('');

  // Transaction Stepper Modal & Network Health
  const [txStep, setTxStep] = useState<number | null>(null);
  const [networkPing, setNetworkPing] = useState<number>(312);
  const [showConfetti, setShowConfetti] = useState(false);

  // Auth & Agent States
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [agentThinking, setAgentThinking] = useState(false);

  // FREELANCER & SMB BARTER WALLET BALANCE
  const [smbTradeCredits, setSmbTradeCredits] = useState<number>(1850);

  // FREELANCER SOW MILESTONE BUILDER STATE
  const [sowMilestones, setSowMilestones] = useState([
    { id: 1, title: 'Scope Wireframes & Brand Strategy', percent: 30, completed: true },
    { id: 2, title: 'Deliver Initial Assets & First Draft', percent: 40, completed: false },
    { id: 3, title: 'Final Handover & Source File Release', percent: 30, completed: false },
  ]);

  // REVERSE RFQ / CORPORATE NEEDS BOARD STATE
  const [rfqNeeds, setRfqNeeds] = useState([
    {
      id: 'rfq-1',
      company: 'LogiTrans Quebec',
      title: '5,000 sq ft Commercial Warehouse Storage (Q4 2026)',
      category: 'Real Estate / Logistics',
      targetFmv: 15000,
      offeringTrade: 'Intermodal Freight & Fleet Hauling Capacity',
      urgency: 'HIGH',
      verifiedDuns: 'D-U-N-S #9921048'
    },
    {
      id: 'rfq-2',
      company: 'FinTech Nordics',
      title: 'Enterprise Cyber-Security & Penetration Testing Audit',
      category: 'IT Services',
      targetFmv: 22000,
      offeringTrade: 'SaaS API Integration & Backend Architecture',
      urgency: 'MEDIUM',
      verifiedDuns: 'D-U-N-S #8830192'
    },
    {
      id: 'rfq-3',
      company: 'Apex Hospitality Group',
      title: '500 Custom Branded Corporate Merchandise Gift Sets',
      category: 'Goods & Merchandise',
      targetFmv: 12500,
      offeringTrade: 'VIP Event Space & Hotel Catering Services',
      urgency: 'HIGH',
      verifiedDuns: 'D-U-N-S #7749102'
    }
  ]);

  // RWA TOKENIZATION STUDIO STATE
  const [rwaCategory, setRwaCategory] = useState<string>('Commercial Invoice');
  const [rwaValuation, setRwaValuation] = useState<number>(125000);
  const [rwaDocName, setRwaDocName] = useState<string>('INVOICE_8849_EASY_MONDAYS.pdf');
  const [fractionalShares, setFractionalShares] = useState<number>(100);
  const [enableToken2022Compliance, setEnableToken2022Compliance] = useState<boolean>(true);
  const [rwaMintStage, setRwaMintStage] = useState<'idle' | 'verifying_doc' | 'minting_spl' | 'complete'>('idle');
  const [tokenizedRwaOutput, setTokenizedRwaOutput] = useState<any>(null);

  // Active Deal Room State
  const [deal, setDeal] = useState({
    id: 'demo-deal-123',
    status: 'negotiating',
    signed_a: false,
    signed_b: false,
    offer_a: {
      title: 'Surplus Premium Apparel Stock & Merch',
      offering: '250 Units Premium Hoodies & Overstock Wear',
      looking_for: '4K Studio Video Production & Content Creation',
      value: 8500,
      company: 'Easy Mondays Apparel',
      verified: true,
      skills: ['Apparel Design', 'E-Commerce Supply', 'Logistics'],
      portfolioUrl: 'https://easymondays.com',
      duns: 'D-U-N-S #8849201'
    },
    offer_b: {
      title: 'Full 4K Video Production & Editing',
      offering: '50 Hours Studio 4K Multi-cam Production & Post-Editing',
      looking_for: 'Furnished Commercial Office or Co-working Space',
      value: 5000,
      company: 'Montreal Creative Studios',
      verified: true,
      skills: ['4K Camera Operations', 'DaVinci Color Grading', 'Motion Graphics'],
      portfolioUrl: 'https://vimeo.com',
      duns: 'D-U-N-S #9930214'
    }
  });

  const [messages, setMessages] = useState([
    { sender: 'Montreal Creative Studios', text: 'Hey! Our studio crew is open next week for filming. Can you prepare the apparel items?' },
    { sender: 'You', text: 'Sounds great! Scope milestones are added to the SOW engine.' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  // CALCULATE TRADE DELTA
  const offerAVal = deal?.offer_a?.value ?? 0;
  const offerBVal = deal?.offer_b?.value ?? 0;
  const tradeDelta = Math.abs(offerAVal - offerBVal);
  const deltaReceiver = offerAVal > offerBVal ? deal?.offer_a?.company : deal?.offer_b?.company;

  useEffect(() => {
    setMounted(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCmdKOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNetworkPing(290 + Math.floor(Math.random() * 40));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setCurrentUser(session.user.email);
    });
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !activeDealId) return;

    const channel = supabase.channel(`deal-room-${activeDealId}`, {
      config: { broadcast: { self: true } }
    });

    channel
      .on('broadcast', { event: 'chat-message' }, (payload) => {
        if (payload?.payload) {
          setMessages((prev) => [...prev, payload.payload]);
        }
      })
      .on('broadcast', { event: 'sign-contract' }, (payload) => {
        if (payload?.payload?.partyKey) {
          setDeal((prev) => ({ ...prev, [payload.payload.partyKey]: true }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mounted, activeDealId]);

  const executeRwaMinting = () => {
    setRwaMintStage('verifying_doc');
    setTokenizedRwaOutput(null);

    setTimeout(() => {
      setRwaMintStage('minting_spl');
      setTimeout(() => {
        const docHash = '0x' + Array.from({length: 16}, () => Math.floor(Math.random()*16).toString(16)).join('');
        const mintAddr = 'RWA_' + Math.random().toString(36).substring(2, 10).toUpperCase() + '_sol';
        
        setTokenizedRwaOutput({
          mintAddress: mintAddr,
          category: rwaCategory,
          valuation: rwaValuation,
          shares: fractionalShares,
          sharePrice: (rwaValuation / fractionalShares).toFixed(2),
          docName: rwaDocName,
          docHash: docHash,
          tokenStandard: enableToken2022Compliance ? 'Solana Token-2022 (Transfer Hook Enforced)' : 'Standard SPL Token',
          timestamp: new Date().toLocaleTimeString(),
        });
        setRwaMintStage('complete');
      }, 1200);
    }, 1200);
  };

  const triggerAiAgentNegotiation = async () => {
    setAgentThinking(true);
    try {
      const res = await fetch('/api/agent/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          myOfferSummary: deal?.offer_a?.offering ?? '',
          theirOfferSummary: deal?.offer_b?.offering ?? '',
          theirCompany: deal?.offer_b?.company ?? 'Counterparty',
          chatHistory: messages,
        }),
      });

      const data = await res.json();
      if (data?.decision) {
        const agentMsg = `🤖 [AI Agent]: ${data.decision.agentMessage}`;
        setMessages((prev) => [...prev, { sender: 'TradeIt Agent', text: agentMsg }]);

        if (data.decision.action === 'ACCEPT_DEAL') {
          setDeal((prev) => ({ ...prev, signed_a: true }));
          triggerTransactionLifecycle();
        }
      }
    } catch (err) {
      console.error('Agent trigger failed:', err);
    } finally {
      setAgentThinking(false);
    }
  };

  const triggerTransactionLifecycle = () => {
    setTxStep(1);
    setTimeout(() => {
      setTxStep(2);
      setTimeout(() => {
        setTxStep(3);
        setTimeout(() => {
          setTxStep(4);
          setShowConfetti(true);
          setTimeout(() => setTxStep(null), 3000);
        }, 1200);
      }, 1200);
    }, 1200);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msgPayload = { sender: currentUser || 'You', text: newMessage.trim() };
    setMessages((prev) => [...prev, msgPayload]);

    if (activeDealId) {
      const channel = supabase.channel(`deal-room-${activeDealId}`);
      await channel.send({
        type: 'broadcast',
        event: 'chat-message',
        payload: msgPayload,
      });
    }

    setNewMessage('');
  };

  const handleSignAgreement = async () => {
    setDeal((prev) => ({ ...prev, signed_a: true }));
    triggerTransactionLifecycle();

    if (activeDealId) {
      const channel = supabase.channel(`deal-room-${activeDealId}`);
      await channel.send({
        type: 'broadcast',
        event: 'sign-contract',
        payload: { partyKey: 'signed_a' },
      });
    }
  };

  const toggleSowMilestone = (id: number) => {
    setSowMilestones((prev) => prev.map((m) => m.id === id ? { ...m, completed: !m.completed } : m));
  };

  const handleBidOnRfqNeed = (rfq: typeof rfqNeeds[0]) => {
    setDeal({
      id: `rfq-deal-${rfq.id}`,
      status: 'negotiating',
      signed_a: false,
      signed_b: false,
      offer_a: {
        title: 'Freelancer / SMB Service Capacity Bid',
        offering: 'Professional Service Capacity / Hours',
        looking_for: rfq.title,
        value: rfq.targetFmv,
        company: 'Your Freelance Studio',
        verified: true,
        skills: ['Verified Freelancer', '5★ Rated', 'Instant Availability'],
        portfolioUrl: 'https://tradeit.tv',
        duns: 'D-U-N-S Verified'
      },
      offer_b: {
        title: rfq.title,
        offering: rfq.offeringTrade,
        looking_for: 'Freelancer Service Capacity Bid',
        value: rfq.targetFmv,
        company: rfq.company,
        verified: true,
        skills: ['Corporate Member', 'D&B Verified'],
        portfolioUrl: 'https://tradeit.tv',
        duns: rfq.verifiedDuns
      }
    });

    setMessages([
      { sender: rfq.company, text: `We posted a need for: ${rfq.title}. Can your studio handle this requirement via reciprocal trade?` },
      { sender: 'You', text: `Yes! Our freelance studio can fulfill this need. Milestones and scope are set up in the SOW builder.` }
    ]);

    setActiveDealId(`rfq-deal-${rfq.id}`);
  };

  const runDirectTwoWayDemo = () => {
    setDeal({
      id: 'demo-2way-swap',
      status: 'negotiating',
      signed_a: false,
      signed_b: false,
      offer_a: {
        title: DEMO_PRESET_OFFERS[0]?.title ?? 'Surplus Apparel',
        offering: DEMO_PRESET_OFFERS[0]?.offering_summary ?? '250 Hoodies',
        looking_for: DEMO_PRESET_OFFERS[0]?.looking_for_summary ?? '4K Video Production',
        value: DEMO_PRESET_OFFERS[0]?.estimated_value ?? 8500,
        company: DEMO_PRESET_OFFERS[0]?.company_name ?? 'Easy Mondays Apparel',
        verified: true,
        skills: ['Apparel Supply', 'Overstock Merchandise'],
        portfolioUrl: 'https://easymondays.com',
        duns: 'D-U-N-S #8849201'
      },
      offer_b: {
        title: DEMO_PRESET_OFFERS[1]?.title ?? '4K Video Production',
        offering: DEMO_PRESET_OFFERS[1]?.offering_summary ?? '50 Studio Hours',
        looking_for: DEMO_PRESET_OFFERS[1]?.looking_for_summary ?? 'Office Space',
        value: DEMO_PRESET_OFFERS[1]?.estimated_value ?? 5000,
        company: DEMO_PRESET_OFFERS[1]?.company_name ?? 'Montreal Creative Studios',
        verified: true,
        skills: ['4K Camera Operations', 'Editing', 'Motion Design'],
        portfolioUrl: 'https://vimeo.com',
        duns: 'D-U-N-S #9930214'
      }
    });
    setMessages([
      { sender: 'Easy Mondays Apparel', text: 'We have 250 units of premium hoodies ready. Can you handle 4K video reels for our fall line?' },
      { sender: 'Montreal Creative Studios', text: 'Our studio space and crew are open next week. Let’s execute the barter swap.' }
    ]);
    setActiveDealId('demo-2way-swap');
  };

  const runThreeWayLoopDemo = () => {
    setActiveDealId('demo-2way-swap');
  };

  const runAiNegotiatorDemo = () => {
    runDirectTwoWayDemo();
    setTimeout(() => {
      triggerAiAgentNegotiation();
    }, 300);
  };

  const handleExportQuickBooksCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Transaction_ID,Date,Party_A,Party_B,FMV_CAD,GST_HST_5,Net_Cash_Outlay,Status\n"
      + `${deal.id},2026-08-14,"${deal.offer_a.company}","${deal.offer_b.company}",${offerAVal},${(offerAVal * 0.05).toFixed(2)},0.00,SETTLED_MULTI_SIG_PDA`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TRADEIT_SMB_TAX_STATEMENT_${deal.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#4a6370] text-slate-100 flex flex-col font-sans transition-colors duration-300 selection:bg-[#384c57] selection:text-white relative">
      
      {/* CONFETTI OVERLAY */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
          <div className="text-center space-y-2 animate-bounce">
            <span className="text-6xl">✨</span>
            <div className="bg-emerald-600 text-white font-extrabold text-sm px-6 py-2 rounded-full shadow-2xl">
              2-of-2 Multi-Sig Contract Settled!
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="border-b border-white/10 bg-[#425965]/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-40 print:hidden">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-white/10 rounded-full border border-white/20 shadow-sm">
            <Tornado className="w-5 h-5 animate-spin" style={{ animationDuration: '10s' }} />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-wide flex items-center gap-2">
              TRADEIT <span className="text-xs font-mono px-2.5 py-0.5 bg-yellow-200/10 border border-yellow-200/30 text-yellow-200 rounded-full">SMB & FREELANCER NETWORK</span>
            </h1>
            <p className="text-[11px] opacity-80 font-mono hidden sm:block">tradeit.tv • Reciprocal Trade Platform</p>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[11px] font-mono">
            <Activity className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
            <span>Solana Devnet: <strong>{networkPing}ms</strong></span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* BARTER WALLET BADGE */}
          <div className="hidden md:flex items-center gap-2 bg-[#2d404b] border border-yellow-200/30 px-3.5 py-1.5 rounded-full text-xs font-mono">
            <Wallet className="w-3.5 h-3.5 text-yellow-200" />
            <span>Barter Wallet: <strong className="text-yellow-200">${smbTradeCredits.toLocaleString()} TC</strong></span>
          </div>

          <button
            onClick={() => setIsCmdKOpen(true)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-200" />
            <span className="hidden sm:inline">Search / Cmd</span>
            <kbd className="bg-black/20 text-[10px] px-1.5 py-0.5 rounded font-mono border border-white/20 text-yellow-200">⌘K</kbd>
          </button>

          <Link href="/pricing">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 border-white/20 text-xs rounded-full cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
              <span>Membership Plans</span>
            </Button>
          </Link>

          {currentUser ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/40 border border-emerald-400/30 rounded-full text-xs font-semibold text-emerald-200">
              <UserCheck className="w-3.5 h-3.5" />
              <span className="truncate max-w-[120px] sm:max-w-[180px]">{currentUser}</span>
            </div>
          ) : (
            <Button
              onClick={() => setIsAuthOpen(true)}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 border-white/20 text-xs rounded-full cursor-pointer flex items-center gap-1"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login / Verify</span>
            </Button>
          )}

          {activeDealId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveDealId(null)}
              className="bg-white/10 hover:bg-white/20 border-white/20 text-xs rounded-full cursor-pointer"
            >
              Close Deal Panel
            </Button>
          )}

          <Button
            onClick={() => setIsUploadOpen(true)}
            className="bg-white text-[#334652] hover:bg-slate-100 font-bold text-xs px-5 h-9 rounded-full shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <PlusCircle className="w-4 h-4 text-[#334652]" />
            <span>Post Skill or Need</span>
          </Button>
        </div>
      </header>

      {/* MAIN STAGE */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 space-y-8 relative print:hidden">
        
        {/* HERO CARD */}
        <section className="rounded-3xl border border-white/15 bg-[#3e5562]/80 p-6 sm:p-8 backdrop-blur-md shadow-lg space-y-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-200/10 border border-yellow-200/30 rounded-full text-xs font-medium text-yellow-200">
                <Briefcase className="w-3.5 h-3.5 text-yellow-200" />
                <span>Freelancer & SMB Network • Preserve Cash Flow via Service Barter</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
                Trade Skills, Services & Inventory Without Cash Outlay
              </h2>
              <p className="opacity-90 text-xs sm:text-sm leading-relaxed text-slate-200">
                Connect with verified local businesses and freelancers. Trade web design, video production, legal advice, or office space secured by Solana 2-of-2 milestone escrow.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/deals/DEAL-B2B-101">
                <Button className="bg-white text-[#334652] hover:bg-slate-100 font-bold text-xs px-6 py-3 rounded-full shadow-md">
                  Explore Live Deal Room ↗
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CORPORATE & SMB REVERSE RFQ BOARD */}
        <section className="rounded-3xl border border-white/15 bg-[#394f5c] p-6 sm:p-8 backdrop-blur-md shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-yellow-200/10 rounded-2xl border border-yellow-200/30">
                <Megaphone className="w-6 h-6 text-yellow-200" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  Active Client Shortages & Project RFQs
                  <span className="text-[10px] bg-yellow-200/20 text-yellow-200 px-2.5 py-0.5 rounded-full border border-yellow-200/30 font-mono">
                    FREELANCER OPPORTUNITIES
                  </span>
                </h3>
                <p className="text-xs text-slate-200/80">Businesses seeking freelance skills and SMB services in exchange for their goods or trade credits.</p>
              </div>
            </div>

            <Button
              onClick={() => setIsUploadOpen(true)}
              size="sm"
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-full cursor-pointer"
            >
              + Post Service Requirement
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rfqNeeds.map((rfq) => (
              <div key={rfq.id} className="bg-[#2d404b] border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-white/30 transition-all shadow-md">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-300 uppercase font-mono">{rfq.company}</span>
                    <span className="text-[9px] bg-yellow-200/10 text-yellow-200 border border-yellow-200/30 px-2 py-0.5 rounded-full font-mono">
                      Valuation: ${rfq.targetFmv.toLocaleString()} CAD
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-white line-clamp-2">{rfq.title}</h4>
                  <p className="text-xs text-slate-300 font-serif leading-snug">
                    <strong className="text-slate-200">Offering in Trade:</strong> {rfq.offeringTrade}
                  </p>
                </div>

                <button
                  onClick={() => handleBidOnRfqNeed(rfq)}
                  className="w-full bg-white hover:bg-slate-100 text-[#334652] font-bold text-xs py-2.5 rounded-full flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <span>Bid Service Capacity / Hours</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* DEMO CONTROLLER */}
        <DemoStoryController 
          onRunTwoWayDemo={runDirectTwoWayDemo}
          onRunThreeWayDemo={runThreeWayLoopDemo}
          onRunAiNegotiatorDemo={runAiNegotiatorDemo}
        />

        {/* B2B STAGE & DEAL ROOM GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className={`${activeDealId ? 'lg:col-span-6' : 'lg:col-span-12'} transition-all duration-300`}>
            <GlobalStageFeed onSelectDeal={(id) => setActiveDealId(id)} />
          </div>

          {activeDealId && (
            <div className="lg:col-span-6 bg-[#394f5c] border border-white/20 rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-2xl relative sticky top-24 h-[calc(100vh-120px)] overflow-y-auto hide-scrollbar animate-in slide-in-from-right duration-300">
              
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="w-5 h-5 text-slate-100" />
                    <h3 className="font-extrabold text-white text-sm">AUTONOMOUS DEAL ROOM & SOW</h3>
                  </div>
                  <p className="text-[11px] text-slate-200/80 font-mono mt-0.5">2-of-2 Multi-Sig Escrow Engine</p>
                </div>

                <button
                  onClick={triggerAiAgentNegotiation}
                  disabled={agentThinking}
                  className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  {agentThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5 text-yellow-200" />}
                  <span>{agentThinking ? 'AI Agent Negotiating...' : 'Trigger AI Negotiator'}</span>
                </button>
              </div>

              {/* SIDE-BY-SIDE OFFERS WITH FREELANCER SKILL BADGES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div 
                  onClick={() => setSelectedCompanyProfile(deal?.offer_a?.company ?? null)}
                  className="bg-[#2d404b] p-3.5 rounded-2xl border border-white/10 space-y-2 hover:border-white/30 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-emerald-300 uppercase">{deal?.offer_a?.company ?? 'Party A'} ↗</p>
                    <span className="text-[9px] bg-emerald-900/60 text-emerald-200 border border-emerald-400/30 px-1.5 py-0.5 rounded font-mono">
                      ✓ Verified
                    </span>
                  </div>
                  <p className="font-bold text-white line-clamp-1">{deal?.offer_a?.title ?? 'Offer A'}</p>
                  
                  {/* Skill Badges */}
                  <div className="flex flex-wrap gap-1">
                    {deal.offer_a.skills.map((skill, sIdx) => (
                      <span key={sIdx} className="text-[9px] bg-white/10 text-slate-200 px-2 py-0.5 rounded-full border border-white/10 font-mono">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <p className="text-slate-300 font-mono text-[10px]">${(deal?.offer_a?.value ?? 0).toLocaleString()} CAD Value</p>
                </div>

                <div 
                  onClick={() => setSelectedCompanyProfile(deal?.offer_b?.company ?? null)}
                  className="bg-[#2d404b] p-3.5 rounded-2xl border border-white/10 space-y-2 hover:border-white/30 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-sky-300 uppercase">{deal?.offer_b?.company ?? 'Party B'} ↗</p>
                    <span className="text-[9px] bg-emerald-900/60 text-emerald-200 border border-emerald-400/30 px-1.5 py-0.5 rounded font-mono">
                      ✓ Verified
                    </span>
                  </div>
                  <p className="font-bold text-white line-clamp-1">{deal?.offer_b?.title ?? 'Offer B'}</p>
                  
                  {/* Skill Badges */}
                  <div className="flex flex-wrap gap-1">
                    {deal.offer_b.skills.map((skill, sIdx) => (
                      <span key={sIdx} className="text-[9px] bg-white/10 text-slate-200 px-2 py-0.5 rounded-full border border-white/10 font-mono">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <p className="text-slate-300 font-mono text-[10px]">${(deal?.offer_b?.value ?? 0).toLocaleString()} CAD Value</p>
                </div>
              </div>

              {/* FREELANCER SOW MILESTONE BUILDER */}
              <div className="bg-[#273842] border border-white/15 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-yellow-200" />
                    <h4 className="font-bold text-white">Freelancer Scope-of-Work (SOW) Milestones</h4>
                  </div>
                  <span className="text-[10px] text-slate-300 font-mono">Incremental Escrow Release</span>
                </div>

                <div className="space-y-2">
                  {sowMilestones.map((milestone) => (
                    <div 
                      key={milestone.id}
                      onClick={() => toggleSowMilestone(milestone.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        milestone.completed 
                          ? 'bg-emerald-950/50 border-emerald-400/40 text-emerald-200' 
                          : 'bg-[#2d404b] border-white/10 text-slate-200 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={milestone.completed} 
                          onChange={() => {}} 
                          className="rounded accent-emerald-400"
                        />
                        <span className="font-medium text-[11px]">{milestone.title}</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold">{milestone.percent}% Release</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* REALTIME CHAT */}
              <div className="flex-1 bg-[#2d404b] border border-white/10 rounded-2xl p-4 flex flex-col justify-between min-h-[180px]">
                <div className="space-y-3 overflow-y-auto max-h-[140px] hide-scrollbar">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.sender === (currentUser || 'You') ? 'items-end' : 'items-start'}`}>
                      <span className="text-[9px] text-slate-300 mb-0.5">{msg.sender}</span>
                      <div className={`p-3 rounded-2xl text-xs max-w-[85%] ${
                        msg.sender.includes('Agent') 
                          ? 'bg-[#3e5562] border border-yellow-200/30 text-yellow-100'
                          : msg.sender === (currentUser || 'You')
                          ? 'bg-white text-[#334652] font-semibold rounded-br-none' 
                          : 'bg-[#3e5562] text-slate-100 border border-white/10 rounded-bl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                  <input 
                    type="text"
                    placeholder="Propose terms or trigger AI Negotiator..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 bg-[#3a4f5c] border border-white/20 rounded-full px-4 py-2 text-xs text-white placeholder:text-slate-300/60 focus:outline-none focus:border-white"
                  />
                  <Button type="submit" size="sm" className="bg-white hover:bg-slate-100 text-[#334652] font-bold rounded-full px-4 cursor-pointer">
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </form>
              </div>

              {/* SIGNING AREA */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                    <span>2-of-2 Multi-Sig Solana Escrow</span>
                  </div>

                  <Button
                    onClick={handleSignAgreement}
                    disabled={deal.signed_a}
                    className={`text-xs font-bold px-5 h-9 rounded-full cursor-pointer ${
                      deal.signed_a 
                        ? 'bg-emerald-700 text-white' 
                        : 'bg-white hover:bg-slate-100 text-[#334652] font-bold shadow-md'
                    }`}
                  >
                    {deal.signed_a ? 'Agreement Signed ✓' : 'Sign Trade Deal'}
                  </Button>
                </div>

                {deal.signed_a && (
                  <button
                    onClick={() => setShowContractModal(true)}
                    className="w-full bg-[#2d404b] hover:bg-[#344854] border border-emerald-400/40 text-emerald-200 font-bold text-xs py-2 rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View & Export Executed SOW & Tax Statement (PDF)</span>
                  </button>
                )}
              </div>

            </div>
          )}

        </div>

        {/* HOW IT WORKS */}
        <HowItWorksSection />

      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#425965] py-6 px-6 mt-12 text-xs opacity-90 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="font-bold">TradeIt SMB & Freelancers</span> • Reciprocal Trade Network
        </div>
        <div className="flex gap-6 font-medium">
          <Link href="/escrow" className="hover:opacity-100 transition-all">Escrow Terminal</Link>
          <Link href="/deals/DEAL-B2B-101" className="hover:opacity-100 transition-all">Deal Room</Link>
          <a href="https://explorer.solana.com/?cluster=devnet" target="_blank" rel="noreferrer" className="hover:opacity-100 transition-all">Solana Explorer ↗</a>
        </div>
      </footer>

      {/* COMMAND PALETTE */}
      {isCmdKOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
          <div className="bg-[#2d404b] border border-white/20 w-full max-w-xl rounded-2xl shadow-2xl p-4 space-y-4 text-slate-100">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Search className="w-4 h-4 text-slate-300" />
              <input
                type="text"
                autoFocus
                placeholder="Type a command or search skills..."
                value={cmdSearchQuery}
                onChange={(e) => setCmdSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none placeholder:text-slate-300/60"
              />
              <button onClick={() => setIsCmdKOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <p className="text-[10px] uppercase font-mono text-slate-300/60 px-2">Quick Navigation</p>
              <button
                onClick={() => { setActiveDealId('demo-deal-123'); setIsCmdKOpen(false); }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 flex items-center justify-between transition-all"
              >
                <span>🚀 Launch Autonomous Deal Room (DEAL-B2B-101)</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <Link
                href="/escrow"
                onClick={() => setIsCmdKOpen(false)}
                className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 flex items-center justify-between transition-all block"
              >
                <span>🔒 Open Solana Escrow Terminal</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-60" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TRANSACTION STEPPER MODAL */}
      {txStep !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#2d404b] border border-white/20 w-full max-w-md rounded-3xl p-6 space-y-6 text-center text-slate-100 shadow-2xl">
            <h3 className="font-bold text-base">Solana Devnet Transaction Pipeline</h3>
            <div className="space-y-3 text-xs font-mono text-left">
              <div className={`p-3 rounded-xl border flex items-center justify-between ${txStep >= 1 ? 'bg-emerald-950/60 border-emerald-400/40 text-emerald-200' : 'bg-white/5 border-white/10 opacity-40'}`}>
                <span>1. Wallet Signature Request</span>
                <span>{txStep > 1 ? '✓ Complete' : txStep === 1 ? '⏳ Signing...' : ''}</span>
              </div>
              <div className={`p-3 rounded-xl border flex items-center justify-between ${txStep >= 2 ? 'bg-emerald-950/60 border-emerald-400/40 text-emerald-200' : 'bg-white/5 border-white/10 opacity-40'}`}>
                <span>2. Broadcast to Solana Devnet</span>
                <span>{txStep > 2 ? '✓ Complete' : txStep === 2 ? '⚡ Broadcasting...' : ''}</span>
              </div>
              <div className={`p-3 rounded-xl border flex items-center justify-between ${txStep >= 3 ? 'bg-emerald-950/60 border-emerald-400/40 text-emerald-200' : 'bg-white/5 border-white/10 opacity-40'}`}>
                <span>3. 2-of-2 PDA Vault Creation</span>
                <span>{txStep > 3 ? '✓ Complete' : txStep === 3 ? '🔒 Locking...' : ''}</span>
              </div>
              <div className={`p-3 rounded-xl border flex items-center justify-between ${txStep >= 4 ? 'bg-emerald-950/60 border-emerald-400/40 text-emerald-200' : 'bg-white/5 border-white/10 opacity-40'}`}>
                <span>4. Supabase Audit Log & Webhook</span>
                <span>{txStep === 4 ? '✅ Dispatched' : ''}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Studio Modal */}
      <PitchUpload 
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => window.location.reload()}
      />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(email) => {
          setCurrentUser(email);
          setIsAuthOpen(false);
        }}
      />

      {/* Company Profile Drawer */}
      <CompanyProfileDrawer 
        companyName={selectedCompanyProfile}
        onClose={() => setSelectedCompanyProfile(null)}
      />

      {/* PRINTABLE CONTRACT VAULT MODAL WITH TAX STATEMENT */}
      {showContractModal && (
        <div className="fixed inset-0 z-50 bg-[#354854]/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 border border-slate-300 w-full max-w-2xl rounded-3xl p-8 space-y-6 relative shadow-2xl my-auto print:p-0 print:border-none print:shadow-none">
            
            <div className="flex items-center justify-between border-b pb-4 border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase">EXECUTED FREELANCER SOW & TAX RECEIPT</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleExportQuickBooksCsv}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-full flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Export Tax CSV
                </button>
                <button 
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-[#334652] hover:bg-[#283842] text-white font-bold text-xs rounded-full flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Print / Save PDF
                </button>
                <button 
                  onClick={() => setShowContractModal(false)}
                  className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contract Body */}
            <div className="space-y-4 text-xs font-serif leading-relaxed">
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <h2 className="text-lg font-black tracking-tight font-sans">TRADEIT FREELANCER SOW & TAX RECEIPT</h2>
                  <p className="text-[10px] text-slate-500 font-mono">Contract ID: {deal?.id} • Program ID: Es7dux19...ERi</p>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full font-sans">
                  VERIFIED ON SOLANA DEVNET
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 font-sans">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Party A (Freelancer / Studio)</p>
                  <p className="font-extrabold text-slate-900">{deal?.offer_a?.company}</p>
                  <p className="text-[11px] text-slate-600">{deal?.offer_a?.offering}</p>
                  <p className="text-[11px] font-mono text-emerald-700 font-bold mt-1">${deal?.offer_a?.value} CAD Valuation</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Party B (Client / SMB)</p>
                  <p className="font-extrabold text-slate-900">{deal?.offer_b?.company}</p>
                  <p className="text-[11px] text-slate-600">{deal?.offer_b?.offering}</p>
                  <p className="text-[11px] font-mono text-emerald-700 font-bold mt-1">${deal?.offer_b?.value} CAD Valuation</p>
                </div>
              </div>

              {/* TAX STATEMENT SUMMARY */}
              <div className="bg-slate-100 p-4 rounded-2xl border border-slate-300 font-sans space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-slate-700" />
                  <span>Sole Proprietor & SMB Non-Cash Tax Record</span>
                </h4>
                <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-700 font-mono">
                  <div>
                    <p>Gross Barter Revenue: <strong>${offerAVal.toLocaleString()} CAD</strong></p>
                    <p>GST/HST Collected (5%): <strong>${(offerAVal * 0.05).toFixed(2)} CAD</strong></p>
                  </div>
                  <div>
                    <p>Tax Filing Category: <strong>Non-Cash Business Income (T2125/Sch C)</strong></p>
                    <p>Net Cash Exchanged: <strong>$0.00 CAD</strong></p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-sans font-bold text-slate-900 text-xs">Terms of Reciprocal Exchange</h4>
                <p>
                  Both participating entities hereby agree to exchange the designated B2B services/goods outlined above with zero cash consideration, maintaining equal parity under the TradeIt AI network charter and secured via a 2-of-2 multi-party Solana Anchor escrow account.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-8 font-sans">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Signed for Party A</p>
                  <p className="font-mono text-xs text-emerald-600 font-bold mt-1">Verified Signature ✓</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Signed for Party B</p>
                  <p className="font-mono text-xs text-emerald-600 font-bold mt-1">Verified Signature ✓</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}