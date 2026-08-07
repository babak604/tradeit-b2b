import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { EscrowActionPanel } from '@/components/deals/EscrowActionPanel';
import { ChatFeed } from '@/components/chat/ChatFeed';
import { ChatInputForm } from '@/components/chat/ChatInputForm';
import { DealMessage } from '@/components/chat/ChatMessageBubble';
import { getDealAuditLogs } from '@/app/actions/audit';
import { AuditLogTimeline } from '@/components/deals/AuditLogTimeline';

interface PageProps {
  params: Promise<{ dealId: string }>;
}

export default async function DealPage({ params }: PageProps) {
  // 1. Next.js 15 requires awaiting params
  const { dealId } = await params;
  const supabase = await createClient();

  // 2. Authenticate session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 3. Resolve user's active company membership
  const { data: memberData } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .single();

  if (!memberData?.company_id) {
    redirect('/onboarding');
  }

  const userCompanyId = memberData.company_id;

  // 4. Parallel data fetching: Deal record, Chat Messages, and Audit Logs
  const [dealRes, messagesRes, auditRes] = await Promise.all([
    supabase
      .from('barter_deals')
      .select('*')
      .eq('id', dealId)
      .single(),
    supabase
      .from('deal_messages')
      .select(`
        id,
        deal_id,
        sender_company_id,
        content,
        attachments,
        created_at,
        sender_company:companies!sender_company_id (
          name,
          logo_url
        )
      `)
      .eq('deal_id', dealId)
      .order('created_at', { ascending: true }),
    getDealAuditLogs(dealId),
  ]);

  const deal = dealRes.data;

  if (!deal) {
    notFound();
  }

  // Security Gate: Ensure the user's company is part of this deal
  if (deal.company_a_id !== userCompanyId && deal.company_b_id !== userCompanyId) {
    notFound();
  }

  const messages = (messagesRes.data || []) as unknown as DealMessage[];
  const auditLogs = auditRes.logs || [];

  return (
    <div className="flex flex-col h-screen bg-slate-950 max-w-7xl mx-auto p-4 gap-4 overflow-hidden">
      {/* 1. Top Action Panel (Escrow State & Controls) */}
      <EscrowActionPanel deal={deal} currentCompanyId={userCompanyId} />

      {/* 2. Main Workspace: Chat Feed + Audit Log Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Left/Main Column: Chat Feed & Input */}
        <div className="lg:col-span-2 flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            <ChatFeed
              dealId={dealId}
              initialMessages={messages}
              currentCompanyId={userCompanyId}
            />
          </div>
          <div className="p-3 border-t border-slate-800 bg-slate-900/50">
            <ChatInputForm dealId={dealId} senderCompanyId={userCompanyId} />
          </div>
        </div>

        {/* Right Sidebar: Real-time Audit Trail */}
        <div className="hidden lg:block h-full overflow-y-auto border border-slate-800 rounded-lg bg-slate-900/40 p-2">
          <AuditLogTimeline dealId={dealId} initialLogs={auditLogs} />
        </div>
      </div>
    </div>
  );
}