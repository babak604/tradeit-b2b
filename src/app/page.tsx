'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import GlobalStageFeed from '@/components/GlobalStageFeed';
import PitchUpload from '@/components/PitchUpload';
import CircularLoopBanner from '@/components/CircularLoopBanner';
import AuthModal from '@/components/AuthModal';
import EscrowMilestoneTracker from '@/components/EscrowMilestoneTracker';
import { CircularLoopMatch } from '@/lib/matcher/circularTradeAgent';
import { Button } from '@/components/ui/button';
import { 
  Tornado, PlusCircle, ShieldCheck, 
  Send, X, ArrowLeftRight, FileText, Download, CheckCircle2, UserCheck, LogIn, Bot, Sparkles, Loader2 
} from 'lucide-react';

export default function MasterDashboardPage() {
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);

  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isAgentAutoPilot, setIsAgentAutoPilot] = useState(false);
  const [agentThinking, setAgentThinking] = useState(false);

  const [deal, setDeal] = useState({
    id: 'demo-deal-123',
    status: 'negotiating',
    signed_a: false,
    signed_b: false,
    offer_a: {
      title: '50 Hours Studio Video Production',
      offering: '4K Multi-cam filming & editing',
      looking_for: 'Downtown Coworking Space',
      value: 5000,
      company: 'Montreal Creative Studios'
    },
    offer_b: {
      title: '200 Sq Ft Office Lease',
      offering: 'Furnished workspace with gigabit fiber',
      looking_for: 'Marketing Video Reels',
      value: 4800,
      company: 'St-Laurent Tech Hub'
    }
  });

  const [messages, setMessages] = useState([
    { sender: 'St-Laurent Tech Hub', text: 'Hey! We can clear out the desk space by Monday. Does that work for filming?' },
    { sender: 'You', text: 'Monday works great. Ready to lock in the barter agreement.' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setCurrentUser(session.user.email);
    });
  }, []);

  // Trigger Autonomous AI Counter-Proposal
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setMessages((prev) => [...prev, { sender: currentUser || 'You', text: newMessage.trim() }]);
    setNewMessage('');
  };

  const handleSignAgreement = () => {
    setDeal((prev) => ({ ...prev, signed_a: true }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden">
      
      {/* Header */}
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

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 space-y-6 relative print:hidden">
        
        <CircularLoopBanner loops={[]} onInitiateLoop={(loop) => setActiveDealId(loop.loop_id)} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className={`${activeDealId ? 'lg:col-span-6' : 'lg:col-span-12'} transition-all duration-300`}>
            <GlobalStageFeed onSelectDeal={(id) => setActiveDealId(id)} />
          </div>

          {/* Right Slide-Over: Autonomous Deal Room */}
          {activeDealId && (
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-2xl relative sticky top-24 h-[calc(100vh-120px)] overflow-y-auto hide-scrollbar animate-in slide-in-from-right duration-300">
              
              {/* Header with Autonomous Agent Control */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-red-500" />
                  <h3 className="font-extrabold text-white text-sm">AUTONOMOUS DEAL ROOM</h3>
                </div>

                {/* AI Auto-Pilot Trigger */}
                <button
                  onClick={triggerAiAgentNegotiation}
                  disabled={agentThinking}
                  className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  {agentThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5 text-red-500" />}
                  <span>{agentThinking ? 'AI Agent Negotiating...' : 'Trigger AI Negotiator'}</span>
                </button>
              </div>

              {/* Offer Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase">{deal.offer_a.company}</p>
                  <p className="font-bold text-white line-clamp-1">{deal.offer_a.title}</p>
                  <p className="text-slate-400 font-mono text-[10px]">${deal.offer_a.value.toLocaleString()} CAD Value</p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                  <p className="text-[10px] font-bold text-blue-400 uppercase">{deal.offer_b.company}</p>
                  <p className="font-bold text-white line-clamp-1">{deal.offer_b.title}</p>
                  <p className="text-slate-400 font-mono text-[10px]">${deal.offer_b.value.toLocaleString()} CAD Value</p>
                </div>
              </div>

              {/* Chat & Agent Messages */}
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
                    placeholder="Message counterparty or let AI Agent negotiate..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                  <Button type="submit" size="sm" className="bg-red-600 hover:bg-red-500 text-white px-3 cursor-pointer">
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </form>
              </div>

              {/* Escrow Milestone Tracker */}
              <EscrowMilestoneTracker dealId={deal.id} />

              {/* Execution Actions */}
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
      </main>

      {/* Modals */}
      <PitchUpload isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onAuthSuccess={(e) => setCurrentUser(e)} />
    </div>
  );
}