'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { deleteListing, updateListingStatus } from '@/app/actions/listings';

interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  credit_value: number;
  type: 'OFFER' | 'WANT';
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED';
  created_at: string;
}

interface UserListingsProps {
  refreshKey?: number;
  selectedListingId?: string;
  onSelectForMatching?: (id: string, title: string) => void;
}

const DEV_MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';

export default function UserListings({
  refreshKey,
  selectedListingId,
  onSelectForMatching,
}: UserListingsProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_listings')
        .select('*')
        .eq('user_id', DEV_MOCK_USER_ID)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Listings fetch error:', error.message);
      } else {
        setListings(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch user listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [refreshKey]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    const res = await deleteListing(id);
    if (!res.error) {
      setListings((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'PENDING' : 'ACTIVE';
    const res = await updateListingStatus(id, nextStatus as any);
    if (!res.error) {
      setListings((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: nextStatus as any } : item))
      );
    }
  };

  return (
    <div className="w-full rounded-xl border border-slate-800 bg-slate-950 p-6 text-slate-100 shadow-lg">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white">Your Active Trade Listings</h3>
          <p className="text-xs text-slate-400">Manage assets you offer or requested items</p>
        </div>
        <button
          onClick={fetchListings}
          disabled={loading}
          className="text-xs font-medium text-slate-400 hover:text-indigo-400 transition"
        >
          {loading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      {/* Grid List */}
      {loading && listings.length === 0 ? (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 rounded-lg border border-slate-800 bg-slate-900/50 animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-slate-800 p-6 text-center">
          <p className="text-sm text-slate-400">No active trade listings found. Create one above to get started.</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {listings.map((item) => {
            const isSelected = selectedListingId === item.id;

            return (
              <div
                key={item.id}
                className={`rounded-lg border p-4 transition ${
                  isSelected
                    ? 'border-indigo-500 bg-slate-900 ring-1 ring-indigo-500/50'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        item.type === 'OFFER'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}
                    >
                      {item.type}
                    </span>
                    <h4 className="mt-1.5 text-sm font-bold text-white leading-snug">{item.title}</h4>
                  </div>

                  <span className="text-xs font-extrabold text-indigo-300 whitespace-nowrap">
                    {Number(item.credit_value).toLocaleString()} CR
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-400 line-clamp-2">{item.description}</p>

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-500">{item.category}</span>
                  <div className="flex items-center gap-2">
                    {onSelectForMatching && (
                      <button
                        onClick={() => onSelectForMatching(item.id, item.title)}
                        className={`text-[11px] font-semibold transition px-2 py-0.5 rounded ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'
                        }`}
                      >
                        {isSelected ? '⚡ Active Match' : '⚡ Run AI Match'}
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleStatus(item.id, item.status)}
                      className="text-[11px] text-slate-400 hover:text-amber-400 transition"
                    >
                      {item.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-[11px] text-slate-500 hover:text-rose-400 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}