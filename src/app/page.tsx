'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase/client';
import { DEMO_PRESET_OFFERS } from '@/lib/demo/demoSeedData';
import { CircularLoopMatch } from '@/lib/matcher/circularTradeAgent';
import { Button } from '@/components/ui/button';
import { 
  Tornado, ShieldCheck, 
  Send, X, ArrowLeftRight, FileText, Download, UserCheck, LogIn, Bot, Loader2, Sparkles,
  Coins, Search, ArrowRight, Receipt, Scale,
  Megaphone, FileSpreadsheet, Calculator, Briefcase, ExternalLink, Clock, Wallet, Plus
} from 'lucide-react';

// Dynamic Client Component Imports
const GlobalStageFeed = dynamic(() => import('@/components/GlobalStageFeed'), { ssr: false });
const PitchUpload = dynamic(() => import('@/components/PitchUpload'), { ssr: false });
const CircularLoopBanner = dynamic(() => import('@/components/CircularLoopBanner'), { ssr: false });
const AuthModal = dynamic(() => import('@/components/AuthModal'), { ssr: false });
const EscrowMilestoneTracker = dynamic(() => import('@/components/EscrowMilestoneTracker'), { ssr: false });
const DemoStoryController = dynamic(() => import('@/components/DemoStoryController'), { ssr: false });
const CompanyProfileDrawer = dynamic(() => import('@/components/CompanyProfileDrawer'), { ssr: false });

