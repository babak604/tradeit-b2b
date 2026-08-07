'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ChatMessageBubble, DealMessage } from './ChatMessageBubble';

interface ChatFeedProps {
  dealId: string;
  initialMessages: DealMessage[];
  currentCompanyId: string;
}

export function ChatFeed({ dealId, initialMessages, currentCompanyId }: ChatFeedProps) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll on initial load & when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [initialMessages]);

  // ⚡ Realtime Listener for new chat messages
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`deal_chat:${dealId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'deal_messages',
          filter: `deal_id=eq.${dealId}`,
        },
        () => {
          // Triggers Next.js Server Component re-fetch to load message + company join data
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId, router]);

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-slate-900/40 rounded-xl border border-slate-800 flex flex-col gap-3">
      {initialMessages.length === 0 ? (
        <div className="m-auto text-center text-slate-500 text-sm">
          No messages yet. Start the conversation or share inspection attachments below.
        </div>
      ) : (
        initialMessages.map((msg) => (
          <ChatMessageBubble
            key={msg.id}
            message={msg}
            currentCompanyId={currentCompanyId}
          />
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}