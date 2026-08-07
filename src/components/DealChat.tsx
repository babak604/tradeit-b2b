// src/components/DealChat.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendMessageAction, fetchDealMessagesAction } from '@/app/actions/messages';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface Message {
  id: string;
  deal_id: string;
  sender_id: string;
  content: string;
  is_system: boolean;
  created_at: string;
}

export function DealChat({ dealId }: { dealId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const supabase = createClient();

    // Initial fetch
    async function initChat() {
      const res = await fetchDealMessagesAction(dealId);
      if (res.success) {
        setMessages(res.messages);
        setCurrentUserId(res.currentUserId || null);
      }
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }

    initChat();

    // Subscribe to Realtime updates on this specific deal
    const channel = supabase
      .channel(`deal_chat_${dealId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'deal_messages',
          filter: `deal_id=eq.${dealId}`,
        },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          if (payload.new) {
            const newMessage = payload.new as Message;
            setMessages((prev) => {
              // Prevent duplicate append if local state already has it
              if (prev.some((m) => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
            setTimeout(scrollToBottom, 50);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const text = input;
    setInput(''); // Optimistic reset

    const res = await sendMessageAction({ dealId, content: text });
    if (!res.success) {
      alert(res.error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading negotiation thread...</div>;
  }

  return (
    <div className="flex flex-col h-[520px] rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-800 px-5 py-3.5 bg-slate-950/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <h3 className="text-sm font-semibold text-white">Live Deal Room</h3>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Encrypted & Audited</span>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          if (msg.is_system) {
            return (
              <div key={msg.id} className="text-center my-2">
                <span className="inline-block rounded-full bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-400">
                  {msg.content}
                </span>
              </div>
            );
          }

          const isMe = msg.sender_id === currentUserId;

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-md ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/50'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <span
                  className={`mt-1 block text-[9px] ${
                    isMe ? 'text-blue-200' : 'text-slate-400'
                  } text-right`}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="border-t border-slate-800 bg-slate-950 p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Discuss deliverables, revisions, or timeline..."
          className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500"
        >
          Send
        </button>
      </form>
    </div>
  );
}