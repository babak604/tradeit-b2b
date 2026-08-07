'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Handshake, 
  ShieldCheck, 
  DollarSign, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

function CreateDealForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const offerId = searchParams.get('offerId');
  const companyId = searchParams.get('companyId');

  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  const [offerTitle, setOfferTitle] = useState('');
  const [offerValue, setOfferValue] = useState<number>(10000);
  const [terms, setTerms] = useState('Standard escrow barter agreement. Both parties agree to deliver scoped services within 14 business days.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOfferDetails() {
      if (!offerId) return;
      try {
        const { data, error } = await supabase
          .from('trade_offers')
          .select('title, estimated_value, offering_summary')
          .eq('id', offerId)
          .single();

        if (!error && data) {
          setOfferTitle(data.title);
          setOfferValue(data.estimated_value || 10000);
          setTerms(`Barter exchange for: ${data.offering_summary}`);
        }
      } catch (err: unknown) {
        console.warn('Could not fetch offer details for proposal:', err);
      }
    }

    fetchOfferDetails();
  }, [offerId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerId) {
      setErrorMsg('Missing target offer ID for proposal.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('You must be logged in to propose a deal.');
      }

      const payload = {
        offer_id: offerId,
        initiator_id: user.id,
        receiver_id: companyId || user.id, // Fallback if companyId maps directly
        terms: terms.trim(),
        value_credits: offerValue,
        status: 'pending_signatures',
      };

      const { data, error } = await supabase
        .from('deals')
        .insert(payload)
        .select('id')
        .single();

      if (error) throw error;

      router.push(`/deals/${data.id}`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create deal proposal.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">
                  TradeIt.tv Secure Escrow
                </span>
              </div>
              <h1 className="text-lg font-extrabold text-white">Initialize Barter Proposal</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-8 flex-1">
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Target Provision</span>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Handshake className="w-5 h-5 text-sky-400" /> {offerTitle || 'Selected Enterprise Provision'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Valuation</span>
              <div className="text-lg font-black text-emerald-400 font-mono flex items-center gap-1">
                <DollarSign className="w-4 h-4" /> {offerValue.toLocaleString()} Credits
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Escrow Security</span>
              <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5 pt-1">
                <ShieldCheck className="w-4 h-4" /> Atomic RLS Locking Enabled
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Contract Terms & Deliverable Scope
            </label>
            <textarea
              required
              rows={5}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-sky-500/20 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Opening Secure Deal Room...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Open Deal Room & Propose Terms
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function CreateDealPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs font-mono text-slate-400 animate-pulse">
        Loading proposal form...
      </div>
    }>
      <CreateDealForm />
    </Suspense>
  );
}