'use client';

import { useEffect, useState, useRef, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendDealMessageAction } from '@/app/actions/messages';
import { MessageSquare, Send, Building2, Sparkles, UserCheck } from 'lucide-react';

interface ChatMessage {
  id: string;
  deal_id: string;
  sender_id: string;
  company_id: string;
  content: string;
  created_at: string;
  companies?: { name: string };
  profiles?: { full_name: string };
}

export default function DealChatSidebar({ dealId }: { dealId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchInitialMessages = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setCurrentUserId(user.id);
    }

    const { data, error } = await supabase
      .from('deal_messages')
      .select('*, companies!company_id(name), profiles!sender_id(full_name)')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as any);
    }
    setLoading(false);
    setTimeout(scrollToBottom, 100);
  };

  useEffect(() => {
    fetchInitialMessages();

    // Subscribe to Realtime postgres_changes
    const channel = supabase
      .channel(`deal_room_${dealId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'deal_messages',
          filter: `deal_id=eq.${dealId}`,
        },
        async (payload) => {
          // Fetch full row with company and profile relations
          const { data } = await supabase
            .from('deal_messages')
            .select('*, companies!company_id(name), profiles!sender_id(full_name)')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data as any]);
            setTimeout(scrollToBottom, 50);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const messageToSend = inputText;
    setInputText('');
    setErrorMsg(null);

    startTransition(async () => {
      const res = await sendDealMessageAction(dealId, messageToSend);
      if (res.error) {
        setErrorMsg(res.error);
        setInputText(messageToSend);
      }
    });
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl h-[600px] flex flex-col justify-between overflow-hidden shadow-xl">
      {/* Sidebar Header */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-bold text-white">Deal Negotiation Chat</h3>
        </div>
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Realtime Active
        </span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-xs">
        {loading ? (
          <div className="text-center py-10 font-mono text-slate-500 text-[11px]">
            Connecting to negotiation channel...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Sparkles className="w-6 h-6 text-slate-600 mx-auto" />
            <p className="text-slate-400 font-mono text-[11px]">
              No messages logged. Send a note to initiate conversation with counterparty.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;

            return (
              <div
                key={msg.id}
                className={`flex flex-col space-y-1 ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 px-1">
                  <Building2 className="w-3 h-3 text-sky-400" />
                  <span className="font-bold text-slate-300">
                    {msg.companies?.name || 'Counterparty'}
                  </span>
                  <span>&bull;</span>
                  <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? 'bg-sky-500 text-slate-950 font-medium rounded-tr-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {errorMsg && (
        <div className="px-4 py-2 bg-rose-500/10 border-t border-rose-500/20 text-rose-400 text-[10px] font-mono">
          {errorMsg}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          placeholder="Type message to counterparty..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isPending}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-sans"
        />

        <button
          type="submit"
          disabled={isPending || !inputText.trim()}
          className="p-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl transition-all disabled:opacity-50 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}