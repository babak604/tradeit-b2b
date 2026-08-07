'use client'

import { useEffect, useState, useMemo, useTransition } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { FileText, Lock, CheckCircle2, History, Loader2, ShieldCheck, CheckSquare } from 'lucide-react'
import { signDealAction, settleDealAction } from '../../actions/deals'

type DealStatus = 'draft' | 'pending_signatures' | 'funded_in_escrow' | 'completed' | 'disputed'

type ActivityEvent = {
  id: string
  title: string
  timestamp: string
  type: 'system' | 'signature' | 'escrow'
}

const statusBadges: Record<DealStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
  pending_signatures: { label: 'Pending Signatures', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  funded_in_escrow: { label: 'Funded in Escrow', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  completed: { label: 'Settled & Completed', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  disputed: { label: 'In Dispute', className: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
}

export default function DealRoomClient({ initialDeal }: { initialDeal: any }) {
  const [deal, setDeal] = useState(initialDeal)
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)

  // Realtime activity log stream
  const [events, setEvents] = useState<ActivityEvent[]>([
    {
      id: '1',
      title: 'Deal initialized in draft mode',
      timestamp: new Date(initialDeal.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'system',
    },
  ])

  // Memoize browser client to avoid unnecessary re-subscriptions on re-renders
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  )

  useEffect(() => {
    const channel = supabase
      .channel(`deal:${deal.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'deals', filter: `id=eq.${deal.id}` },
        (payload) => {
          setDeal((prev: any) => ({ ...prev, ...payload.new }))

          // Append real-time status change event to audit trail
          const newStatus = payload.new.status as DealStatus
          setEvents((prevEvents) => [
            {
              id: crypto.randomUUID(),
              title: `Status changed to ${statusBadges[newStatus]?.label || newStatus}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: newStatus === 'funded_in_escrow' ? 'signature' : 'system',
            },
            ...prevEvents,
          ])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [deal.id, supabase])

  // Execute sign deal action
  const handleSignAndLock = () => {
    setActionError(null)
    startTransition(async () => {
      const res = await signDealAction(deal.id)
      if (!res.success) {
        setActionError(res.error || 'Failed to sign deal.')
      }
    })
  }

  // Execute settle deal action
  const handleSettleDeal = () => {
    setActionError(null)
    startTransition(async () => {
      const res = await settleDealAction(deal.id)
      if (!res.success) {
        setActionError(res.error || 'Failed to settle deal.')
      }
    })
  }

  const currentBadge = statusBadges[deal.status as DealStatus] || statusBadges.draft

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-10 font-sans">
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{deal.offers?.title || deal.title || 'Untitled Deal'}</h1>
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${currentBadge.className}`}>
              {currentBadge.label}
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">Escrow ID: {deal.id}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-left md:text-right">
            <div className="text-xs text-zinc-400">Total Escrow Value</div>
            <div className="text-xl font-mono font-bold text-emerald-400">
              {Number(deal.value_credits || deal.amount || 0).toLocaleString()} Credits
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Deal Details & Terms */}
        <section className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-zinc-400" /> Contract Terms
            </h2>
            <div className="prose prose-invert text-sm text-zinc-300 leading-relaxed">
              {deal.terms || 'No contract terms specified.'}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-zinc-400" /> Escrow Assets & Deliverables
            </h2>
            {deal.status === 'funded_in_escrow' ? (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Escrow activated. Credits are locked in escrow until the offer deliverable is accepted.</span>
              </div>
            ) : deal.status === 'completed' ? (
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm flex items-center gap-3">
                <CheckSquare className="w-5 h-5 text-blue-400 shrink-0" />
                <span>Deal settled successfully. Credits released to counterparty.</span>
              </div>
            ) : (
              <p className="text-sm text-zinc-400">
                Deliverables will appear here once the contract is signed and funds are locked into escrow.
              </p>
            )}
          </div>

          {/* Activity Audit Trail */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-zinc-200">
              <History className="w-5 h-5 text-zinc-400" /> Audit Trail
            </h2>
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="flex justify-between items-center text-sm py-2 border-b border-zinc-800/60 last:border-0">
                  <span className="text-zinc-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {event.title}
                  </span>
                  <span className="text-xs font-mono text-zinc-500">{event.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Counterparty & Actions Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">
              Counterparties
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Initiator</span>
                <span className="font-medium text-zinc-200">{deal.initiator_id || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Receiver</span>
                <span className="font-medium text-zinc-200">{deal.receiver_id || 'Unassigned'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">
              Escrow Control Panel
            </h3>

            {actionError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded mb-4 border border-rose-500/20">
                {actionError}
              </p>
            )}

            {/* Action Buttons Depending on Deal Status */}
            {deal.status === 'pending_signatures' || deal.status === 'draft' ? (
              <button
                onClick={handleSignAndLock}
                disabled={isPending}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign & Lock Contract
              </button>
            ) : deal.status === 'funded_in_escrow' ? (
              <button
                onClick={handleSettleDeal}
                disabled={isPending}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Release Funds & Settle Deal
              </button>
            ) : (
              <button
                disabled
                className="w-full py-2.5 px-4 bg-zinc-800 text-zinc-500 text-sm font-medium rounded-lg cursor-not-allowed"
              >
                Deal Settled & Closed
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}