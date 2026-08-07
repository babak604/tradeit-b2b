'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface AuditLogMetadata {
  reason?: string;
  buyer_refund_pct?: number;
  seller_payout_pct?: number;
  evidence_count?: number;
  note?: string;
  [key: string]: any;
}

export interface AuditLog {
  id: string;
  deal_id: string;
  action: string;
  performed_by: string;
  metadata: AuditLogMetadata;
  created_at: string;
  performer?: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

interface AuditLogTimelineProps {
  dealId: string;
  initialLogs?: AuditLog[];
}

export function AuditLogTimeline({ dealId, initialLogs = [] }: AuditLogTimelineProps) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [isLoading, setIsLoading] = useState(initialLogs.length === 0);
  const supabase = createClient();

  // Helper to fetch user profiles for audit log performers
  const resolveProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url')
        .eq('id', userId)
        .single();
      return data || { email: 'System/Unknown' };
    } catch {
      return { email: 'System/Unknown' };
    }
  };

  // Fetch initial logs if not supplied via SSR
  useEffect(() => {
    async function fetchLogsWithProfiles() {
      setIsLoading(true);
      const { data: rawLogs, error } = await supabase
        .from('deal_audit_logs')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });

      if (error || !rawLogs) {
        setIsLoading(false);
        return;
      }

      const logsWithProfiles = await Promise.all(
        rawLogs.map(async (log) => {
          const performer = log.performed_by ? await resolveProfile(log.performed_by) : undefined;
          return { ...log, performer };
        })
      );

      setLogs(logsWithProfiles);
      setIsLoading(false);
    }

    if (initialLogs.length === 0) {
      fetchLogsWithProfiles();
    }
  }, [dealId]);

  // Real-time subscription to deal_audit_logs table
  useEffect(() => {
    const channel = supabase
      .channel(`audit_logs_${dealId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'deal_audit_logs',
          filter: `deal_id=eq.${dealId}`,
        },
        async (payload) => {
          const newLog = payload.new as AuditLog;
          const performer = newLog.performed_by ? await resolveProfile(newLog.performed_by) : undefined;
          const completeLog = { ...newLog, performer };

          setLogs((prev) => [completeLog, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId, supabase]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'DISPUTE_RESOLVED':
        return {
          label: 'Dispute Settled',
          color: 'border-purple-800/80 bg-purple-950/50 text-purple-300',
          dot: 'bg-purple-400',
        };
      case 'DISPUTE_RAISED':
        return {
          label: 'Dispute Raised',
          color: 'border-red-800/80 bg-red-950/50 text-red-300',
          dot: 'bg-red-500',
        };
      case 'EVIDENCE_SUBMITTED':
        return {
          label: 'Evidence Uploaded',
          color: 'border-blue-800/80 bg-blue-950/50 text-blue-300',
          dot: 'bg-blue-400',
        };
      case 'DEAL_CREATED':
        return {
          label: 'Escrow Initiated',
          color: 'border-emerald-800/80 bg-emerald-950/50 text-emerald-300',
          dot: 'bg-emerald-400',
        };
      case 'FUNDS_DEPOSITED':
        return {
          label: 'Funds Escrowed',
          color: 'border-amber-800/80 bg-amber-950/50 text-amber-300',
          dot: 'bg-amber-400',
        };
      default:
        return {
          label: action.replace(/_/g, ' '),
          color: 'border-slate-800 bg-slate-950 text-slate-400',
          dot: 'bg-slate-500',
        };
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-white">Immutable Audit Trail</h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
          Real-time Sync
        </span>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-500 animate-pulse">
          Loading audit logs...
        </div>
      ) : logs.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No audit history recorded for this deal yet.
        </div>
      ) : (
        <div className="relative border-l border-slate-800 ml-3 space-y-6">
          {logs.map((log) => {
            const badge = getActionBadge(log.action);
            const performerName =
              log.performer?.full_name || log.performer?.email || 'System Action';

            return (
              <div key={log.id} className="relative pl-6 group">
                {/* Timeline Node Icon */}
                <div
                  className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-slate-900 ${badge.dot}`}
                />

                <div className="space-y-1.5">
                  {/* Action Badge & Timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-xs font-medium text-slate-300">
                        {performerName}
                      </span>
                    </div>
                    <time className="text-[11px] font-mono text-slate-500">
                      {new Date(log.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </time>
                  </div>

                  {/* Metadata Custom Views */}
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="mt-2 rounded-lg border border-slate-800/80 bg-slate-950/60 p-3 text-xs space-y-2">
                      {/* Dispute Resolved Specific Layout */}
                      {log.action === 'DISPUTE_RESOLVED' && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-800/60 text-center font-mono">
                            <div className="bg-blue-950/40 border border-blue-900/40 rounded p-1.5">
                              <span className="text-[10px] text-blue-400 block">
                                Buyer Refund
                              </span>
                              <span className="text-sm font-bold text-blue-300">
                                {log.metadata.buyer_refund_pct}%
                              </span>
                            </div>
                            <div className="bg-emerald-950/40 border border-emerald-900/40 rounded p-1.5">
                              <span className="text-[10px] text-emerald-400 block">
                                Seller Payout
                              </span>
                              <span className="text-sm font-bold text-emerald-300">
                                {log.metadata.seller_payout_pct}%
                              </span>
                            </div>
                          </div>
                          {log.metadata.reason && (
                            <p className="text-slate-300 italic leading-relaxed">
                              &ldquo;{log.metadata.reason}&rdquo;
                            </p>
                          )}
                        </div>
                      )}

                      {/* Generic Metadata Key-Value Display */}
                      {log.action !== 'DISPUTE_RESOLVED' && (
                        <div className="space-y-1 font-mono text-[11px]">
                          {Object.entries(log.metadata).map(([key, value]) => (
                            <div key={key} className="flex justify-between gap-4">
                              <span className="text-slate-500 capitalize">
                                {key.replace(/_/g, ' ')}:
                              </span>
                              <span className="text-slate-300 truncate max-w-[240px]">
                                {typeof value === 'object'
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}