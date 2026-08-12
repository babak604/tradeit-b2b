'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import GlobalStageFeed from '@/components/GlobalStageFeed';
import PitchUpload from '@/components/PitchUpload';
import CircularLoopBanner from '@/components/CircularLoopBanner';
import AuthModal from '@/components/AuthModal';
import EscrowMilestoneTracker from '@/components/EscrowMilestoneTracker';
import DemoStoryController from '@/components/DemoStoryController';
import CompanyProfileDrawer from '@/components/CompanyProfileDrawer';
import HowItWorksSection from '@/components/HowItWorksSection';
import { DEMO_PRESET_OFFERS } from '@/lib/demo/demoSeedData';
import { CircularLoopMatch } from '@/lib/matcher/circularTradeAgent';
import { Button } from '@/components/ui/button';
import { 
  Tornado, PlusCircle, ShieldCheck, 
  Send, X, ArrowLeftRight, FileText, Download, CheckCircle2, UserCheck, LogIn, Bot, Loader2, Sparkles 
} from 'lucide-react';

export default function MasterDashboardPage() {
  // Single-Page Modal & Drawer States
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedCompanyProfile, setSelectedCompanyProfile] = useState<string | null>(null);

  // Auth & Agent States
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [agentThinking, setAgentThinking] = useState(false);

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

  // Check current auth session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setCurrentUser(session.user.email);
    });
  }, []);

  // Supabase Realtime Subscription for Live Chat & Contract Signatures
  useEffect(() => {
    if (!activeDealId) return;

    const channel = supabase.channel(`deal-room-${activeDealId}`, {
      config: { broadcast: { self: true } }
    });

    channel
      .on('broadcast', { event: 'chat-message' }, (payload) => {
        setMessages((prev) => [...prev, payload.payload]);
      })
      .on('broadcast', { event: 'sign-contract' }, (payload) => {
        setDeal((prev) => ({ ...prev, [payload.payload.partyKey]: true }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeDealId]);

  // Trigger Autonomous LLM Negotiation Agent
  const triggerAiAgentNegotiation = async () => {
    setAgentThinking(true);
    try {
      const res = await fetch('/api/agent/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          myOfferSummary: deal.offer_a.offering,
          theirOfferSummary: deal.offer_b.offering,
          theirCompany: deal.offer_b.company,
          chatHistory: messages,
        }),
      });

      const data = await res.json();
      if (data.decision) {
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

    const channel = supabase.channel(`deal-room-${activeDealId}`);
    await channel.send({
      type: 'broadcast',
      event: 'chat-message',
      payload: msgPayload,
    });

    setNewMessage('');
  };

  const handleSignAgreement = async () => {
    setDeal((prev) => ({ ...prev, signed_a: true }));

    const channel = supabase.channel(`deal-room-${activeDealId}`);
    await channel.send({
      type: 'broadcast',
      event: 'sign-contract',
      payload: { partyKey: 'signed_a' },
    });
  };

  const handleInitiateCircularLoop = (loop: CircularLoopMatch) => {
    setDeal({
      id: loop.loop_id,
      status: 'active-loop',
      signed_a: false,
      signed_b: false,
      offer_a: {
        title: loop.node_a.offering_summary,
        offering: loop.node_a.offering_summary,
        looking_for: loop.node_a.looking_for_summary,
        value: loop.node_a.estimated_value,
        company: loop.node_a.company_name,
      },
      offer_b: {
        title: loop.node_b.offering_summary,
        offering: loop.node_b.offering_summary,
        looking_for: loop.node_b.looking_for_summary,
        value: loop.node_b.estimated_value,
        company: loop.node_b.company_name,
      }
    });

    setActiveDealId(loop.loop_id);
  };

  // Demo Scenarios Triggers
  const runDirectTwoWayDemo = () => {
    setDeal({
      id: 'demo-2way-swap',
      status: 'negotiating',
      signed_a: false,
      signed_b: false,
      offer_a: {
        title: DEMO_PRESET_OFFERS[0].title,
        offering: DEMO_PRESET_OFFERS[0].offering_summary,
        looking_for: DEMO_PRESET_OFFERS[0].looking_for_summary,
        value: DEMO_PRESET_OFFERS[0].estimated_value,
        company: DEMO_PRESET_OFFERS[0].company_name
      },
      offer_b: {
        title: DEMO_PRESET_OFFERS[1].title,
        offering: DEMO_PRESET_OFFERS[1].offering_summary,
        looking_for: DEMO_PRESET_OFFERS[1].looking_for_summary,
        value: DEMO_PRESET_OFFERS[1].estimated_value,
        company: DEMO_PRESET_OFFERS[1].company_name
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden">
      
      {/* Top Header Navigation */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between sticky top-0 z-40 print:hidden">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-600/10 rounded-xl border border-red-500/20 text-red-500">
            <Tornado className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-base tracking-wider flex items-center gap-2">
              TRADEIT <span className="text-red-500 text-xs font-mono px-2 py-0.5 bg-red-950/80 border border-red-500/30 rounded-md">AGENTIC STAGE</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Link to Pricing & Membership Pass Page */}
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
              <LogIn className="w-3.5 h-3.5 text-red-400" />
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
            className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 h-9 shadow-lg shadow-red-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post Offer & Need</span>
          </Button>
        </div>
      </header>

      {/* Main Single-Page Dashboard Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 space-y-6 relative print:hidden">
        
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
              
              {/* Drawer Header with Agent Control */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-red-500" />
                  <h3 className="font-extrabold text-white text-sm">AUTONOMOUS DEAL ROOM</h3>
                </div>

                <button
                  onClick={triggerAiAgentNegotiation}
                  disabled={agentThinking}
                  className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  {agentThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5 text-red-500" />}
                  <span>{agentThinking ? 'AI Agent Negotiating...' : 'Trigger AI Negotiator'}</span>
                </button>
              </div>

              {/* Side-by-Side Offer Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div 
                  onClick={() => setSelectedCompanyProfile(deal.offer_a.company)}
                  className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1 hover:border-slate-700 cursor-pointer transition-all"
                >
                  <p className="text-[10px] font-bold text-emerald-400 uppercase">{deal.offer_a.company} ↗</p>
                  <p className="font-bold text-white line-clamp-1">{deal.offer_a.title}</p>
                  <p className="text-slate-400 font-mono text-[10px]">${deal.offer_a.value.toLocaleString()} CAD Value</p>
                </div>

                <div 
                  onClick={() => setSelectedCompanyProfile(deal.offer_b.company)}
                  className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1 hover:border-slate-700 cursor-pointer transition-all"
                >
                  <p className="text-[10px] font-bold text-blue-400 uppercase">{deal.offer_b.company} ↗</p>
                  <p className="font-bold text-white line-clamp-1">{deal.offer_b.title}</p>
                  <p className="text-slate-400 font-mono text-[10px]">${deal.offer_b.value.toLocaleString()} CAD Value</p>
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
                          ? 'bg-slate-900 border border-red-500/40 text-red-200'
                          : msg.sender === (currentUser || 'You')
                          ? 'bg-red-600 text-white rounded-br-none' 
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
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                  <Button type="submit" size="sm" className="bg-red-600 hover:bg-red-500 text-white px-3 cursor-pointer">
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
                    <span>Zero Cash Outlay Contract</span>
                  </div>

                  <Button
                    onClick={handleSignAgreement}
                    disabled={deal.signed_a}
                    className={`text-xs font-bold px-5 h-9 rounded-xl cursor-pointer ${
                      deal.signed_a 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20'
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
                  <p className="text-[10px] text-slate-500 font-mono">Contract ID: {deal.id} • Hash: 0x8F92...C10A</p>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded font-sans">
                  LEGALLY BINDING
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Party A</p>
                  <p className="font-extrabold text-slate-900">{deal.offer_a.company}</p>
                  <p className="text-[11px] text-slate-600">{deal.offer_a.offering}</p>
                  <p className="text-[11px] font-mono text-emerald-700 font-bold mt-1">${deal.offer_a.value} CAD Value</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Party B</p>
                  <p className="font-extrabold text-slate-900">{deal.offer_b.company}</p>
                  <p className="text-[11px] text-slate-600">{deal.offer_b.offering}</p>
                  <p className="text-[11px] font-mono text-emerald-700 font-bold mt-1">${deal.offer_b.value} CAD Value</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-sans font-bold text-slate-900 text-xs">Terms of Reciprocal Exchange</h4>
                <p>
                  Both participating entities hereby agree to exchange the designated B2B services/goods outlined above with zero cash consideration, maintaining equal parity under the TradeIt AI network charter.
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