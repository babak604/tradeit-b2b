'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChatMessageBubble, DealMessage } from './ChatMessageBubble';
import { ChatAttachmentUploader, AttachmentMeta } from './ChatAttachmentUploader';
import { Send, Loader2, X } from 'lucide-react';

interface DealChatRoomProps {
  dealId: string;
  currentCompanyId: string;
  initialMessages: DealMessage[];
}

export function DealChatRoom({ dealId, currentCompanyId, initialMessages }: DealChatRoomProps) {
  const [messages, setMessages] = useState<DealMessage[]>(initialMessages);
  const [content, setContent] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<AttachmentMeta[]>([]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to real-time message insertions for this deal room
  useEffect(() => {
    const channel = supabase
      .channel(`deal-chat-${dealId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'deal_messages',
          filter: `deal_id=eq.${dealId}`,
        },
        async (payload: { new: DealMessage }) => {
          const newMessage = payload.new as DealMessage;
          
          // Fetch associated sender company info if not present
          if (!newMessage.sender_company) {
            const { data: companyData } = await supabase
              .from('companies')
              .select('name, logo_url')
              .eq('id', newMessage.sender_company_id)
              .single();
            
            if (companyData) {
              newMessage.sender_company = companyData;
            }
          }

          setMessages((prev) => {
            // Avoid duplicate appends if optimistic UI already added it
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId, supabase]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && pendingAttachments.length === 0) || sending) return;

    setSending(true);

    try {
      const response = await fetch(`/api/deals/${dealId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          attachments: pendingAttachments,
          sender_company_id: currentCompanyId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message.');
      }

      // Append successfully sent message immediately
      if (data.data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.data.id)) return prev;
          return [...prev, data.data];
        });
      }

      setContent('');
      setPendingAttachments([]);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[650px] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200">
            Secure Deal Negotiation Room
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-500">ID: {dealId.slice(0, 8)}...</span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 font-mono text-xs">
            <p>No negotiation messages or inspection documents uploaded yet.</p>
            <p className="mt-1 text-[10px] text-slate-600">Start the conversation or attach asset documentation below.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} currentCompanyId={currentCompanyId} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Staging Area */}
      {pendingAttachments.length > 0 && (
        <div className="px-4 py-2.5 bg-slate-900/60 border-t border-slate-800/80 flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-mono uppercase text-slate-400 mr-2">Attached Files:</span>
          {pendingAttachments.map((att, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-slate-900 border border-slate-700/60 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-200">
              <span className="truncate max-w-[140px]">{att.name}</span>
              <button
                type="button"
                onClick={() => setPendingAttachments(prev => prev.filter((_, i) => i !== idx))}
                className="text-slate-400 hover:text-rose-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Form Bar */}
      <form onSubmit={handleSendMessage} className="p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-3">
        <ChatAttachmentUploader
          dealId={dealId}
          onUploadComplete={(newAtt) => setPendingAttachments(prev => [...prev, newAtt])}
          disabled={sending}
        />

        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type message, counter-terms, or inspection notes..."
          className="flex-1 bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 rounded-xl px-4 py-3 font-mono focus:outline-none focus:border-sky-500 transition-colors"
        />

        <button
          type="submit"
          disabled={sending || (!content.trim() && pendingAttachments.length === 0)}
          className="bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 font-bold p-3 rounded-xl transition-all flex items-center justify-center"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}