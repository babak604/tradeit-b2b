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
  Coins, Cpu, Lock, ExternalLink, Layers
} from 'lucide-react';

// Dynamic Client Component Imports (Isolates Webpack Chunks & Breaks TDZ Loops)
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

  // Auth & Agent States
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [agentThinking, setAgentThinking] = useState(false);

  // Interactive RWA Simulator State
  const [assetType, setAssetType] = useState<string>('Commercial Invoice');
  const [assetValue, setAssetValue] = useState<number>(75000);
  const [isTokenizing, setIsTokenizing] = useState<boolean>(false);
  const [tokenizedAsset, setTokenizedAsset] = useState<any>(null);

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
      company: 'Easy Mondays Apparel'
    },
    offer_b: {
      title: 'Full 4K Video Production & Editing',
      offering: '50 Hours Studio 4K Multi-cam Production & Post-Editing',
      looking_for: 'Furnished Commercial Office or Co-working Space',
      value: 5000,
      company: 'Montreal Creative Studios'
    }
  });

  const [messages, setMessages] = useState([
    { sender: 'Montreal Creative Studios', text: 'Hey! Our studio crew is open next week for filming. Can you prepare the apparel items?' },
    { sender: 'You', text: 'Sounds great! Inventory is cataloged and ready for pickup.' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    setMounted(true);
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

  const handleSimulateTokenization = () => {
    setIsTokenizing(true);
    setTokenizedAsset(null);

    setTimeout(() => {
      setTokenizedAsset({
        mintAddress: 'RWA_' + Math.random().toString(36).substring(2, 10).toUpperCase() + '_sol',
        assetType,
        value: assetValue,
        supply: 1,
        timestamp: new Date().toLocaleTimeString(),
      });
      setIsTokenizing(false);
    }, 1100);
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
        }
      }
    } catch (err) {
      console.error('Agent trigger failed:', err);
    } finally {
      setAgentThinking(false);
    }
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

    if (activeDealId) {
      const channel = supabase.channel(`deal-room-${activeDealId}`);
      await channel.send({
        type: 'broadcast',
        event: 'sign-contract',
        payload: { partyKey: 'signed_a' },
      });
    }
  };

  const handleInitiateCircularLoop = (loop: CircularLoopMatch) => {
    if (!loop) return;
    setDeal({
      id: loop.loop_id || 'loop-demo',
      status: 'active-loop',
      signed_a: false,
      signed_b: false,
      offer_a: {
        title: loop.node_a?.offering_summary ?? 'Offer A',
        offering: loop.node_a?.offering_summary ?? 'Offer A',
        looking_for: loop.node_a?.looking_for_summary ?? 'Need A',
        value: loop.node_a?.estimated_value ?? 0,
        company: loop.node_a?.company_name ?? 'Company A',
      },
      offer_b: {
        title: loop.node_b?.offering_summary ?? 'Offer B',
        offering: loop.node_b?.offering_summary ?? 'Offer B',
        looking_for: loop.node_b?.looking_for_summary ?? 'Need B',
        value: loop.node_b?.estimated_value ?? 0,
        company: loop.node_b?.company_name ?? 'Company B',
      }
    });

    setActiveDealId(loop.loop_id || 'loop-demo');
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
        company: DEMO_PRESET_OFFERS[0]?.company_name ?? 'Easy Mondays Apparel'
      },
      offer_b: {
        title: DEMO_PRESET_OFFERS[1]?.title ?? '4K Video Production',
        offering: DEMO_PRESET_OFFERS[1]?.offering_summary ?? '50 Studio Hours',
        looking_for: DEMO_PRESET_OFFERS[1]?.looking_for_summary ?? 'Office Space',
        value: DEMO_PRESET_OFFERS[1]?.estimated_value ?? 5000,
        company: DEMO_PRESET_OFFERS[1]?.company_name ?? 'Montreal Creative Studios'
      }
    });
    setMessages([
      { sender: 'Easy Mondays Apparel', text: 'We have 250 units of premium hoodies ready. Can you handle 4K video reels for our fall line?' },
      { sender: 'Montreal Creative Studios', text: 'Our studio space and crew are open next week. Let’s execute the barter swap.' }
    ]);
    setActiveDealId('demo-2way-swap');
  };

  const runThreeWayLoopDemo = () => {
    handleInitiateCircularLoop({
      loop_id: 'loop-demo-3way-investor',
      parity_score: 98,
      total_liquidity_unlocked: 18500,
      node_a: DEMO_PRESET_OFFERS[0],
      node_b: DEMO_PRESET_OFFERS[1],
      node_c: DEMO_PRESET_OFFERS[2],
    });
  };

  const runAiNegotiatorDemo = () => {
    runDirectTwoWayDemo();
    setTimeout(() => {
      triggerAiAgentNegotiation();
    }, 300);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-teal-500 selection:text-slate-950">
      
      {/* BACKGROUND GLOWS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      {/* Top Header Navigation */}
      <header className="border-b border-slate-900 bg-slate-950/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between sticky top-0 z-40 print:hidden">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-teal-500/10 rounded-xl border border-teal-500/30 text-teal-400">
            <Tornado className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-base tracking-wider flex items-center gap-2">
              TRADEIT <span className="text-teal-400 text-xs font-mono px-2 py-0.5 bg-teal-950/80 border border-teal-500/30 rounded-md">SOLANA RWA STAGE</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">tradeit.tv • 2-of-2 Multi-Sig PDA Engine</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link href="/pricing">
            <Button
              variant="outline"
              size="sm"
              className="bg-slate-900 border-slate-800 text-slate-300 hover:text-white text-xs cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Membership Plans</span>
            </Button>
          </Link>

          {currentUser ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400">
              <UserCheck className="w-3.5 h-3.5" />
              <span className="truncate max-w-[120px] sm:max-w-[180px]">{currentUser}</span>
            </div>
          ) : (
            <Button
              onClick={() => setIsAuthOpen(true)}
              variant="outline"
              size="sm"
              className="bg-slate-900 border-slate-800 text-slate-300 hover:text-white text-xs cursor-pointer flex items-center gap-1"
            >
              <LogIn className="w-3.5 h-3.5 text-teal-400" />
              <span>Login / Verify</span>
            </Button>
          )}

          {activeDealId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveDealId(null)}
              className="bg-slate-900 border-slate-800 text-slate-300 hover:text-white text-xs cursor-pointer"
            >
              Close Deal Panel
            </Button>
          )}

          <Button
            onClick={() => setIsUploadOpen(true)}
            className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs px-4 h-9 shadow-lg shadow-teal-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post Offer & Need</span>
          </Button>
        </div>
      </header>

      {/* Main Dashboard Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 space-y-8 relative print:hidden">
        
        {/* HERO BLOCK: SOLANA & RWA TOKENIZATION VALUE PROP */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 backdrop-blur-xl space-y-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-300">
                <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                Solana Devnet Smart Contract Engine • Program ID: Es7dux19...ERi
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 leading-tight">
                Tokenize Real-World Assets. <br />
                <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                  Settle B2B Deals Non-Custodially on Solana.
                </span>
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                TradeIt converts commercial invoices, freight cargo, and surplus inventory into liquid SPL tokens. 
                Execute non-custodial atomic settlements backed by 2-of-2 multi-party approvals on Solana Devnet.
              </p>
            </div>

            {/* QUICK DENSE METRICS STRIP */}
            <div className="grid grid-cols-2 gap-3 w-full lg:w-auto font-mono text-xs">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-1">
                <p className="text-[10px] text-slate-500 uppercase">Settlement Speed</p>
                <p className="font-bold text-teal-400 text-sm">&lt; 400ms <span className="text-[9px] text-slate-400 font-sans">Finality</span></p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-1">
                <p className="text-[10px] text-slate-500 uppercase">Average Fee</p>
                <p className="font-bold text-teal-400 text-sm">$0.00025 <span className="text-[9px] text-slate-400 font-sans">On-Chain</span></p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-1">
                <p className="text-[10px] text-slate-500 uppercase">Security Model</p>
                <p className="font-bold text-indigo-400 text-sm">2-of-2 Multi-Sig</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-1">
                <p className="text-[10px] text-slate-500 uppercase">Proof Format</p>
                <p className="font-bold text-purple-400 text-sm">PDF Certificate</p>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE RWA TOKENIZATION SIMULATOR */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-teal-400" />
              <div>
                <h3 className="text-base font-bold text-slate-100">Interactive RWA Asset Tokenization Engine</h3>
                <p className="text-xs text-slate-400">Simulate converting physical business collateral into a Solana SPL token.</p>
              </div>
            </div>
            <span className="rounded-full bg-slate-950 border border-slate-800 px-3 py-1 text-xs text-teal-400 font-mono">
              SPL Token Standard
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Input Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Select Real-World Asset (RWA) Class</label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="Commercial Invoice">Commercial Invoice (#INV-8839)</option>
                  <option value="Freight Cargo Container">Freight Cargo Container (Electronics)</option>
                  <option value="Agricultural Commodity">Agricultural Commodity (Coffee Freight)</option>
                  <option value="Industrial Equipment">Heavy Industrial Machinery</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Appraised Valuation ($ USD)</label>
                <input
                  type="number"
                  value={assetValue}
                  onChange={(e) => setAssetValue(Number(e.target.value))}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                onClick={handleSimulateTokenization}
                disabled={isTokenizing}
                className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 p-3 text-xs font-bold text-slate-950 transition-all shadow-md shadow-teal-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isTokenizing ? "Minting SPL Token on Solana..." : "⚡ Tokenize Asset on Solana Devnet"}
              </button>
            </div>

            {/* Tokenized Output Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <span className="text-slate-400 uppercase tracking-wider text-[10px]">On-Chain Token State</span>
                <span className={`px-2 py-0.5 rounded text-[10px] ${tokenizedAsset ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-500"}`}>
                  {tokenizedAsset ? "TOKEN MINTED ON-CHAIN" : "AWAITING MINT"}
                </span>
              </div>

              {tokenizedAsset ? (
                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between"><span className="text-slate-500">Asset Class:</span> <span>{tokenizedAsset.assetType}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">SPL Mint Address:</span> <span className="text-teal-400 font-bold">{tokenizedAsset.mintAddress}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Tokenized Value:</span> <span className="text-emerald-400">${tokenizedAsset.value.toLocaleString()} USD</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Blockchain Standard:</span> <span>Solana SPL Token</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Timestamp:</span> <span>{tokenizedAsset.timestamp}</span></div>
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-teal-300">
                    ✓ Tokenized asset ready for deposit into 2-of-2 Escrow Vault
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-500 space-y-1 font-sans">
                  <p>Select an asset class and click tokenize to simulate generating an SPL token on Solana.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Interactive Investor Product Demo Controller */}
        <DemoStoryController 
          onRunTwoWayDemo={runDirectTwoWayDemo}
          onRunThreeWayDemo={runThreeWayLoopDemo}
          onRunAiNegotiatorDemo={runAiNegotiatorDemo}
        />

        {/* 3-Way Circular Loop Banner */}
        <CircularLoopBanner loops={[]} onInitiateLoop={handleInitiateCircularLoop} />

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Global Video Stage Feed */}
          <div className={`${activeDealId ? 'lg:col-span-6' : 'lg:col-span-12'} transition-all duration-300`}>
            <GlobalStageFeed onSelectDeal={(id) => setActiveDealId(id)} />
          </div>

          {/* Right Slide-Over Panel: Autonomous Deal Room */}
          {activeDealId && (
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-2xl relative sticky top-24 h-[calc(100vh-120px)] overflow-y-auto hide-scrollbar animate-in slide-in-from-right duration-300">
              
              {/* Drawer Header with Agent Control & Solana Multi-Sig Badging */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="w-5 h-5 text-teal-400" />
                    <h3 className="font-extrabold text-white text-sm">AUTONOMOUS SOLANA DEAL ROOM</h3>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">2-of-2 Multi-Sig PDA Vault Engine</p>
                </div>

                <button
                  onClick={triggerAiAgentNegotiation}
                  disabled={agentThinking}
                  className="px-3 py-1 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  {agentThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5 text-teal-400" />}
                  <span>{agentThinking ? 'AI Agent Negotiating...' : 'Trigger AI Negotiator'}</span>
                </button>
              </div>

              {/* Side-by-Side Offer Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div 
                  onClick={() => setSelectedCompanyProfile(deal?.offer_a?.company ?? null)}
                  className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1 hover:border-slate-700 cursor-pointer transition-all"
                >
                  <p className="text-[10px] font-bold text-emerald-400 uppercase">{deal?.offer_a?.company ?? 'Party A'} ↗</p>
                  <p className="font-bold text-white line-clamp-1">{deal?.offer_a?.title ?? 'Offer A'}</p>
                  <p className="text-slate-400 font-mono text-[10px]">${(deal?.offer_a?.value ?? 0).toLocaleString()} CAD Value</p>
                </div>

                <div 
                  onClick={() => setSelectedCompanyProfile(deal?.offer_b?.company ?? null)}
                  className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1 hover:border-slate-700 cursor-pointer transition-all"
                >
                  <p className="text-[10px] font-bold text-blue-400 uppercase">{deal?.offer_b?.company ?? 'Party B'} ↗</p>
                  <p className="font-bold text-white line-clamp-1">{deal?.offer_b?.title ?? 'Offer B'}</p>
                  <p className="text-slate-400 font-mono text-[10px]">${(deal?.offer_b?.value ?? 0).toLocaleString()} CAD Value</p>
                </div>
              </div>

              {/* Realtime Negotiation Chat */}
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between min-h-[220px]">
                <div className="space-y-3 overflow-y-auto max-h-[160px] hide-scrollbar">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.sender === (currentUser || 'You') ? 'items-end' : 'items-start'}`}>
                      <span className="text-[9px] text-slate-500 mb-0.5">{msg.sender}</span>
                      <div className={`p-3 rounded-2xl text-xs max-w-[85%] ${
                        msg.sender.includes('Agent') 
                          ? 'bg-slate-900 border border-teal-500/40 text-teal-200'
                          : msg.sender === (currentUser || 'You')
                          ? 'bg-teal-600 text-slate-950 font-medium rounded-br-none' 
                          : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2 mt-3 pt-3 border-t border-slate-900">
                  <input 
                    type="text"
                    placeholder="Propose terms or trigger AI Negotiator..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                  <Button type="submit" size="sm" className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-3 cursor-pointer">
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </form>
              </div>

              {/* Escrow Deliverable Tracker */}
              <EscrowMilestoneTracker dealId={deal.id} />

              {/* Realtime Contract Signing & Printable Export Vault */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>2-of-2 Multi-Sig Solana Escrow</span>
                  </div>

                  <Button
                    onClick={handleSignAgreement}
                    disabled={deal.signed_a}
                    className={`text-xs font-bold px-5 h-9 rounded-xl cursor-pointer ${
                      deal.signed_a 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-lg shadow-teal-500/20'
                    }`}
                  >
                    {deal.signed_a ? 'Agreement Signed ✓' : 'Sign Trade Deal'}
                  </Button>
                </div>

                {deal.signed_a && (
                  <button
                    onClick={() => setShowContractModal(true)}
                    className="w-full bg-slate-950 hover:bg-slate-800 border border-emerald-500/30 text-emerald-400 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View & Export Executed B2B Contract (PDF)</span>
                  </button>
                )}
              </div>

            </div>
          )}

        </div>

        {/* How It Works Visual Narrative Section */}
        <HowItWorksSection />

      </main>

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

      {/* Company Network Profile Drawer */}
      <CompanyProfileDrawer 
        companyName={selectedCompanyProfile}
        onClose={() => setSelectedCompanyProfile(null)}
      />

      {/* Printable Digital Contract Vault Modal */}
      {showContractModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 border border-slate-300 w-full max-w-2xl rounded-3xl p-8 space-y-6 relative shadow-2xl my-auto print:p-0 print:border-none print:shadow-none">
            
            <div className="flex items-center justify-between border-b pb-4 border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase">EXECUTED B2B BARTER AGREEMENT</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-slate-800 cursor-pointer"
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

            {/* Printable Contract Body */}
            <div className="space-y-4 text-xs font-serif leading-relaxed">
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <h2 className="text-lg font-black tracking-tight font-sans">TRADEIT AI BARTER SWAP CONTRACT</h2>
                  <p className="text-[10px] text-slate-500 font-mono">Contract ID: {deal?.id} • Program ID: Es7dux19...ERi</p>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded font-sans">
                  VERIFIED ON SOLANA DEVNET
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Party A</p>
                  <p className="font-extrabold text-slate-900">{deal?.offer_a?.company}</p>
                  <p className="text-[11px] text-slate-600">{deal?.offer_a?.offering}</p>
                  <p className="text-[11px] font-mono text-emerald-700 font-bold mt-1">${deal?.offer_a?.value} CAD Value</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Party B</p>
                  <p className="font-extrabold text-slate-900">{deal?.offer_b?.company}</p>
                  <p className="text-[11px] text-slate-600">{deal?.offer_b?.offering}</p>
                  <p className="text-[11px] font-mono text-emerald-700 font-bold mt-1">${deal?.offer_b?.value} CAD Value</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-sans font-bold text-slate-900 text-xs">Terms of Reciprocal Exchange</h4>
                <p>
                  Both participating entities hereby agree to exchange the designated B2B services/goods outlined above with zero cash consideration, maintaining equal parity under the TradeIt AI network charter and secured via a 2-of-2 multi-party Solana Anchor escrow account.
                </p>
              </div>

              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 font-sans">
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