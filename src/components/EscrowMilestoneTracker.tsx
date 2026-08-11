'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, Clock, AlertTriangle, ShieldCheck, Flag, Lock 
} from 'lucide-react';

interface Milestone {
  id: number;
  title: string;
  partyAApproved: boolean;
  partyBApproved: boolean;
}

export default function EscrowMilestoneTracker({ dealId }: { dealId: string }) {
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: 1, title: 'Phase 1: Project Scope & Specs Confirmation', partyAApproved: true, partyBApproved: true },
    { id: 2, title: 'Phase 2: Deliverable Exchange & Retail/Service Handover', partyAApproved: true, partyBApproved: false },
    { id: 3, title: 'Phase 3: Final Acceptance & Contract Fulfillment', partyAApproved: false, partyBApproved: false },
  ]);

  const [disputed, setDisputed] = useState(false);

  const toggleApproval = (milestoneId: number, party: 'partyA' | 'partyB') => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id === milestoneId) {
          return {
            ...m,
            [party === 'partyA' ? 'partyAApproved' : 'partyBApproved']: !m[party === 'partyA' ? 'partyAApproved' : 'partyBApproved'],
          };
        }
        return m;
      })
    );
  };

  const completedCount = milestones.filter((m) => m.partyAApproved && m.partyBApproved).length;
  const progressPercent = Math.round((completedCount / milestones.length) * 100);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4 text-xs">
      
      {/* Header & Escrow Status */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-900">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h4 className="font-extrabold text-white">ESCROW MILESTONE TRACKER</h4>
        </div>

        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
          disputed 
            ? 'bg-red-950 text-red-400 border-red-500/40' 
            : 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
        }`}>
          {disputed ? 'Escrow Paused (Dispute Active)' : `${progressPercent}% Fulfilled`}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
          <div 
            className={`h-full transition-all duration-300 ${disputed ? 'bg-red-500' : 'bg-emerald-500'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-500 font-mono text-right">{completedCount} of 3 Milestones Cleared</p>
      </div>

      {/* Milestone List */}
      <div className="space-y-2">
        {milestones.map((m) => {
          const isFullyCleared = m.partyAApproved && m.partyBApproved;

          return (
            <div 
              key={m.id} 
              className={`p-3 rounded-xl border transition-all ${
                isFullyCleared 
                  ? 'bg-slate-900/80 border-emerald-500/30' 
                  : 'bg-slate-900/30 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  {isFullyCleared ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                  {m.title}
                </span>
              </div>

              {/* Dual Approval Checkboxes */}
              <div className="flex items-center gap-4 mt-2.5 pt-2 border-t border-slate-800/60 text-[11px]">
                <button
                  onClick={() => toggleApproval(m.id, 'partyA')}
                  disabled={disputed}
                  className={`flex items-center gap-1 font-mono transition-colors cursor-pointer ${
                    m.partyAApproved ? 'text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span className={`w-3 h-3 rounded border flex items-center justify-center text-[8px] ${
                    m.partyAApproved ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black' : 'border-slate-700'
                  }`}>✓</span>
                  Party A Clearance
                </button>

                <button
                  onClick={() => toggleApproval(m.id, 'partyB')}
                  disabled={disputed}
                  className={`flex items-center gap-1 font-mono transition-colors cursor-pointer ${
                    m.partyBApproved ? 'text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span className={`w-3 h-3 rounded border flex items-center justify-center text-[8px] ${
                    m.partyBApproved ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black' : 'border-slate-700'
                  }`}>✓</span>
                  Party B Clearance
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dispute Resolution Toggle */}
      <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
        <button
          onClick={() => setDisputed(!disputed)}
          className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
        >
          <Flag className="w-3 h-3" />
          <span>{disputed ? 'Resolve & Resume Escrow' : 'Flag Delivery Dispute'}</span>
        </button>

        <span className="text-[10px] text-slate-500 flex items-center gap-1">
          <Lock className="w-3 h-3" /> Immutable Escrow Ledger
        </span>
      </div>

    </div>
  );
}