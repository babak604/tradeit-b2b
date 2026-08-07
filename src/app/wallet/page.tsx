import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { 
  Wallet, 
  Lock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  ShieldCheck,
  TrendingUp 
} from 'lucide-react';

export interface CreditTransaction {
  id: string;
  deal_id: string | null;
  sender_id: string | null;
  receiver_id: string | null;
  amount: number;
  transaction_type: 'ESCROW_LOCK' | 'SETTLEMENT_TRANSFER' | 'REFUND' | 'DEPOSIT';
  created_at: string;
}

export default async function WalletPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 1. Fetch User Balances (Handles case where row doesn't exist yet gracefully)
  const { data: balance } = await supabase
    .from('user_balances')
    .select('available_credits, escrow_credits')
    .eq('user_id', user.id)
    .maybeSingle();

  const available = balance?.available_credits || 0;
  const escrow = balance?.escrow_credits || 0;
  const total = available + escrow;

  // 2. Fetch Credit Transaction Audit History
  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('*')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Wallet className="w-6 h-6 text-sky-400" /> Credit Ledger Wallet
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Real-time audit log of available capital and active escrow holds.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-mono">
            <ShieldCheck className="w-4 h-4" /> Double-Entry Verified
          </div>
        </div>

        {/* Balance Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Available Credits */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Available Credits
            </span>
            <div className="text-3xl font-black text-emerald-400 font-mono">
              ${available.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500">Unencumbered balance for new proposals</p>
          </div>

          {/* Locked Escrow Credits */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" /> Locked in Escrow
            </span>
            <div className="text-3xl font-black text-amber-400 font-mono">
              ${escrow.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500">Committed to active deal rooms</p>
          </div>

          {/* Total Account Value */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Total Valuation</span>
            <div className="text-3xl font-black text-white font-mono">
              ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500">Available + Escrow aggregate</p>
          </div>

        </div>

        {/* Transaction History Log */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-sky-400" /> Ledger Transaction History
            </h2>
            <span className="text-[10px] font-mono text-slate-500">Immutable Records</span>
          </div>

          {!transactions || transactions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-mono">
              No ledger transactions recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {transactions.map((tx: CreditTransaction) => {
                const isOutbound = tx.sender_id === user.id;
                const isEscrowLock = tx.transaction_type === 'ESCROW_LOCK';

                return (
                  <div key={tx.id} className="py-3.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl border ${
                        isEscrowLock
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          : isOutbound
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      }`}>
                        {isEscrowLock ? (
                          <Lock className="w-4 h-4" />
                        ) : isOutbound ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="font-mono font-bold text-slate-200">
                          {tx.transaction_type.replace('_', ' ')}
                        </div>
                        {tx.deal_id && (
                          <div className="text-[10px] font-mono text-slate-500">
                            Deal #{tx.deal_id.slice(0, 8)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`font-mono font-bold ${
                        isEscrowLock
                          ? 'text-amber-400'
                          : isOutbound
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}>
                        {isOutbound ? '-' : '+'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}