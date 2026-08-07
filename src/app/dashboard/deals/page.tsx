'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DealsDashboardPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // New deal form state
  const [newTitle, setNewTitle] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch deals and companies on mount
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      
      // Fetch deals with company relation
      const { data: dealsData, error: dealsErr } = await supabase
        .from('barter_deals')
        .select('*, companies(name, email)')
        .order('created_at', { ascending: false });

      if (dealsErr) throw dealsErr;
      setDeals(dealsData || []);

      // Fetch companies for dropdown selection when creating new deals
      const { data: compData, error: compErr } = await supabase
        .from('companies')
        .select('*');

      if (compErr) throw compErr;
      setCompanies(compData || []);
      if (compData && compData.length > 0) {
        setSelectedCompanyId(compData[0].id);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDeal(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle || !selectedCompanyId) return;

    try {
      setCreating(true);
      setErrorMsg(null);

      const { data, error } = await supabase
        .from('barter_deals')
        .insert({
          title: newTitle,
          company_id: selectedCompanyId,
          status: 'active',
        })
        .select('*, companies(name, email)')
        .single();

      if (error) throw error;

      setDeals([data, ...deals]);
      setNewTitle('');
      setSuccessMsg('Barter deal created successfully.');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCreating(false);
    }
  }

  const statusColors: Record<string, string> = {
    active: 'bg-blue-100 text-blue-800 border-blue-200',
    disputed: 'bg-amber-100 text-amber-800 border-amber-200',
    settled: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-600">
        Loading dashboard...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">B2B Barter Deals & Escrow</h1>
            <p className="text-sm text-gray-600 mt-1">Manage trade agreements, monitor active disputes, and review arbitration outcomes.</p>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 text-sm text-red-700 rounded">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 text-sm text-emerald-700 rounded">
            {successMsg}
          </div>
        )}

        {/* Create Deal Card */}
        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Initialize New Barter Deal</h2>
          <form onSubmit={handleCreateDeal} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Deal Title / Description</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Q3 Software for Logistics Exchange"
                required
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Counterparty Company</label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:ring-blue-500 focus:border-blue-500"
              >
                {companies.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name} ({comp.email || 'No email'})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium px-4 py-2 rounded-md shadow-sm transition"
              >
                {creating ? 'Creating...' : 'Create Deal'}
              </button>
            </div>
          </form>
        </div>

        {/* Deals Table List */}
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Active Agreements ({deals.length})</h2>
          </div>

          {deals.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No barter deals found in the registry.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-6 py-3">Deal Title</th>
                    <th className="px-6 py-3">Company</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Created</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {deals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-900">{deal.title || 'Unnamed Agreement'}</td>
                      <td className="px-6 py-4 text-gray-600">{deal.companies?.name || 'Unknown Company'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 text-xs font-semibold uppercase rounded-full border ${statusColors[deal.status] || 'bg-gray-100 text-gray-800'}`}>
                          {deal.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{new Date(deal.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/deals/${deal.id}`}
                          className="text-blue-600 hover:text-blue-900 font-medium text-xs bg-blue-50 px-3 py-1.5 rounded border border-blue-200 transition"
                        >
                          Open Workspace &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}