export default function MasterDashboardPage() {
  const [mounted, setMounted] = useState(false);

  // Modal & Drawer States
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedCompanyProfile, setSelectedCompanyProfile] = useState<string | null>(null);

  // Command Palette & Stepper State
  const [isCmdKOpen, setIsCmdKOpen] = useState(false);
  const [cmdSearchQuery, setCmdSearchQuery] = useState('');
  const [txStep, setTxStep] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Auth & Balance States
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [agentThinking, setAgentThinking] = useState(false);
  const [smbTradeCredits] = useState<number>(1850);

  // SOW Milestones State
  const [sowMilestones, setSowMilestones] = useState([
    { id: 1, title: 'Scope & Brand Strategy', percent: 30, completed: true },
    { id: 2, title: 'Initial Assets & V1 Draft', percent: 40, completed: false },
    { id: 3, title: 'Final Handover & Source Files', percent: 30, completed: false },
  ]);

  // Reverse RFQ Needs State
  const [rfqNeeds] = useState([
    {
      id: 'rfq-1',
      company: 'LogiTrans Quebec',
      title: '5,000 sq ft Commercial Warehouse Storage',
      category: 'Logistics',
      targetFmv: 15000,
      offeringTrade: 'Intermodal Freight Capacity',
      verifiedDuns: 'D-U-N-S #9921048'
    },
    {
      id: 'rfq-2',
      company: 'FinTech Nordics',
      title: 'Cyber-Security & Penetration Audit',
      category: 'IT Services',
      targetFmv: 22000,
      offeringTrade: 'SaaS API Integration',
      verifiedDuns: 'D-U-N-S #8830192'
    },
    {
      id: 'rfq-3',
      company: 'Apex Hospitality',
      title: '500 Branded Merchandise Sets',
      category: 'Merchandise',
      targetFmv: 12500,
      offeringTrade: 'VIP Event & Catering Space',
      verifiedDuns: 'D-U-N-S #7749102'
    }
  ]);

  // Active Deal Room State
  const [deal, setDeal] = useState({
    id: 'demo-deal-123',
    status: 'negotiating',
    signed_a: false,
    signed_b: false,
    offer_a: {
      title: 'Surplus Premium Apparel Stock',
      offering: '250 Units Hoodies & Overstock Wear',
      looking_for: '4K Studio Video Production',
      value: 8500,
      company: 'Easy Mondays Apparel',
      verified: true,
      skills: ['Apparel Supply', 'Logistics'],
      portfolioUrl: 'https://easymondays.com',
      duns: 'D-U-N-S #8849201'
    },
    offer_b: {
      title: 'Full 4K Video Production & Editing',
      offering: '50 Hours Studio 4K Production',
      looking_for: 'Furnished Commercial Space',
      value: 5000,
      company: 'Montreal Creative Studios',
      verified: true,
      skills: ['4K Camera Operations', 'Editing'],
      portfolioUrl: 'https://vimeo.com',
      duns: 'D-U-N-S #9930214'
    }
  });

  const [messages, setMessages] = useState([
    { sender: 'Montreal Creative Studios', text: 'Hey! Our studio crew is open next week for filming.' },
    { sender: 'You', text: 'Sounds great! SOW milestones are configured.' }
  ]);
  const [newMessage, setNewMessage] = useState('');

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
    if (!mounted) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setCurrentUser(session.user.email);
    });
  }, [mounted]);

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
        setMessages((prev) => [...prev, { sender: 'TradeIt Agent', text: `🤖 [AI Agent]: ${data.decision.agentMessage}` }]);
        if (data.decision.action === 'ACCEPT_DEAL') {
          setDeal((prev) => ({ ...prev, signed_a: true }));
          triggerTransactionLifecycle();
        }
      }
    } catch (err) {
      console.error(err);
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
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setMessages((prev) => [...prev, { sender: currentUser || 'You', text: newMessage.trim() }]);
    setNewMessage('');
  };

  const handleSignAgreement = () => {
    setDeal((prev) => ({ ...prev, signed_a: true }));
    triggerTransactionLifecycle();
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
        title: 'Service Capacity Bid',
        offering: 'Professional Service Capacity',
        looking_for: rfq.title,
        value: rfq.targetFmv,
        company: 'Your Studio',
        verified: true,
        skills: ['Verified Partner'],
        portfolioUrl: 'https://tradeit.tv',
        duns: 'D-U-N-S Verified'
      },
      offer_b: {
        title: rfq.title,
        offering: rfq.offeringTrade,
        looking_for: 'Service Capacity Bid',
        value: rfq.targetFmv,
        company: rfq.company,
        verified: true,
        skills: ['Corporate Member'],
        portfolioUrl: 'https://tradeit.tv',
        duns: rfq.verifiedDuns
      }
    });

    setMessages([
      { sender: rfq.company, text: `Need: ${rfq.title}. Can your studio handle this via barter?` },
      { sender: 'You', text: `Yes! Our studio can fulfill this requirement.` }
    ]);

    setActiveDealId(`rfq-deal-${rfq.id}`);
  };

  const handleExportQuickBooksCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Transaction_ID,Date,Party_A,Party_B,FMV_CAD,GST_HST_5,Net_Cash_Outlay,Status\n"
      + `${deal.id},2026-08-14,"${deal.offer_a.company}","${deal.offer_b.company}",${offerAVal},${(offerAVal * 0.05).toFixed(2)},0.00,SETTLED_MULTI_SIG_PDA`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TRADEIT_TAX_STATEMENT_${deal.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#4a6370] text-slate-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* CONFETTI OVERLAY */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="bg-emerald-600 text-white font-extrabold text-sm px-6 py-2.5 rounded-full shadow-2xl animate-bounce">
            ✨ 2-of-2 Escrow Multi-Sig Settled!
          </div>
        </div>
      )}

      {/* STREAMLINED CLEAN HEADER */}
      <header className="border-b border-white/10 bg-[#425965]/95 backdrop-blur-md px-6 py-3 flex items-center justify-between sticky top-0 z-40 print:hidden">
        
        {/* BRAND LOGO */}
        <div className="flex items-center space-x-3">
          <div className="p-1.5 bg-white/10 rounded-xl border border-white/20 shadow-sm">
            <Tornado className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-wider text-white">TRADEIT</span>
        </div>

        {/* COMPACT ACTIONS */}
        <div className="flex items-center space-x-3">
          
          {/* SEARCH BUTTON */}
          <button
            onClick={() => setIsCmdKOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-200" />
            <span>Search</span>
            <kbd className="bg-black/20 text-[10px] px-1.5 py-0.5 rounded font-mono border border-white/20 text-yellow-200">⌘K</kbd>
          </button>

          {/* BARTER BALANCE BADGE */}
          <div className="flex items-center gap-1.5 bg-[#2d404b] border border-yellow-200/30 px-3 py-1.5 rounded-full text-xs font-mono">
            <Wallet className="w-3.5 h-3.5 text-yellow-200" />
            <span className="text-yellow-200 font-bold">${smbTradeCredits.toLocaleString()} TC</span>
          </div>

          {/* AUTH USER */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/40 border border-emerald-400/30 rounded-full text-xs font-medium text-emerald-200">
              <UserCheck className="w-3.5 h-3.5" />
              <span className="truncate max-w-[120px]">{currentUser}</span>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-xs rounded-full font-medium cursor-pointer transition-all flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}

          {/* PRIMARY POST BUTTON */}
          <Button
            onClick={() => setIsUploadOpen(true)}
            className="bg-white text-[#334652] hover:bg-slate-100 font-extrabold text-xs px-4 h-8 rounded-full shadow-md flex items-center gap-1 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 text-[#334652]" />
            <span>Post Offer</span>
          </Button>

        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-6 space-y-6 print:hidden">
        
        {/* REVERSE RFQ BOARD */}
        <section className="bg-[#394f5c] border border-white/15 rounded-2xl p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-yellow-200" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Client Requirements (RFQs)</h3>
            </div>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="text-xs text-yellow-200 hover:underline font-medium"
            >
              + Post Requirement
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {rfqNeeds.map((rfq) => (
              <div key={rfq.id} className="bg-[#2d404b] border border-white/10 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-white/25 transition-all">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-emerald-300 font-bold">{rfq.company}</span>
                    <span className="text-yellow-200">${rfq.targetFmv.toLocaleString()} CAD</span>
                  </div>
                  <h4 className="font-bold text-xs text-white line-clamp-1">{rfq.title}</h4>
                  <p className="text-[11px] text-slate-300">
                    <strong>Offers:</strong> {rfq.offeringTrade}
                  </p>
                </div>

                <button
                  onClick={() => handleBidOnRfqNeed(rfq)}
                  className="w-full bg-white hover:bg-slate-100 text-[#334652] font-bold text-xs py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
                >
                  <span>Bid Capacity</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* DEMO CONTROLLER */}
        <DemoStoryController 
          onRunTwoWayDemo={() => {
            setActiveDealId('demo-deal-123');
          }}
          onRunThreeWayDemo={() => {
            setActiveDealId('demo-deal-123');
          }}
          onRunAiNegotiatorDemo={() => {
            setActiveDealId('demo-deal-123');
            setTimeout(triggerAiAgentNegotiation, 300);
          }}
        />

        {/* STAGE FEED & DEAL ROOM GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className={`${activeDealId ? 'lg:col-span-6' : 'lg:col-span-12'} transition-all duration-300`}>
            <GlobalStageFeed onSelectDeal={(id) => setActiveDealId(id)} />
          </div>

          {activeDealId && (
            <div className="lg:col-span-6 bg-[#394f5c] border border-white/20 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl sticky top-20 h-[calc(100vh-100px)] overflow-y-auto hide-scrollbar">
              
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-slate-100" />
                  <h3 className="font-extrabold text-white text-xs uppercase tracking-wider">Autonomous Deal Room</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={triggerAiAgentNegotiation}
                    disabled={agentThinking}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                  >
                    {agentThinking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3 text-yellow-200" />}
                    <span>AI Negotiator</span>
                  </button>

                  <button 
                    onClick={() => setActiveDealId(null)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* OFFERS SIDE BY SIDE */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div 
                  onClick={() => setSelectedCompanyProfile(deal?.offer_a?.company ?? null)}
                  className="bg-[#2d404b] p-3 rounded-xl border border-white/10 space-y-1 cursor-pointer hover:border-white/30"
                >
                  <span className="text-[9px] text-emerald-300 font-bold uppercase">{deal?.offer_a?.company}</span>
                  <p className="font-bold text-white line-clamp-1">{deal?.offer_a?.title}</p>
                  <p className="text-slate-300 font-mono text-[10px]">${deal?.offer_a?.value} CAD</p>
                </div>

                <div 
                  onClick={() => setSelectedCompanyProfile(deal?.offer_b?.company ?? null)}
                  className="bg-[#2d404b] p-3 rounded-xl border border-white/10 space-y-1 cursor-pointer hover:border-white/30"
                >
                  <span className="text-[9px] text-sky-300 font-bold uppercase">{deal?.offer_b?.company}</span>
                  <p className="font-bold text-white line-clamp-1">{deal?.offer_b?.title}</p>
                  <p className="text-slate-300 font-mono text-[10px]">${deal?.offer_b?.value} CAD</p>
                </div>
              </div>

              {/* SOW MILESTONES */}
              <div className="bg-[#273842] border border-white/10 rounded-xl p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <span className="font-bold text-white text-[11px] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-yellow-200" /> SOW Milestones
                  </span>
                  <span className="text-[9px] text-slate-300 font-mono">2-of-2 Escrow</span>
                </div>

                <div className="space-y-1.5">
                  {sowMilestones.map((m) => (
                    <div 
                      key={m.id}
                      onClick={() => toggleSowMilestone(m.id)}
                      className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer text-[11px] ${
                        m.completed ? 'bg-emerald-950/50 border-emerald-400/40 text-emerald-200' : 'bg-[#2d404b] border-white/10 text-slate-200'
                      }`}
                    >
                      <span className="font-medium">{m.title}</span>
                      <span className="font-mono text-[10px] font-bold">{m.percent}% Release</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CHAT */}
              <div className="flex-1 bg-[#2d404b] border border-white/10 rounded-xl p-3 flex flex-col justify-between min-h-[160px]">
                <div className="space-y-2 overflow-y-auto max-h-[120px] hide-scrollbar text-xs">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.sender === (currentUser || 'You') ? 'items-end' : 'items-start'}`}>
                      <span className="text-[9px] text-slate-300 mb-0.5">{msg.sender}</span>
                      <div className={`p-2.5 rounded-xl text-xs max-w-[85%] ${
                        msg.sender.includes('Agent') 
                          ? 'bg-[#3e5562] border border-yellow-200/30 text-yellow-100'
                          : msg.sender === (currentUser || 'You')
                          ? 'bg-white text-[#334652] font-semibold' 
                          : 'bg-[#3e5562] text-slate-100 border border-white/10'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2 mt-2 pt-2 border-t border-white/10">
                  <input 
                    type="text"
                    placeholder="Type message or terms..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 bg-[#3a4f5c] border border-white/20 rounded-full px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                  <Button type="submit" size="sm" className="bg-white text-[#334652] font-bold rounded-full px-3 cursor-pointer">
                    <Send className="w-3 h-3" />
                  </Button>
                </form>
              </div>

              {/* SIGNING AREA */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                    <span>Solana PDA Escrow</span>
                  </div>

                  <Button
                    onClick={handleSignAgreement}
                    disabled={deal.signed_a}
                    className={`text-xs font-bold px-4 h-8 rounded-full cursor-pointer ${
                      deal.signed_a 
                        ? 'bg-emerald-700 text-white' 
                        : 'bg-white hover:bg-slate-100 text-[#334652] font-bold shadow-md'
                    }`}
                  >
                    {deal.signed_a ? 'Signed ✓' : 'Sign Agreement'}
                  </Button>
                </div>

                {deal.signed_a && (
                  <button
                    onClick={() => setShowContractModal(true)}
                    className="w-full bg-[#2d404b] hover:bg-[#344854] border border-emerald-400/40 text-emerald-200 font-bold text-xs py-1.5 rounded-full flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Export B2B Contract & Tax Statement</span>
                  </button>
                )}
              </div>

            </div>
          )}

        </div>

      </main>

      {/* COMMAND PALETTE */}
      {isCmdKOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
          <div className="bg-[#2d404b] border border-white/20 w-full max-w-xl rounded-2xl shadow-2xl p-4 space-y-3 text-slate-100">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Search className="w-4 h-4 text-slate-300" />
              <input
                type="text"
                autoFocus
                placeholder="Search offers or type command..."
                value={cmdSearchQuery}
                onChange={(e) => setCmdSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none placeholder:text-slate-300/60"
              />
              <button onClick={() => setIsCmdKOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <button
                onClick={() => { setActiveDealId('demo-deal-123'); setIsCmdKOpen(false); }}
                className="w-full text-left p-2 rounded-xl hover:bg-white/10 flex items-center justify-between transition-all"
              >
                <span>🚀 Open Autonomous Deal Room</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <Link
                href="/escrow"
                onClick={() => setIsCmdKOpen(false)}
                className="w-full text-left p-2 rounded-xl hover:bg-white/10 flex items-center justify-between transition-all block"
              >
                <span>🔒 Solana Escrow Terminal</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-60" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TRANSACTION STEPPER MODAL */}
      {txStep !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#2d404b] border border-white/20 w-full max-w-md rounded-2xl p-6 space-y-4 text-center text-slate-100 shadow-2xl">
            <h3 className="font-bold text-sm">Solana Devnet Transaction Pipeline</h3>
            <div className="space-y-2 text-xs font-mono text-left">
              <div className={`p-2.5 rounded-lg border flex items-center justify-between ${txStep >= 1 ? 'bg-emerald-950/60 border-emerald-400/40 text-emerald-200' : 'bg-white/5 border-white/10 opacity-40'}`}>
                <span>1. Wallet Signature Request</span>
                <span>{txStep > 1 ? '✓ Complete' : '⏳'}</span>
              </div>
              <div className={`p-2.5 rounded-lg border flex items-center justify-between ${txStep >= 2 ? 'bg-emerald-950/60 border-emerald-400/40 text-emerald-200' : 'bg-white/5 border-white/10 opacity-40'}`}>
                <span>2. Broadcast to Devnet</span>
                <span>{txStep > 2 ? '✓ Complete' : '⚡'}</span>
              </div>
              <div className={`p-2.5 rounded-lg border flex items-center justify-between ${txStep >= 3 ? 'bg-emerald-950/60 border-emerald-400/40 text-emerald-200' : 'bg-white/5 border-white/10 opacity-40'}`}>
                <span>3. 2-of-2 PDA Vault Creation</span>
                <span>{txStep > 3 ? '✓ Complete' : '🔒'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <PitchUpload 
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => window.location.reload()}
      />

      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(email) => {
          setCurrentUser(email);
          setIsAuthOpen(false);
        }}
      />

      <CompanyProfileDrawer 
        companyName={selectedCompanyProfile}
        onClose={() => setSelectedCompanyProfile(null)}
      />

      {/* CONTRACT & TAX MODAL */}
      {showContractModal && (
        <div className="fixed inset-0 z-50 bg-[#354854]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 border border-slate-300 w-full max-w-2xl rounded-2xl p-6 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase">EXECUTED CONTRACT & TAX RECEIPT</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleExportQuickBooksCsv}
                  className="px-3 py-1 bg-emerald-700 text-white font-bold text-xs rounded-full cursor-pointer"
                >
                  Export CSV
                </button>
                <button 
                  onClick={() => setShowContractModal(false)}
                  className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 text-xs font-serif leading-relaxed">
              <div className="flex justify-between items-start border-b pb-2">
                <div>
                  <h2 className="text-base font-black font-sans">TRADEIT B2B BARTER INVOICE</h2>
                  <p className="text-[10px] text-slate-500 font-mono">Contract ID: {deal?.id}</p>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full font-sans">
                  VERIFIED ON SOLANA
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 font-sans">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Party A</p>
                  <p className="font-extrabold text-slate-900">{deal?.offer_a?.company}</p>
                  <p className="text-[11px] font-mono text-emerald-700 font-bold">${deal?.offer_a?.value} CAD</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Party B</p>
                  <p className="font-extrabold text-slate-900">{deal?.offer_b?.company}</p>
                  <p className="text-[11px] font-mono text-emerald-700 font-bold">${deal?.offer_b?.value} CAD</p>
                </div>
              </div>

              <div className="bg-slate-100 p-3 rounded-xl border border-slate-300 font-sans space-y-1">
                <h4 className="font-bold text-slate-900 text-xs">Tax Audit Record</h4>
                <p className="text-[11px] text-slate-700 font-mono">Subtotal FMV: <strong>${offerAVal.toLocaleString()} CAD</strong> • Net Cash Outlay: <strong>$0.00 CAD</strong></p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}