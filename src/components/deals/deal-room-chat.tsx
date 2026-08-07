'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface ChatAttachment {
  name: string;
  url: string;
  type?: string;
}

export interface DealMessage {
  id: string;
  deal_id: string;
  sender_id: string;
  content: string;
  attachments?: ChatAttachment[];
  is_system_message?: boolean;
  created_at: string;
  sender?: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

interface DealRoomChatProps {
  dealId: string;
  currentUserId: string;
  initialMessages?: DealMessage[];
}

export function DealRoomChat({
  dealId,
  currentUserId,
  initialMessages = [],
}: DealRoomChatProps) {
  const [messages, setMessages] = useState<DealMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(initialMessages.length === 0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Helper to fetch sender profile information
  const resolveProfile = async (userId: string) => {
    if (!userId) return { full_name: 'System', email: 'system@platform.internal' };
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url')
        .eq('id', userId)
        .single();
      return data || { email: 'Unknown User' };
    } catch {
      return { email: 'Unknown User' };
    }
  };

  // Fetch initial chat history if not supplied via Server Component / SSR
  useEffect(() => {
    async function fetchChatHistory() {
      setIsLoading(true);
      const { data: rawMessages, error } = await supabase
        .from('deal_messages')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: true });

      if (error || !rawMessages) {
        setIsLoading(false);
        return;
      }

      const messagesWithProfiles = await Promise.all(
        rawMessages.map(async (msg) => {
          const sender = await resolveProfile(msg.sender_id);
          return { ...msg, sender };
        })
      );

      setMessages(messagesWithProfiles);
      setIsLoading(false);
      setTimeout(() => scrollToBottom('instant'), 100);
    }

    if (initialMessages.length === 0) {
      fetchChatHistory();
    } else {
      setTimeout(() => scrollToBottom('instant'), 100);
    }
  }, [dealId]);

  // Real-time Supabase subscription for new incoming messages
  useEffect(() => {
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
        async (payload) => {
          const incomingMsg = payload.new as DealMessage;

          // Avoid duplicate insertion if message was handled optimistically
          setMessages((prev) => {
            if (prev.some((m) => m.id === incomingMsg.id)) {
              return prev;
            }
            return prev;
          });

          const sender = await resolveProfile(incomingMsg.sender_id);
          const fullMsg = { ...incomingMsg, sender };

          setMessages((prev) => {
            if (prev.some((m) => m.id === incomingMsg.id)) {
              return prev.map((m) => (m.id === incomingMsg.id ? fullMsg : m));
            }
            return [...prev, fullMsg];
          });

          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId, supabase]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setNewMessage('');

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: DealMessage = {
      id: tempId,
      deal_id: dealId,
      sender_id: currentUserId,
      content: trimmed,
      is_system_message: false,
      created_at: new Date().toISOString(),
      sender: {
        full_name: 'You',
      },
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom();

    const { data, error } = await supabase
      .from('deal_messages')
      .insert({
        deal_id: dealId,
        sender_id: currentUserId,
        content: trimmed,
        is_system_message: false,
      })
      .select('*')
      .single();

    if (error) {
      // Revert optimistic update on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(trimmed);
    } else if (data) {
      // Swap temporary ID with DB record ID
      const sender = await resolveProfile(data.sender_id);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...data, sender } : m))
      );
    }

    setIsSending(false);
  };

  return (
    <div className="flex flex-col h-[620px] rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg text-slate-100">
      {/* Room Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="block h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white leading-none">
              Deal Negotiation Room
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Encrypted channel for counter-parties and escrow administrators
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider bg-slate-950 border border-slate-800 text-slate-400 px-2 py-1 rounded-md">
          Live Sync
        </span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500 animate-pulse">
            Connecting to secure room...
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="h-10 w-10 rounded-full bg-slate-800/60 border border-slate-700 flex items-center justify-center mb-3 text-slate-400 text-sm font-mono">
              💬
            </div>
            <p className="text-xs font-medium text-slate-300">
              No messages in this deal room yet.
            </p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
              Use this room to clarify terms, request inspection details, or communicate with the escrow officer.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            const isSystem = msg.is_system_message;

            if (isSystem) {
              return (
                <div
                  key={msg.id}
                  className="my-3 mx-auto max-w-[88%] rounded-lg border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-center text-xs text-amber-300/90"
                >
                  <span className="font-semibold uppercase text-[10px] tracking-wider block text-amber-400 mb-0.5">
                    Platform Notification
                  </span>
                  {msg.content}
                </div>
              );
            }

            const senderName =
              msg.sender?.full_name || msg.sender?.email || (isMe ? 'You' : 'Counterparty');

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {/* Sender Tag & Timestamp */}
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[11px] font-medium text-slate-400">
                    {isMe ? 'You' : senderName}
                  </span>
                  <time className="text-[10px] font-mono text-slate-600">
                    {new Date(msg.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {msg.content}

                  {/* Attachment Cards (if present) */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-1.5 pt-2 border-t border-slate-700/50">
                      {msg.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded bg-black/20 p-2 text-[11px] text-slate-200 hover:bg-black/40 transition-colors"
                        >
                          <span>📎</span>
                          <span className="truncate flex-1">{att.name}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="pt-3 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type message or specify terms..."
          disabled={isSending}
          className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isSending || !newMessage.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {isSending ? (
            'Sending...'
          ) : (
            <>
              Send
              <span className="text-[10px]">➔</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}