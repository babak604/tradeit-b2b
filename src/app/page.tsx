'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Tornado, Plus, ShieldCheck, Send, ArrowLeftRight, 
  UserCheck, LogIn, Bot, Loader2, ArrowRight, 
  Zap, RefreshCw, Sparkles, ChevronRight
} from 'lucide-react';

const PitchUpload = dynamic(() => import('@/components/PitchUpload'), { ssr: false });
const AuthModal = dynamic(() => import('@/components/AuthModal'), { ssr: false });

export default function MasterDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Active Loop Visualization State
  const [activeLoopType, setActiveLoopType] = useState<'2way' | '3way' | '4way'>('3way');

  // Interactive Deep-Dive Demo Terminal State
  const [demoMode, setDemoMode] = useState<'2way' | '3way'>('3way');
  const [demoStage, setDemoStage] = useState<'negotiating' | 'locked' | 'settled'>('negotiating');
  const [agentThinking, setAgentThinking] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'Montreal Creative Studios', text: 'We have 50 hours of studio production ready for Q3. Looking for surplus merch or apparel.' },
    { sender: 'Easy Mondays Apparel', text: 'We have 250 units of premium hoodies ($8,500 CAD value). But we need co-working space.' },
    { sender: 'TradeIt AI Matcher', text: '⚡ Circular Loop Detected! Matching Easy Mondays → Montreal Creative → Apex Co-Working → Easy Mondays.' }
  ]);
  const [userInput, setUserInput] = useState('');

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setCurrentUser(session.user.email);
    });
  }, []);

  const triggerAiNegotiator = () => {
    setAgentThinking(true);
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { 
          sender: 'TradeIt Autonomous Agent', 
          text: '🤖 [AI Agent]: Parity score verified at 99.4%. Value imbalance ($250 CAD) offset with Trade Credits. Multi-sig escrow vault generated.' 
        }
      ]);
      setDemoStage('locked');
      setAgentThinking(false);
    }, 1200);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    setChatMessages((prev) => [...prev, { sender: currentUser || 'You', text: userInput.trim() }]);
    setUserInput('');
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#4a6370] text-slate-100 flex flex-col font-sans">
      
      {/* HEADER NAVIGATION */}
      <header className="border-b border-white/10 bg-[#425965]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-2xl border border-white/20">
              <Tornado className="w-5 h-5 text-amber-400" />
            </div>
            <span className="font-extrabold text-lg tracking-wider text-white">
              TRADEIT <span className="text-xs font-mono text-amber-300 px-2 py-0.5 bg-amber-400/10 border border-amber-400/30 rounded-full ml-1 font-bold">B2B NETWORK</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-xs font-medium text-slate-200">
            <a href="#how-it-works" className="hover:text-amber-300 transition-colors">How It Works</a>
            <a href="#circular-tech" className="hover:text-amber-300 transition-colors">Circular Tech</a>
            <Link href="/rwa" className="hover:text-amber-300 transition-colors">RWA Studio</Link>
            <Link href="/pricing" className="hover:text-amber-300 transition-colors">Pricing</Link>
            <a href="#demo-terminal" className="hover:text-amber-300 transition-colors">Interactive Demo</a>
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          {currentUser ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-900/40 border border-emerald-400/30 rounded-full text-xs font-medium text-emerald-200">
              <UserCheck className="w-3.5 h-3.5" />
              <span className="truncate max-w-[120px]">{currentUser}</span>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-xs rounded-full font-bold cursor-pointer transition-all flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}

          <Button
            onClick={() => setIsUploadOpen(true)}
            className="bg-white text-[#334652] hover:bg-slate-100 font-extrabold text-xs px-5 h-9 rounded-full shadow-lg flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 text-[#334652]" />
            <span>Post Trade Offer</span>
          </Button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 px-6 max-w-[1400px] mx-auto w-full text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-400/10 border border-amber-400/30 rounded-full text-xs font-semibold text-amber-300">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Autonomous Reciprocal B2B Trade Infrastructure</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight max-w-4xl mx-auto">
          Trade Surplus Assets & Service Capacity <span className="text-amber-300 underline decoration-amber-400/40">Without Cash</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-200 max-w-2xl mx-auto leading-relaxed">
          TradeIt connects verified businesses into direct 2-way swaps and multi-node circular trade loops. Unlock liquid value from overstock, unbilled hours, and equipment capacity.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <a href="#demo-terminal">
            <Button className="bg-white text-[#334652] hover:bg-slate-100 font-extrabold text-xs px-7 py-3.5 rounded-full shadow-xl flex items-center gap-2">
              <span>Launch Interactive Trade Engine</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
          <Link href="/rwa">
            <button className="px-6 py-3.5 bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold text-white rounded-full transition-all flex items-center gap-2">
              <span>Explore RWA Asset Tokenization</span>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </button>
          </Link>
        </div>
      </section>

      {/* FLUID WHAT WE DO & BENEFITS SECTION */}
      <section id="how-it-works" className="py-20 px-6 bg-gradient-to-b from-[#4a6370] via-[#3f5663] to-[#384d59] border-t border-white/10">
        <div className="max-w-[1300px] mx-auto space-y-16">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-mono text-amber-300 uppercase tracking-widest font-bold">What We Do</h2>
            <h3 className="text-3xl font-extrabold text-white">A Frictionless Barter Economy Built for Modern Enterprise</h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Businesses lose billions each year in unsold inventory and unbilled service capacity. TradeIt turns those stagnant assets into direct purchasing power.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="p-3 bg-amber-400/10 border border-amber-400/30 rounded-2xl w-fit">
                <Zap className="w-6 h-6 text-amber-400" />
              </div>
              <h4 className="text-lg font-bold text-white">1. Creative Offer Posting</h4>
              <p className="text-xs text-slate-200 leading-relaxed">
                Post anything from surplus apparel to 4K studio filming hours or commercial office space. Let your business set custom valuations and terms freely.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="p-3 bg-amber-400/10 border border-amber-400/30 rounded-2xl w-fit">
                <RefreshCw className="w-6 h-6 text-amber-400" />
              </div>
              <h4 className="text-lg font-bold text-white">2. AI Loop Matching</h4>
              <p className="text-xs text-slate-200 leading-relaxed">
                Can't find a direct trade partner? Our autonomous graph agent detects multi-node circular loops (3-way and 4-way) to complete complex trade chains.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="p-3 bg-amber-400/10 border border-amber-400/30 rounded-2xl w-fit">
                <ShieldCheck className="w-6 h-6 text-amber-400" />
              </div>
              <h4 className="text-lg font-bold text-white">3. Multi-Sig Solana Escrow</h4>
              <p className="text-xs text-slate-200 leading-relaxed">
                Settlements are locked in 2-of-2 on-chain Solana vaults with legal CRA / IRS tax accounting logs for seamless compliance.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* VISUAL EXPLANATION: 2, 3, AND 4-WAY CIRCULAR TECHNOLOGY */}
      <section id="circular-tech" className="py-20 px-6 bg-[#384d59] border-t border-white/10">
        <div className="max-w-[1300px] mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-mono text-amber-300 uppercase tracking-widest font-bold">Circular Technology</h2>
            <h3 className="text-3xl font-extrabold text-white">Multi-Node Trade Routing Engine</h3>
            <p className="text-xs sm:text-sm text-slate-200">
              When Company A has what Company B wants, but B doesn't have what A needs, TradeIt creates multi-party trade rings that unlock 100% parity.
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => setActiveLoopType('2way')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activeLoopType === '2way' 
                  ? 'bg-white text-[#334652] shadow-lg' 
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              2-Way Direct Swap
            </button>
            <button
              onClick={() => setActiveLoopType('3way')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activeLoopType === '3way' 
                  ? 'bg-white text-[#334652] shadow-lg' 
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              3-Way Circular Loop
            </button>
            <button
              onClick={() => setActiveLoopType('4way')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activeLoopType === '4way' 
                  ? 'bg-white text-[#334652] shadow-lg' 
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              4-Way Enterprise Circuit
            </button>
          </div>

          <div className="p-8 sm:p-12 rounded-3xl bg-[#2d404b] border border-white/15 shadow-2xl relative overflow-hidden">
            
            {activeLoopType === '2way' && (
              <div className="flex flex-col sm:flex-row items-center justify-around gap-8 text-center animate-in fade-in duration-300">
                <div className="p-6 rounded-2xl bg-[#394f5c] border border-white/20 w-64 space-y-2">
                  <span className="text-[10px] text-amber-300 font-mono">PARTY A</span>
                  <h4 className="font-extrabold text-white text-sm">Easy Mondays Apparel</h4>
                  <p className="text-xs text-slate-300">Offers: $8,500 Hoodies</p>
                </div>

                <div className="flex flex-col items-center gap-1 font-mono text-xs text-amber-300">
                  <ArrowLeftRight className="w-8 h-8 animate-pulse text-amber-400" />
                  <span>Direct Reciprocal Swap</span>
                  <span className="text-[10px] text-emerald-300">100% Parity Verified</span>
                </div>

                <div className="p-6 rounded-2xl bg-[#394f5c] border border-white/20 w-64 space-y-2">
                  <span className="text-[10px] text-amber-300 font-mono">PARTY B</span>
                  <h4 className="font-extrabold text-white text-sm">Montreal Creative</h4>
                  <p className="text-xs text-slate-300">Offers: $8,500 4K Filming</p>
                </div>
              </div>
            )}

            {activeLoopType === '3way' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center animate-in fade-in duration-300">
                <div className="p-5 rounded-2xl bg-[#394f5c] border border-white/20 space-y-2">
                  <span className="text-[10px] text-amber-300 font-mono">NODE A</span>
                  <h4 className="font-extrabold text-white text-sm">Easy Mondays Apparel</h4>
                  <p className="text-xs text-slate-300">Gives Hoodies → Gets Co-Working Space</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#394f5c] border border-white/20 space-y-2">
                  <span className="text-[10px] text-amber-300 font-mono">NODE B</span>
                  <h4 className="font-extrabold text-white text-sm">Montreal Creative</h4>
                  <p className="text-xs text-slate-300">Gives 4K Filming → Gets Hoodies</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#394f5c] border border-white/20 space-y-2">
                  <span className="text-[10px] text-amber-300 font-mono">NODE C</span>
                  <h4 className="font-extrabold text-white text-sm">Apex Co-Working Space</h4>
                  <p className="text-xs text-slate-300">Gives Office Space → Gets 4K Filming</p>
                </div>

                <div className="col-span-1 sm:col-span-3 text-center pt-4 font-mono text-xs text-amber-300">
                  🔄 Closed 3-Way Circuit • Total Value Unlocked: $25,500 CAD
                </div>
              </div>
            )}

            {activeLoopType === '4way' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center animate-in fade-in duration-300">
                <div className="p-4 rounded-xl bg-[#394f5c] border border-white/20 space-y-1">
                  <span className="text-[9px] text-amber-300 font-mono">NODE 1</span>
                  <h4 className="font-bold text-white text-xs">Apparel Brand</h4>
                  <p className="text-[11px] text-slate-300">Gives Merch</p>
                </div>

                <div className="p-4 rounded-xl bg-[#394f5c] border border-white/20 space-y-1">
                  <span className="text-[9px] text-amber-300 font-mono">NODE 2</span>
                  <h4 className="font-bold text-white text-xs">Media Agency</h4>
                  <p className="text-[11px] text-slate-300">Gives Video</p>
                </div>

                <div className="p-4 rounded-xl bg-[#394f5c] border border-white/20 space-y-1">
                  <span className="text-[9px] text-amber-300 font-mono">NODE 3</span>
                  <h4 className="font-bold text-white text-xs">Law Firm</h4>
                  <p className="text-[11px] text-slate-300">Gives Retainer</p>
                </div>

                <div className="p-4 rounded-xl bg-[#394f5c] border border-white/20 space-y-1">
                  <span className="text-[9px] text-amber-300 font-mono">NODE 4</span>
                  <h4 className="font-bold text-white text-xs">Logistics Fleet</h4>
                  <p className="text-[11px] text-slate-300">Gives Freight</p>
                </div>

                <div className="col-span-2 sm:col-span-4 text-center pt-4 font-mono text-xs text-amber-300">
                  🌐 Enterprise 4-Way Multi-Sig Settlement Ring
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* INTERACTIVE DEEP DEMO TERMINAL AT THE BOTTOM */}
      <section id="demo-terminal" className="py-20 px-6 bg-gradient-to-b from-[#384d59] via-[#324550] to-[#2b3c47] border-t border-white/10">
        <div className="max-w-[1300px] mx-auto space-y-8">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-amber-300 font-mono font-bold">
                <Bot className="w-4 h-4 text-amber-400" />
                <span>INTERACTIVE TRADE SIMULATOR</span>
              </div>
              <h3 className="text-2xl font-extrabold text-white">Test Autonomous Deal Execution</h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setDemoMode('2way')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${demoMode === '2way' ? 'bg-white text-[#334652]' : 'bg-white/10 text-white'}`}
              >
                2-Way Swap Mode
              </button>
              <button
                onClick={() => setDemoMode('3way')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${demoMode === '3way' ? 'bg-white text-[#334652]' : 'bg-white/10 text-white'}`}
              >
                3-Way Loop Mode
              </button>
            </div>
          </div>

          <div className="bg-[#2a3a43] border border-white/20 rounded-3xl p-6 space-y-6 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-slate-200">Session ID: <strong>DEAL-ROOM-B2B-LIVE</strong></span>
              </div>

              <span className="px-3 py-1 rounded-full text-[10px] font-mono bg-amber-400/10 text-amber-300 border border-amber-400/30">
                {demoStage === 'negotiating' ? 'ACTIVE NEGOTIATION' : demoStage === 'locked' ? '2-OF-2 MULTI-SIG LOCKED' : 'SETTLED ON SOLANA'}
              </span>
            </div>

            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-2 text-xs">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`p-3.5 rounded-2xl border ${
                  msg.sender.includes('Agent') 
                    ? 'bg-amber-400/10 border-amber-400/30 text-amber-200 font-mono' 
                    : 'bg-[#354854] border-white/10 text-slate-100'
                }`}>
                  <div className="text-[10px] text-slate-400 mb-1 font-bold">{msg.sender}</div>
                  <div>{msg.text}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
              <form onSubmit={handleSendMessage} className="flex gap-2 w-full sm:w-auto flex-1">
                <input
                  type="text"
                  placeholder="Type trade counter-offer or terms..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="flex-1 bg-[#354854] border border-white/20 rounded-full px-4 py-2 text-xs text-white focus:outline-none"
                />
                <Button type="submit" size="sm" className="bg-white text-[#334652] font-bold rounded-full px-4">
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>

              <button
                onClick={triggerAiNegotiator}
                disabled={agentThinking}
                className="w-full sm:w-auto px-6 py-2.5 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {agentThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4 text-amber-400" />}
                <span>{agentThinking ? 'AI Validating Loop...' : 'Trigger AI Loop Settlement'}</span>
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#24333b] py-8 px-6 text-xs text-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <strong className="text-white">TradeIt B2B Network</strong> • Reciprocal Barter & Circular Liquidity Engine
        </div>
        <div className="flex gap-6 font-medium">
          <Link href="/rwa" className="hover:text-white">RWA Tokenization</Link>
          <Link href="/pricing" className="hover:text-white">Pricing & Tiers</Link>
          <a href="https://explorer.solana.com" target="_blank" rel="noreferrer" className="hover:text-white">Solana Explorer ↗</a>
        </div>
      </footer>

      {/* MODALS */}
      <PitchUpload isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} onUploadSuccess={() => window.location.reload()} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onAuthSuccess={(email) => { setCurrentUser(email); setIsAuthOpen(false); }} />

    </div>
  );
}