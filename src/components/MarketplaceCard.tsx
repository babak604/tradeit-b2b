// src/components/MarketplaceCard.tsx
'use client';

import { useState } from 'react';
import { ProposeBarterModal } from './ProposeBarterModal';

export interface Offer {
  id: string;
  title: string;
  category: string;
  type: 'OFFERING' | 'WANTED';
  credits: number;
  companyName: string;
  user_id?: string; // ID of the company/user receiving the proposal
}

export function MarketplaceCard({ offer }: { offer: Offer }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg transition-all hover:border-blue-500/50 hover:shadow-blue-500/10">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                offer.type === 'OFFERING'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {offer.type}
            </span>
            <span className="text-xs text-slate-400">{offer.category}</span>
          </div>

          <h3 className="mt-3 text-lg font-bold text-white line-clamp-2">
            {offer.title}
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            Posted by <span className="text-slate-200">{offer.companyName}</span>
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-4">
          <div>
            <span className="block text-xs text-slate-500">Value</span>
            <span className="text-base font-extrabold text-emerald-400">
              {offer.credits.toLocaleString()} Credits
            </span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Propose Barter
          </button>
        </div>
      </div>

      <ProposeBarterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        offer={{
          id: offer.id,
          title: offer.title,
          credits: offer.credits,
          user_id: offer.user_id || '',
        }}
      />
    </>
  );
}