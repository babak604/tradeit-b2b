'use client';

import { useActionState, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createDealProposalAction } from '@/app/actions/create-deal-proposal';
import { ArrowLeft, Building2, Coins, FileText, Handshake, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface Company {
  id: string;
  name: string;
}

export default function NewDealPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  const [state, formAction, isPending] = useActionState(createDealProposalAction, null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Get user's company ID to exclude it from target counterparties
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        const myCompanyId = profile?.company_id;

        let query = supabase.from('companies').select('id, name').order('name', { ascending: true });
        if (myCompanyId) {
          query = query.neq('id', myCompanyId);
        }

        const { data } = await query;
        if (data) setCompanies(data);
      } catch (err) {
        console.error('Error fetching companies:', err);
      } finally {
        setLoadingCompanies(false);
      }
    }

    fetchCompanies();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-6">
          <Link
            href="/deals"
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel & Back to Deals</span>
          </Link>
          <span className="text-xs font-mono px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Escrow Protected
          </span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Handshake className="w-8 h-8 text-sky-400" />
            <span>Initiate Bilateral Barter Proposal</span>
          </h1>
          <p className="text-xs font-mono text-slate-400">
            Define mutual commitments and lock escrow credit terms for counterparty review.
          </p>
        </div>

        {/* Form */}
        <form action={formAction} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-6">
          {/* Counterparty Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-400" />
              <span>Target Counterparty Company</span>
            </label>
            <select
              name="party_b_id"
              defaultValue=""
              disabled={loadingCompanies}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-sky-500 font-sans"
              required
            >
              <option value="" disabled>
                {loadingCompanies ? 'Loading active directory...' : 'Select counterparty entity...'}
              </option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            {state?.fieldErrors?.party_b_id && (
              <p className="text-rose-400 text-xs font-mono mt-1">{state.fieldErrors.party_b_id[0]}</p>
            )}
          </div>

          {/* Credit Amount */}
          <div className="space-y-2">
            <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>Escrow Valuation (Credits)</span>
            </label>
            <input
              type="number"
              name="credit_amount"
              step="100"
              min="0"
              placeholder="e.g. 5000"
              defaultValue="0"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              required
            />
            {state?.fieldErrors?.credit_amount && (
              <p className="text-rose-400 text-xs font-mono mt-1">{state.fieldErrors.credit_amount[0]}</p>
            )}
          </div>

          {/* Deliverables Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Your Commitment (Party A)</span>
              </label>
              <textarea
                name="party_a_deliverable"
                rows={4}
                placeholder="Describe services, inventory, or deliverables your firm will provide..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 focus:outline-none focus:border-sky-500 font-sans resize-none"
                required
              />
              {state?.fieldErrors?.party_a_deliverable && (
                <p className="text-rose-400 text-xs font-mono mt-1">{state.fieldErrors.party_a_deliverable[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Their Commitment (Party B)</span>
              </label>
              <textarea
                name="party_b_deliverable"
                rows={4}
                placeholder="Describe required return deliverables from the counterparty..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-sans resize-none"
                required
              />
              {state?.fieldErrors?.party_b_deliverable && (
                <p className="text-rose-400 text-xs font-mono mt-1">{state.fieldErrors.party_b_deliverable[0]}</p>
              )}
            </div>
          </div>

          {state?.error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono rounded-xl">
              {state.error}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={isPending}
              className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isPending ? 'Publishing Proposal...' : 'Submit & Create Deal Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}