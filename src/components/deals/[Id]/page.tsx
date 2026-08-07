import { createClient } from '@/lib/supabase/server'; // Server-side Supabase client helper
import { notFound, redirect } from 'next/navigation';
import { EscrowActionPanel } from '@/components/deals/EscrowActionPanel';
import { ChatMessageBubble, DealMessage } from '@/components/chat/ChatMessageBubble';
import { ChatInputForm } from '@/components/chat/ChatInputForm';

interface PageProps {
  params: Promise<{ dealId: string }>;
}

export default async function DealPage({ params }: PageProps) {
  // 1. Next.js 16 requires awaiting params
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

  // 4. Fetch deal record (using barter_deals table matching schema)
  const { data: deal } = await supabase
    .from('barter_deals')
    .select('*')
    .eq('id', dealId)
    .single();

  if (!deal) {
    notFound();
  }

  // Security Gate: Ensure the user's company is actually part of this deal
  if (deal.company_a_id !== userCompanyId && deal.company_b_id !== userCompanyId) {
    notFound();
  }

  // 5. Fetch deal chat messages with company metadata
  const { data: rawMessages } = await supabase
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
    .order('created_at', { ascending: true });

  const messages = (rawMessages || []) as unknown as DealMessage[];

  return (
    <div className="flex flex-col h-screen bg-slate-950 max-w-5xl mx-auto p-4 gap-4">
      {/* 1. Top Action Panel (Escrow State & Controls) */}
      <EscrowActionPanel deal={deal} currentCompanyId={userCompanyId} />

      {/* 2. Chat Feed */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-900/40 rounded-xl border border-slate-800 flex flex-col">
        {messages.length === 0 ? (
          <div className="m-auto text-center text-slate-500 text-sm">
            No messages yet. Start the conversation or share inspection attachments below.
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} currentCompanyId={userCompanyId} />
          ))
        )}
      </div>

      {/* 3. Bottom Input (Text + Media Attachments) */}
      <ChatInputForm dealId={dealId} senderCompanyId={userCompanyId} />
    </div>
  );
}