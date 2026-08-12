'use client';

import { useState } from 'react';
import { Sparkles, Bot, Scale, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ParityMeter({ 
  valueA, 
  valueB, 
  onAddSweetener 
}: { 
  valueA: number; 
  valueB: number; 
  onAddSweetener?: (item: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const diff = Math.abs(valueA - valueB);
  const parityPercentage = Math.min(100, Math.round((Math.min(valueA, valueB) / Math.max(valueA, valueB)) * 100));

  const handleSuggestSweetener = async () => {
    setLoading(true);
    // Simulating AI policy sweetener lookup
    setTimeout(() => {
      if (onAddSweetener) {
        onAddSweetener(`Add $${diff.toLocaleString()} CAD in 10 Bonus Hours Post-Editing`);
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 font-sans">
      <div className="flex items-center justify-between text-xs">
        <span className="font-extrabold text-white flex items-center gap-1.5">
          <Scale className="w-4 h-4 text-amber-400" />
          Trade Valuation Parity
        </span>
        <span className={`font-mono font-bold text-xs ${parityPercentage >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
          {parityPercentage}% Balanced
        </span>
      </div>

      {/* Visual Parity Meter Bar */}
      <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
        <div 
          className={`h-full transition-all duration-500 ${parityPercentage >= 90 ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-red-500'}`}
          style={{ width: `${parityPercentage}%` }}
        />
      </div>

      {/* Sweetener AI Assist Trigger */}
      {parityPercentage < 95 && (
        <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-xs">
          <p className="text-slate-400 text-[11px]">
            Value gap: <strong className="text-white">${diff.toLocaleString()} CAD</strong>
          </p>
          <Button
            size="sm"
            onClick={handleSuggestSweetener}
            disabled={loading}
            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold h-7 px-2.5 cursor-pointer flex items-center gap-1"
          >
            <Bot className="w-3 h-3 text-amber-400" />
            <span>{loading ? 'Calculating...' : 'AI Add Sweetener'}</span>
          </Button>
        </div>
      )}
    </div>
  );
}