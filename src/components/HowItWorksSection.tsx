'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, Video, Cpu, GitFork, Bot, ShieldCheck, 
  ArrowRight, CheckCircle2, Zap, FileText, ArrowLeftRight, Lock
} from 'lucide-react';

export default function HowItWorksSection() {
  return (
    <section className="mt-20 pt-16 border-t border-slate-900 space-y-16">
      
      {/* Section Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-950/60 border border-red-500/30 rounded-full text-red-400 text-xs font-bold font-mono">
          <Zap className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <span>PROPRIETARY ZERO-CASH ENGINE</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          How TradeIt AI Works
        </h2>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Transform unbilled capacity, inventory, and idle assets into real vendor purchasing power in four autonomous steps.
        </p>
      </div>

      {/* 4 Visual Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
        
        {/* Step 1: Intelligent Ingestion */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 hover:border-red-500/40 rounded-3xl p-8 space-y-6 transition-all duration-300 group shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-black font-mono text-slate-700 group-hover:text-red-500 transition-colors">
              01
            </span>
            <div className="p-3 bg-red-600/10 rounded-2xl border border-red-500/20 text-red-400">
              <Video className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">1. Post Offer & Need (AI Ingestion)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload a 60-second video pitch or text description. OpenAI speech-to-text extracts offer values, cataloging terms into high-dimensional vector embeddings.
            </p>
          </div>

          {/* Interactive UI Visual Mockup */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 font-mono text-[11px]">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-900 pb-2">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Cpu className="w-3.5 h-3.5" /> Vector Engine
              </span>
              <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400">1536-dim Embedding</span>
            </div>
            <div className="space-y-1.5">
              <p className="text-slate-300"><span className="text-slate-500">Offer:</span> "250 Units Organic Cotton Apparel"</p>
              <p className="text-slate-300"><span className="text-slate-500">Need:</span> "4K Studio Video Reels & Editing"</p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500/30 text-emerald-400 rounded text-[9px] font-bold">
                Auto-Cataloged
              </span>
              <span className="px-2 py-0.5 bg-slate-900 text-slate-400 rounded text-[9px]">
                Est. $8,500 CAD
              </span>
            </div>
          </div>
        </div>

        {/* Step 2: 3-Way Loop Graph Traversal */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 hover:border-red-500/40 rounded-3xl p-8 space-y-6 transition-all duration-300 group shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-black font-mono text-slate-700 group-hover:text-red-500 transition-colors">
              02
            </span>
            <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20 text-blue-400">
              <GitFork className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">2. 3-Way Loop Graph Match</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our graph traversal engine scans database state vectors to discover closed 3-way barter circuits ($A \rightarrow B \rightarrow C \rightarrow A$), eliminating the need for direct 2-way matches.
            </p>
          </div>

          {/* Interactive UI Visual Mockup */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 font-mono text-[11px]">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <span className="text-blue-400 font-bold flex items-center gap-1.5">
                <ArrowLeftRight className="w-3.5 h-3.5" /> Closed Graph Circuit
              </span>
              <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 text-[10px]">
                98% Parity Score
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <p className="font-bold text-white">Retail Brand</p>
                <p className="text-slate-500 text-[9px]">Apparel Stock</p>
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <p className="font-bold text-white">Video Studio</p>
                <p className="text-slate-500 text-[9px]">4K Production</p>
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <p className="font-bold text-white">Tech Hub</p>
                <p className="text-slate-500 text-[9px]">Office Space</p>
              </div>
            </div>
            <p className="text-center text-emerald-400 text-[10px] font-bold">
              ✓ Unlocks $18,500 CAD Zero-Cash Circuit
            </p>
          </div>
        </div>

        {/* Step 3: Autonomous AI Negotiator */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 hover:border-red-500/40 rounded-3xl p-8 space-y-6 transition-all duration-300 group shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-black font-mono text-slate-700 group-hover:text-red-500 transition-colors">
              03
            </span>
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-400">
              <Bot className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">3. Autonomous AI Negotiator</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Delegate negotiations to an autonomous LLM agent configured with private company rules (target valuation, delivery deadlines, auto-sign parameters).
            </p>
          </div>

          {/* Interactive UI Visual Mockup */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 font-mono text-[11px]">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" /> Agent Active
              </span>
              <span className="text-slate-500 text-[10px]">Policy: Balanced</span>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-xl border border-red-500/30 text-red-200 text-[10px]">
              🤖 [AI Agent]: Counter-proposal generated: Adding 10 bonus merch hoodies to align 100% value parity. Term accepted.
            </div>
          </div>
        </div>

        {/* Step 4: AI Escrow & Legal Vault */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 hover:border-red-500/40 rounded-3xl p-8 space-y-6 transition-all duration-300 group shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-black font-mono text-slate-700 group-hover:text-red-500 transition-colors">
              04
            </span>
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">4. AI Escrow Audit & Legal Vault</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              When deliverables are submitted (repo links, documents, footage proofs), our AI Escrow Auditor cross-verifies fulfillment against contract specs to release milestones automatically.
            </p>
          </div>

          {/* Interactive UI Visual Mockup */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 font-mono text-[11px]">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Escrow Verified
              </span>
              <span className="text-emerald-400 text-[10px] font-bold">100% Scope Match</span>
            </div>
            <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl text-[10px]">
              <span className="text-slate-300 flex items-center gap-1">
                <FileText className="w-3 h-3 text-slate-400" /> Contract_Executed.pdf
              </span>
              <span className="text-emerald-400 font-bold">PDF Ready ✓</span>
            </div>
          </div>
        </div>

      </div>

      {/* Modern High-Converting Call To Action Card */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-950 border-2 border-red-500/50 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
        
        <div className="max-w-2xl mx-auto space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600/20 border border-red-500/30 text-red-400 rounded-full text-xs font-bold font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>0% TRANSACTION COMMISSIONS</span>
          </div>
          <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
            Ready to Unlock Cashless Liquidity?
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Join verified businesses trading excess stock, workspace, and services. One closed barter swap pays for your entire annual membership pass.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
          <Link href="/pricing">
            <Button className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm px-8 h-12 rounded-xl shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all">
              <span>Choose Your Membership Pass</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-full sm:w-auto px-6 h-12 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-800 cursor-pointer transition-all"
          >
            Try Live Interactive Demo
          </button>
        </div>

      </div>

    </section>
  );
}