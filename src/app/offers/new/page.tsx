'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowLeft,
  Sparkles,
  DollarSign,
  Video,
  Tag,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Current User Company context fallback (Company A)
const CURRENT_COMPANY_ID = '11111111-1111-1111-1111-111111111111';

export default function NewOfferPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Marketing & Media');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [offeringSummary, setOfferingSummary] = useState('');
  const [lookingForSummary, setLookingForSummary] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title || !offeringSummary || !lookingForSummary || !estimatedValue) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    try {
      setSubmitting(true);

      // 1. Insert the new Trade Offer into Supabase
      const { data: offerData, error: dbError } = await supabase
        .from('trade_offers')
        .insert([
          {
            company_id: CURRENT_COMPANY_ID,
            title,
            category,
            estimated_value: parseFloat(estimatedValue),
            offering_summary: offeringSummary,
            looking_for_summary: lookingForSummary,
            video_url: videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-working-overtime-in-the-office-42828-large.mp4',
            status: 'active',
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      // 2. Trigger the /api/embed API route in the background for pgvector embeddings
      fetch('/api/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: offerData.id,
          offeringSummary: offerData.offering_summary,
          lookingForSummary: offerData.looking_for_summary,
        }),
      }).catch((embedErr: unknown) => {
        console.error('Background vector embedding failed:', embedErr);
      });

      // 3. Redirect back to homepage feed
      router.push('/');
    } catch (err: unknown) {
      console.error('Error creating offer:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to publish trade pitch.';
      setErrorMsg(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="border-b border-slate-800 pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Feed
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <h1 className="text-2xl font-extrabold text-white">Post New Barter Pitch</h1>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Publish your B2B offer and seeking parameters. Our AI engine vectorizes your input for reciprocal matching.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
          
          {/* Pitch Title */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-sky-400" /> Trade Offer Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Full-Service Video Production for SaaS UI Redesign"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Category & Estimated Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value="Marketing & Media">Marketing & Media</option>
                <option value="Software & Engineering">Software & Engineering</option>
                <option value="Legal & Advisory">Legal & Advisory</option>
                <option value="Design & Branding">Design & Branding</option>
                <option value="Hardware & Office Space">Hardware & Office Space</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Estimated Trade Value ($) *
              </label>
              <input
                type="number"
                required
                placeholder="10000"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          {/* Offering Summary */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-sky-400" /> What Your Company Offers *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe the high-value services, products, or ad space you are providing..."
              value={offeringSummary}
              onChange={(e) => setOfferingSummary(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Seeking / Looking For Summary */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> What You Want In Exchange *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe what services or products you are seeking in return..."
              value={lookingForSummary}
              onChange={(e) => setLookingForSummary(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Pitch Video URL */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-purple-400" /> Video Pitch MP4 URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 text-xs font-mono"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-sky-500/10 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Publishing & Auto-Vectorizing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" /> Publish Pitch & Activate Coincidence Radar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}