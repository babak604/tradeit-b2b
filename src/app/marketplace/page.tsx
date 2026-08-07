'use client';

import { useEffect, useState, useTransition, useActionState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createListingAction } from '@/app/actions/listings';
import {
  Building2,
  Coins,
  Search,
  Plus,
  ArrowRight,
  Tag,
  Sparkles,
  Wallet,
  X,
  Filter,
} from 'lucide-react';
import Link from 'next/link';

interface Listing {
  id: string;
  company_id: string;
  title: string;
  description: string;
  listing_type: 'offer' | 'need';
  category: string;
  estimated_value: number;
  created_at: string;
  companies: { name: string };
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'offer' | 'need'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [myCompanyId, setMyCompanyId] = useState<string | null>(null);

  const [formState, formAction, isPending] = useActionState(createListingAction, null);
  const supabase = createClient();

  const fetchDirectory = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      if (profile?.company_id) setMyCompanyId(profile.company_id);
    }

    const { data, error } = await supabase
      .from('user_listings')
      .select('*, companies!company_id(name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setListings(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDirectory();
  }, []);

  useEffect(() => {
    if (formState?.success) {
      setIsModalOpen(false);
      fetchDirectory();
    }
  }, [formState]);

  const filteredListings = listings.filter((item) => {
    const matchesType = filterType === 'all' || item.listing_type === filterType;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.companies?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/deals"
              className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-sky-500/20"
            >
              <Building2 className="w-5 h-5 text-slate-950" />
            </Link>
            <div>
              <span className="text-lg font-black tracking-tight text-white">
                TradeIt<span className="text-sky-400">.tv</span>
              </span>
              <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                Corporate Directory
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <Link
              href="/matchmaker"
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500 text-sky-400 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Radar</span>
            </Link>
            <Link
              href="/treasury"
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500 text-emerald-400 transition-all flex items-center gap-1.5"
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
            <h1 className="text-3xl font-black text-white">Corporate Inventory & Needs Directory</h1>
            <p className="text-xs font-mono text-slate-400">
              Browse verified corporate deliverables or broadcast your company&apos;s trade requirements.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs font-mono transition-all shadow-lg shadow-emerald-500/15"
          >
            <Plus className="w-4 h-4" />
            <span>Post Corporate Offer / Need</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search directory by keyword, company, or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-sans"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto font-mono text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 mr-1 hidden sm:inline" />
            {(['all', 'offer', 'need'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-xl border transition-all capitalize ${
                  filterType === type
                    ? 'bg-slate-900 border-sky-500 text-sky-400 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {type === 'all' ? 'All Items' : `${type}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Directory Grid */}
        {loading ? (
          <div className="text-center py-20 font-mono text-xs text-slate-500">
            Querying corporate directory index...
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 border border-slate-900 rounded-3xl space-y-2">
            <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-mono text-slate-400">No active listings match your current filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((item) => {
              const isMyListing = item.company_id === myCompanyId;
              const isOffer = item.listing_type === 'offer';

              return (
                <div
                  key={item.id}
                  className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 hover:border-slate-700 transition-all flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-mono text-[10px] uppercase font-bold border ${
                          isOffer
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                        }`}
                      >
                        {isOffer ? 'Offering Deliverable' : 'Seeking Requirement'}
                      </span>

                      <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-500" />
                        {item.category}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white leading-snug">{item.title}</h3>
                      <p className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-sky-400" />
                        <span>{item.companies?.name || 'Corporate Member'}</span>
                      </p>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                      {item.description}
                    </p>
                  </div>

                  {/* Footer Action Bar */}
                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="font-mono text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      <span>{Number(item.estimated_value).toLocaleString()} CR</span>
                    </div>

                    {!isMyListing ? (
                      <Link
                        href={`/deals/new?party_b_id=${item.company_id}&credits=${item.estimated_value}`}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold transition-all flex items-center gap-1.5 group"
                      >
                        <span>Propose Trade</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500 italic">Your Listing</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-8 space-y-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Post Directory Listing</h2>
              <p className="text-xs font-mono text-slate-400">
                Publish inventory, services, or resource needs to the marketplace.
              </p>
            </div>

            <form action={formAction} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  Listing Type
                </label>
                <select
                  name="listing_type"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                  required
                >
                  <option value="offer">Offering Deliverable / Inventory</option>
                  <option value="need">Seeking Corporate Requirement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g. 50 Hours Senior Cloud Architecture Consulting"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                  >
                    <option value="Services">Services</option>
                    <option value="Software">Software</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Advertising">Advertising</option>
                    <option value="Logistics">Logistics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Estimated Valuation (CR)
                  </label>
                  <input
                    type="number"
                    name="estimated_value"
                    placeholder="e.g. 10000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={4}
                  placeholder="Provide scope details, SLA specs, or inventory breakdown..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-sky-500 resize-none"
                  required
                />
              </div>

              {formState?.error && (
                <p className="text-rose-400 text-xs font-mono">{formState.error}</p>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/15 disabled:opacity-50"
                >
                  {isPending ? 'Publishing...' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}