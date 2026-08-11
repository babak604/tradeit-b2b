'use client';

import { useState } from 'react';
import { Play, RefreshCw, Bot, FileText, Sparkles, CheckCircle2 } from 'lucide-react';

interface DemoStoryControllerProps {
  onRunTwoWayDemo: () => void;
  onRunThreeWayDemo: () => void;
  onRunAiNegotiatorDemo: () => void;
}

export default function DemoStoryController({
  onRunTwoWayDemo,
  onRunThreeWayDemo,
  onRunAiNegotiatorDemo,
}: DemoStoryControllerProps) {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  return (
    <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-950 border border-red-500/40 p-4 rounded-3xl shadow-2xl space-y-3">
      
      {/* Header Badge */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-red-500 animate-pulse" />
          <h3 className="text-xs font-black text-white uppercase tracking-wider">
            INVESTOR & PRODUCT DEMO CONTROLLER
          </h3>
        </div>
        <span className="bg-red-600 text-white text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full shadow-lg">
          Demo Mode Active
        </span>
      </div>

      {/* Scenario Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-bold">
        
        {/* Scenario 1 */}
        <button
          onClick={() => {
            setActiveScenario('2-way');
            onRunTwoWayDemo();
          }}
          className={`p-2.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
            activeScenario === '2-way'
              ? 'bg-red-600 text-white border-red-400 shadow-lg shadow-red-600/30'
              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2 text-left">
            <Play className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div>
              <p className="line-clamp-1">1. Direct 2-Way Swap</p>
              <p className="text-[9px] text-slate-400 font-normal font-mono">Retail Apparel ↔ Video Studio</p>
            </div>
          </div>
          {activeScenario === '2-way' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
        </button>

        {/* Scenario 2 */}
        <button
          onClick={() => {
            setActiveScenario('3-way');
            onRunThreeWayDemo();
          }}
          className={`p-2.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
            activeScenario === '3-way'
              ? 'bg-red-600 text-white border-red-400 shadow-lg shadow-red-600/30'
              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2 text-left">
            <RefreshCw className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <div>
              <p className="line-clamp-1">2. 3-Way Circular Loop</p>
              <p className="text-[9px] text-slate-400 font-normal font-mono">$18.5k CAD Unlocked Circuit</p>
            </div>
          </div>
          {activeScenario === '3-way' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
        </button>

        {/* Scenario 3 */}
        <button
          onClick={() => {
            setActiveScenario('ai-agent');
            onRunAiNegotiatorDemo();
          }}
          className={`p-2.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
            activeScenario === 'ai-agent'
              ? 'bg-red-600 text-white border-red-400 shadow-lg shadow-red-600/30'
              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2 text-left">
            <Bot className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div>
              <p className="line-clamp-1">3. AI Agent Auto-Deal</p>
              <p className="text-[9px] text-slate-400 font-normal font-mono">Live LLM Barter Negotiation</p>
            </div>
          </div>
          {activeScenario === 'ai-agent' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
        </button>

      </div>
    </div>
  );
}