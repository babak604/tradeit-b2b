'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Building2, Save, ShieldCheck, Wallet, ArrowLeft, Loader2, Key } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [email, setEmail] = useState('');
  const [balance, setBalance] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setEmail(user.email || '');

        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (!profile?.company_id) return;
        setCompanyId(profile.company_id);

        const { data: company } = await supabase
          .from('companies')
          .select('name, logo_url, credit_balance')
          .eq('id', profile.company_id)
          .single();

        if (company) {
          setCompanyName(company.name || '');
          setLogoUrl(company.logo_url || '');
          setBalance(company.credit_balance || 0);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: companyName.trim(),
          logo_url: logoUrl.trim() || null,
        })
        .eq('id', companyId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Company profile updated successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update company profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/marketplace"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-sky-400 mb-1">
                <Building2 className="w-4 h-4" />
                <span>Entity Configuration</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white">Company Profile & Settings</h1>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-400">
            <Wallet className="w-4 h-4" />
            <span>Balance: {balance.toLocaleString()} CR</span>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl border font-mono text-xs ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Form Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="space-y-1 pb-4 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white font-mono">Entity Details</h2>
            <p className="text-xs text-slate-400 font-mono">Update how your company appears across the TradeIt.tv network.</p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400">Company Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400">Work Email (User)</label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-500 font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400">Company Logo / Avatar URL</label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Immutable Entity ID (UUID)
              </label>
              <input
                type="text"
                disabled
                value={companyId}
                className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl px-4 py-3 text-xs text-slate-500 font-mono cursor-not-allowed select-all"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm font-mono transition-all shadow-lg shadow-emerald-500/15 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Company Settings</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}