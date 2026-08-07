'use client';

import { useEffect, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { arbitrateDisputeAction } from '@/app/actions/disputes';
import {
  AlertTriangle,
  ShieldAlert,
  Coins,
  Building2,
  CheckCircle2,
  RotateCcw,
  ArrowLeft,
  Scale,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

interface DisputedDeal {
  id: string;
  credit_amount: number;
  status: string;
  dispute_reason: string;
  dispute_opened_at: string;
  party_a_deliverable: string;
  party_b_deliverable: string;
  party_a: { name: string };
  party_b: { name: string };
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<DisputedDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  const fetchDisputes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        party_a:companies!party_a_id(name),
        party_b:companies!party_b_id(name)
      `)
      .eq('status', 'disputed')
      .order('dispute_opened_at', { ascending: false });

    if (error) {
      setErrorMsg(error.message);
    } else if (data) {
      setDisputes(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolve = (dealId: string, resolution: 'refund' | 'release') => {
    const noteText = notes[dealId] || '';
    setErrorMsg(null);

    startTransition(async () => {
      const res = await arbitrateDisputeAction(dealId, resolution, noteText);
      if (res.success) {
        await fetchDisputes();
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-mono text-xs text-slate-500">
        Loading Disputed Escrow Queue...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-6">
          <Link
            href="/deals"
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Deals Dashboard</span>
          </Link>

          <span className="text-xs font-mono px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            Escrow Freeze Protocol Active
          </span>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Scale className="w-8 h-8 text-rose-400" />
            <span>Arbitration & Dispute Center</span>
          </h1>
          <p className="text-xs font-mono text-slate-400">
            Review contested deal rooms with frozen escrow reserves and issue binding settlements.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Empty State */}
        {disputes.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 border border-slate-900 rounded-3xl space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">No Disputed Escrow Cases Pending</h3>
            <p className="text-xs font-mono text-slate-500">All active deal rooms are operating smoothly without friction.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {disputes.map((dispute) => (
              <div
                key={dispute.id}
                className="bg-slate-900/60 border border-rose-500/30 rounded-3xl p-8 space-y-6"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-6 h-6 text-sky-400" />
                    <div>
                      <h2 className="text-base font-bold text-white">
                        {dispute.party_a?.name} ↔ {dispute.party_b?.name}
                      </h2>
                      <span className="text-xs font-mono text-slate-500">Deal ID: {dispute.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Escrow Frozen
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      {dispute.credit_amount?.toLocaleString()} CR
                    </span>
                  </div>
                </div>

                {/* Dispute Reason */}
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs space-y-1">
                  <span className="font-mono text-[10px] text-rose-400 uppercase tracking-wider block">
                    Filed Dispute Reason
                  </span>
                  <p className="text-rose-200">{dispute.dispute_reason}</p>
                </div>

                {/* Deliverables Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{dispute.party_a?.name} Deliverable</span>
                    <p className="text-xs text-slate-300">{dispute.party_a_deliverable}</p>
                  </div>
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{dispute.party_b?.name} Deliverable</span>
                    <p className="text-xs text-slate-300">{dispute.party_b_deliverable}</p>
                  </div>
                </div>

                {/* Arbitration Controls */}
                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-mono text-slate-400 uppercase">
                      Arbitration Resolution Notes
                    </label>
                    <input
                      type="text"
                      placeholder="Enter legal findings or reason for arbitration choice..."
                      value={notes[dispute.id] || ''}
                      onChange={(e) => setNotes({ ...notes, [dispute.id]: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-sans"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
                    <button
                      onClick={() => handleResolve(dispute.id, 'refund')}
                      disabled={isPending}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 font-mono text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Refund Escrow to Party A</span>
                    </button>

                    <button
                      onClick={() => handleResolve(dispute.id, 'release')}
                      disabled={isPending}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Force Release Escrow to Party B</span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}