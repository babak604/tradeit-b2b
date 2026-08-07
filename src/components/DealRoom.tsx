'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface DealData {
  dealId: string;
  currentUserId: string;
  buyerId: string;
  sellerId: string;
  status: string;
  buyerSigned: boolean;
  sellerSigned: boolean;
  amount: number;
}

interface DealProps {
  deal: DealData;
}

export default function DealRoom({ deal }: DealProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const supabase = createClient();

  const isBuyer = currentUserIdMatch(deal.currentUserId, deal.buyerId);
  const isSeller = currentUserIdMatch(deal.currentUserId, deal.sellerId);

  async function handleSign() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.rpc('sign_deal', {
        p_deal_id: deal.dealId,
        p_user_id: deal.currentUserId,
      });

      if (error) throw error;
      window.location.reload(); // Quick refresh to show updated deal status
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSettle() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.rpc('settle_deal', {
        p_deal_id: deal.dealId,
        p_releasing_user_id: deal.currentUserId,
      });

      if (error) throw error;
      window.location.reload();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Deal Room</h3>
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 uppercase">
          {deal.status}
        </span>
      </div>

      <div className="text-sm text-gray-600 space-y-1">
        <p>Deal Amount: <span className="font-semibold text-gray-900">${deal.amount}</span></p>
        <p>Buyer Signature: {deal.buyerSigned ? '✅ Signed' : '⏳ Pending'}</p>
        <p>Seller Signature: {deal.sellerSigned ? '✅ Signed' : '⏳ Pending'}</p>
      </div>

      {errorMsg && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
          {errorMsg}
        </div>
      )}

      <div className="flex space-x-3 pt-2">
        {deal.status === 'draft' && (
          <button
            onClick={handleSign}
            disabled={loading}
            className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Sign Deal'}
          </button>
        )}

        {deal.status === 'in_escrow' && (
          <button
            onClick={handleSettle}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Releasing Funds...' : 'Settle & Release Escrow'}
          </button>
        )}
      </div>
    </div>
  );
}

function currentUserIdMatch(id1: string, id2: string) {
  return id1 === id2;
}