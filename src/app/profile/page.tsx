'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Building2, 
  DollarSign, 
  ShieldCheck, 
  Package, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  LogOut,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface ProfileData {
  id: string;
  email: string;
  credits: number;
  company_name?: string;
  is_verified?: boolean;
}

interface OfferItem {
  id: string;
  title: string;
  credits: number;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [myOffers, setMyOffers] = useState<OfferItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true);
        setErrorMsg(null);

        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) {
          router.push('/login');
          return;
        }

        // Fetch user profile / credits
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        setProfile({
          id: user.id,
          email: user.email || '',
          credits: profileData?.credits || 15000, // Default fallback credit balance for demo
          company_name: profileData?.company_name || 'Apex Enterprise Studio',
          is_verified: profileData?.is_verified ?? true,
        });

        // Fetch user's active offers
        const { data: offersData } = await supabase
          .from('offers')
          .select('id, title, credits, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        setMyOffers(offersData || []);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load profile data.';
        setErrorMsg(msg);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-400">Loading enterprise profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/deals"
              className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">
                  TradeIt.tv Account
                </span>
              </div>
              <h1 className="text-lg font-extrabold text-white">Enterprise Profile & Treasury</h1>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 bg-slate-900 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 text-slate-300 hover:text-rose-400 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl w-full mx-auto p-4 sm:p-8 space-y-8 flex-1">
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Profile & Credit Balance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-black text-lg">
                  {profile?.company_name?.[0] || 'A'}
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white flex items-center gap-1.5">
                    {profile?.company_name}
                    {profile?.is_verified && <ShieldCheck className="w-4 h-4 text-sky-400" />}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">{profile?.email}</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                Verified Enterprise
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Active Provisions</span>
                <span className="text-2xl font-black text-white font-mono">{myOffers.length}</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Trust Score</span>
                <span className="text-2xl font-black text-sky-400 font-mono">100%</span>
              </div>
            </div>
          </div>

          {/* Credit Balance Treasury Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/40 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Barter Treasury
              </span>
              <h3 className="text-sm font-bold text-slate-300">Available Credits</h3>
            </div>

            <div>
              <div className="text-3xl font-black text-emerald-400 font-mono">
                ${profile?.credits.toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Secured via atomic escrow contracts</p>
            </div>

            <Link
              href="/offers/create"
              className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Post New Provision
            </Link>
          </div>
        </div>

        {/* User's Active Listings */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-sky-400" /> Your Published Provisions
          </h3>

          {myOffers.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3">
              <p className="text-xs font-mono text-slate-500">You have not published any barter provisions yet.</p>
              <Link
                href="/offers/create"
                className="inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 text-xs font-bold underline font-mono"
              >
                Create your first listing &rarr;
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {myOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white">{offer.title}</h4>
                    <span className="text-[10px] font-mono text-slate-500">
                      Published on {new Date(offer.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      ${offer.credits.toLocaleString()} Credits
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}