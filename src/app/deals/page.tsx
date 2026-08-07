'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Building2, Coins, ShieldCheck, FileText, ArrowRight, Plus, Clock, CheckCircle2, AlertCircle, Wallet } from 'lucide-react';
import Link from 'next/link';

interface Deal {
  id: string;
  party_a_id: string;
  party_b_id: string;
  credit_amount: number;
  status: 'proposed' | 'signed' | 'settled' | 'disputed';
  party_a_deliverable: string;
  party_b_deliverable: string;
  created_at: string;
  party_a: { name: string };
  party_b: { name: string };
}

export default function DealsDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'proposed' | 'signed' | 'settled'>('all');

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadDeals() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (!profile?.company_id) return;
        setCurrentCompanyId(profile.company_id);

        // Fetch deals where current company is party_a or party_b
        const { data: dealsData, error } = await supabase
          .from('deals')
          .select(`
            *,
            party_a:companies!party_a_id(name),
            party_b:companies!party_b_id(name)
          `)
          .or(`party_a_id.eq.${profile.company_id},party_b_id.eq.${profile.company_id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (dealsData) {
          setDeals(dealsData as any);
        }
      } catch (err) {
        console.error('Error loading deals:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDeals();
  }, [supabase, router]);

  const filteredDeals = deals.filter((deal) => {
    if (activeTab === 'all') return true;
    return deal.status === activeTab;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'proposed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[10px]">
            <Clock className="w-3 h-3" /> Proposed / Escrow Locked
          </span>
        );
      case 'signed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 font-mono text-[10px]">
            <ShieldCheck className="w-3 h-3" /> Signed & Active
          </span>
        );
      case 'settled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px]">
            <CheckCircle2 className="w-3 h-3" /> Settled
          </span>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[10px]">
            <AlertCircle className="w-3 h-3" /> Disputed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
      
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/marketplace" className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-sky-500/20">
              <ShieldCheck className="w-6 h-6 text-slate-950" />
            </Link>
            <div>
              <span className="text-lg font-black tracking-tight text-white">TradeIt<span className="text-sky-400">.tv</span></span>
              <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest">Deal Rooms Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <Link
              href="/marketplace"
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-all hidden sm:inline-block"
            >
              Directory
            </Link>
            <Link
              href="/treasury"
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-emerald-400 transition-all flex items-center gap-1.5"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Treasury</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        
        {/* Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-900 pb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-sky-400">
              <FileText className="w-4 h-4" />
              <span>Immutable Escrow Ledger</span>
            </div>
            <h1 className="text-3xl font-black text-white">Active & Past Deal Rooms</h1>
          </div>

          <Link
            href="/deals/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs font-mono transition-all shadow-lg shadow-emerald-500/15"
          >
            <Plus className="w-4 h-4" />
            <span>Initiate New Deal</span>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 font-mono text-xs overflow-x-auto pb-2">
          {(['all', 'proposed', 'signed', 'settled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl border transition-all capitalize whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-slate-900 border-sky-500 text-sky-400 font-bold shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {tab} Deals ({deals.filter(d => tab === 'all' || d.status === tab).length})
            </button>
          ))}
        </div>

        {/* Deal Cards List */}
        {loading ? (
          <div className="text-center py-20 font-mono text-xs text-slate-500">Loading deal rooms...</div>
        ) : filteredDeals.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 border border-slate-900 rounded-3xl space-y-3">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-mono text-slate-400">No deal rooms found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredDeals.map((deal) => {
              const isPartyA = deal.party_a_id === currentCompanyId;
              const partnerName = isPartyA ? deal.party_b?.name : deal.party_a?.name;
              const myDeliverable = isPartyA ? deal.party_a_deliverable : deal.party_b_deliverable;
              const theirDeliverable = isPartyA ? deal.party_b_deliverable : deal.party_a_deliverable;

              return (
                <div
                  key={deal.id}
                  className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 hover:border-slate-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(deal.status)}
                      <span className="text-xs font-mono text-slate-500">
                        ID: {deal.id.slice(0, 8)}...
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <Building2 className="w-4 h-4 text-sky-400" />
                      <span>Counterparty: {partnerName || 'Unknown Entity'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1">
                        <span className="font-mono text-[10px] text-slate-500 uppercase">Your Commitment</span>
                        <p className="text-slate-300 line-clamp-1">{myDeliverable}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1">
                        <span className="font-mono text-[10px] text-slate-500 uppercase">Their Commitment</span>
                        <p className="text-slate-300 line-clamp-1">{theirDeliverable}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-slate-800">
                    <div className="font-mono font-bold text-emerald-400 text-sm flex items-center gap-1.5">
                      <Coins className="w-4 h-4" />
                      {deal.credit_amount.toLocaleString()} CR
                    </div>

                    <Link
                      href={`/deals/${deal.id}`}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs font-mono transition-all flex items-center gap-2 group"
                    >
                      <span>Enter Deal Room</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}