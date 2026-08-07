'use client';

import { useState } from 'react';
import { lockTradeEscrowAction, settleTradeEscrowAction } from '../app/actions/trades';

interface TradeEscrowCardProps {
  testCompanyId?: string;
  testTradeId?: string;
}

export function TradeEscrowCard({
  testCompanyId = '11111111-1111-1111-1111-111111111111',
  testTradeId = '22222222-2222-2222-2222-222222222222',
}: TradeEscrowCardProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('IDLE');
  const [message, setMessage] = useState<string | null>(null);

  async function handleLockEscrow() {
    setLoading(true);
    setMessage(null);

    // Call server action to lock 5,000 credits for a simulated trade
    const res = await lockTradeEscrowAction(testCompanyId, testTradeId, 5000);

    setLoading(false);
    if (res.success) {
      setStatus('ESCROW_LOCKED');
      setMessage('✅ 5,000 Credits successfully locked into escrow!');
    } else {
      setMessage(`❌ Error: ${res.error}`);
    }
  }

  async function handleSettleTrade() {
    setLoading(true);
    setMessage(null);

    // Call server action to release escrowed credits
    const res = await settleTradeEscrowAction(testTradeId);

    setLoading(false);
    if (res.success) {
      setStatus('COMPLETED');
      setMessage('🎉 Trade settled! Escrow released to seller.');
    } else {
      setMessage(`❌ Error: ${res.error}`);
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto my-8 bg-zinc-900 border border-zinc-800 rounded-xl text-white shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg text-zinc-100">Trade Contract Simulation</h3>
        <span className="px-2.5 py-1 text-xs font-mono rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
          {status}
        </span>
      </div>

      <div className="space-y-3 text-sm text-zinc-400 mb-6">
        <p><strong className="text-zinc-200">Contract Amount:</strong> 5,000 T-CREDITS</p>
        <p><strong className="text-zinc-200">Buyer ID:</strong> {testCompanyId.slice(0, 8)}...</p>
      </div>

      {message && (
        <div className="p-3 mb-4 text-xs font-mono rounded bg-zinc-800/80 border border-zinc-700/50 text-zinc-200">
          {message}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleLockEscrow}
          disabled={loading || status === 'ESCROW_LOCKED' || status === 'COMPLETED'}
          className="flex-1 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-medium transition-colors"
        >
          1. Lock Escrow (5k)
        </button>

        <button
          onClick={handleSettleTrade}
          disabled={loading || status !== 'ESCROW_LOCKED'}
          className="flex-1 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-medium transition-colors"
        >
          2. Settle & Release
        </button>
      </div>
    </div>
  );
}