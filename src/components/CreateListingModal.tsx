'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createListingAction } from '@/app/actions/listings';

interface CreateListingModalProps {
  onListingCreated?: () => void;
}

const CATEGORIES = [
  'Software & SaaS',
  'Marketing & Media',
  'Legal & Professional Services',
  'Logistics & Warehousing',
  'Hardware & Equipment',
  'Office & Real Estate',
];

export default function CreateListingModal({ onListingCreated }: CreateListingModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure portal only renders on the client side
  useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    credit_value: 5000,
    listing_type: 'OFFER' as 'OFFER' | 'WANT',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await createListingAction({
        user_id: '00000000-0000-0000-0000-000000000001',
        title: formData.title,
        description: formData.description,
        category: formData.category,
        credit_value: Number(formData.credit_value),
        type: formData.listing_type,
        status: 'ACTIVE',
      });

      if (result?.error) {
        setError(result.error);
      } else {
        setIsOpen(false);
        setFormData({
          title: '',
          description: '',
          category: CATEGORIES[0],
          credit_value: 5000,
          listing_type: 'OFFER',
        });
        if (onListingCreated) onListingCreated();
      }
    } catch (err: any) {
      console.error('Failed to create listing:', err);
      setError('An unexpected error occurred while saving the listing.');
    } finally {
      setLoading(false);
    }
  };

  const modalMarkup = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Post New Barter Listing</h3>
            <p className="text-xs text-slate-400">Offer assets or request needed services</p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Compact Form */}
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          {error && (
            <div className="rounded-md bg-rose-500/10 border border-rose-500/20 p-2 text-xs text-rose-400">
              ⚠️ {error}
            </div>
          )}

          {/* Type Toggle */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300">Listing Type</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, listing_type: 'OFFER' })}
                className={`rounded-lg py-1.5 text-xs font-semibold transition border ${
                  formData.listing_type === 'OFFER'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                }`}
              >
                📦 Offering
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, listing_type: 'WANT' })}
                className={`rounded-lg py-1.5 text-xs font-semibold transition border ${
                  formData.listing_type === 'WANT'
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                }`}
              >
                🔍 Requesting
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300">Title</label>
            <input
              type="text"
              required
              placeholder="e.g. 50 Hours Full-Stack Dev"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Category & Valuation Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300">
                Valuation (Credits)
              </label>
              <input
                type="number"
                required
                min="100"
                step="100"
                value={formData.credit_value}
                onChange={(e) =>
                  setFormData({ ...formData, credit_value: Number(e.target.value) })
                }
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300">Description</label>
            <textarea
              rows={2}
              required
              placeholder="Provide brief scope or deliverables..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Trigger Button inside top nav */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-indigo-500 active:scale-95"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create Trade Listing
      </button>

      {/* Render Modal directly into document.body to escape header styling constraints */}
      {isOpen && mounted ? createPortal(modalMarkup, document.body) : null}
    </>
  );
}