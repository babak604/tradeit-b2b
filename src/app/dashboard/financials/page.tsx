'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  Wallet,
  TrendingUp,
  Scale,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Clock,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';

interface AccountBalance {
  id: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'escrow' | 'revenue' | 'expense';
  balance: number;
  currency: string;
}

interface LedgerEntry {
  id: string;
  transaction_id: string;
  deal_id?: string;
  debit_account_name: string;
  credit_account_name: string;
  amount: number;
  currency: string;
  memo: string;
  created_at: string;
}

export default function FinancialDashboardPage() {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  const [companyName, setCompanyName] = useState<string>('');
  const [accounts, setAccounts] = useState<AccountBalance[]>([]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFinancialData() {
      try {
        setLoading(true);

        // 1. Fetch user company membership
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: member } = await supabase
          .from('company_members')
          .select('company_id, companies(name)')
          .eq('user_id', user.id)
          .single();

        if (!member) return;
        const companyId = member.company_id;
        
        // Handle joined company record safely
        const comp = Array.isArray(member.companies) ? member.companies[0] : member.companies;
        if (comp?.name) setCompanyName(comp.name);

        // 2. Fetch Chart of Accounts & Balances
        const { data: acctData } = await supabase
          .from('ledger_accounts')
          .select('id, account_name, account_type, balance, currency')
          .eq('company_id', companyId);

        if (acctData) setAccounts(acctData as AccountBalance[]);

        // 3. Fetch Recent Double-Entry Ledger Entries
        const { data: ledgerData } = await supabase
          .from('ledger_entries')
          .select(`
            id,
            transaction_id,
            amount,
            currency,
            memo,
            created_at,
            debit_account:debit_account_id(account_name),
            credit_account:credit_account_id(account_name)
          `)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (ledgerData) {
          const formattedEntries: LedgerEntry[] = ledgerData.map((e: any) => ({
            id: e.id,
            transaction_id: e.transaction_id,
            debit_account_name: e.debit_account?.account_name || 'Debit Account',
            credit_account_name: e.credit_account?.account_name || 'Credit Account',
            amount: e.amount,
            currency: e.currency,
            memo: e.memo,
            created_at: e.created_at,
          }));
          setEntries(formattedEntries);
        }
      } catch (err) {
        console.error('Failed to load financial dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadFinancialData();
  }, [supabase]);

  // Aggregate Category Totals
  const totalAssets = accounts
    .filter((a) => a.account_type === 'asset')
    .reduce((sum, a) => sum + Number(a.balance), 0);

  const totalEscrow = accounts
    .filter((a) => a.account_type === 'escrow')
    .reduce((sum, a) => sum + Number(a.balance), 0);

  const totalRevenue = accounts
    .filter((a) => a.account_type === 'revenue')
    .reduce((sum, a) => sum + Number(a.balance), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-400">Loading company double-entry ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-400" />
              <h1 className="text-xl font-extrabold text-white">
                {companyName || 'Company'} Financial Ledger
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Double-Entry Accounting & Escrow Balance Audit
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-xl text-xs font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Real-time Double-Entry Integrity
            </span>
          </div>
        </div>

        {/* High-Level Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Card 1: Total Liquid Assets */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Total Operating Assets
              </span>
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-white">
              ${totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500">
              Settled funds across operating bank & cash accounts
            </p>
          </div>

          {/* Card 2: Escrow Funds Locked */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Locked Escrow Balances
              </span>
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-amber-400">
              ${totalEscrow.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500">
              Active bilateral deal holds pending completion or settlement
            </p>
          </div>

          {/* Card 3: Settled Marketplace Revenue */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Realized Revenue
              </span>
              <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-white">
              ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500">
              Total released trade value from completed deals
            </p>
          </div>

        </div>

        {/* Chart of Accounts Grid */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <FileSpreadsheet className="w-4 h-4 text-sky-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Chart of Accounts (Sub-Ledgers)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {accounts.map((acct) => (
              <div
                key={acct.id}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">{acct.account_name}</span>
                  <span className="text-[10px] font-mono capitalize px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {acct.account_type}
                  </span>
                </div>
                <div className="text-lg font-mono font-bold text-white">
                  ${Number(acct.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log: Double-Entry Transactions */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Double-Entry Transaction Audit Trail
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Immutable SQL Journal</span>
          </div>

          {entries.length === 0 ? (
            <div className="text-center py-12 text-xs font-mono text-slate-500">
              No double-entry transactions recorded in this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400">
                    <th className="pb-3 font-semibold">Timestamp</th>
                    <th className="pb-3 font-semibold">Transaction ID</th>
                    <th className="pb-3 font-semibold">Debit Account (+)</th>
                    <th className="pb-3 font-semibold">Credit Account (-)</th>
                    <th className="pb-3 font-semibold">Memo</th>
                    <th className="pb-3 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-950/50 transition-colors">
                      <td className="py-3 text-slate-400">
                        {new Date(entry.created_at).toLocaleDateString()} {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 text-slate-500">
                        #{entry.transaction_id.slice(0, 8)}
                      </td>
                      <td className="py-3 text-emerald-400 flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        {entry.debit_account_name}
                      </td>
                      <td className="py-3 text-sky-400">
                        <div className="flex items-center gap-1">
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          {entry.credit_account_name}
                        </div>
                      </td>
                      <td className="py-3 text-slate-300 max-w-xs truncate">
                        {entry.memo}
                      </td>
                      <td className="py-3 text-right font-bold text-white">
                        ${Number(entry.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}