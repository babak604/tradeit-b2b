import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Handshake, Wallet, PlusCircle, ArrowUpRight } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';

export async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let creditBalance = 0;

  if (user) {
    const { data: balanceData } = await supabase
      .from('user_balances')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    if (balanceData) {
      creditBalance = balanceData.credits;
    }
  }

  return (
    <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link href="/deals" className="flex items-center gap-2.5 font-black text-white text-base tracking-tight hover:opacity-90 transition-opacity">
          <div className="bg-sky-500/10 border border-sky-500/30 p-2 rounded-xl text-sky-400">
            <Handshake className="w-5 h-5" />
          </div>
          <span>TradeIt<span className="text-sky-400 font-mono text-xs ml-1">B2B</span></span>
        </Link>

        {/* Navigation Links */}
        {user && (
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/deals"
              className="px-3 py-2 text-xs font-mono font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition-all"
            >
              Deals
            </Link>
            
            <Link
              href="/wallet"
              className="px-3 py-2 text-xs font-mono font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition-all"
            >
              Wallet
            </Link>

            <Link
              href="/offers/create"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5 text-sky-400" /> Post Offer
            </Link>
          </nav>
        )}

        {/* User Balance, Notifications & Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Real-time Notification Bell */}
              <NotificationBell userId={user.id} />

              <Link
                href="/wallet"
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all"
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block leading-none">Balance</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    ${creditBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </Link>

              <Link
                href="/offers/create"
                className="sm:hidden bg-sky-500 hover:bg-sky-400 text-slate-950 p-2 rounded-xl transition-all"
              >
                <PlusCircle className="w-4 h-4" />
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1"
            >
              Sign In <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}