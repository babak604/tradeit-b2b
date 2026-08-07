import Image from 'next/image';

export interface DealMessage {
  id: string;
  deal_id: string;
  sender_company_id: string;
  content: string;
  attachments: string[] | null;
  created_at: string;
  sender_company: {
    name: string;
    logo_url: string | null;
  };
}

interface ChatMessageBubbleProps {
  message: DealMessage;
  currentCompanyId: string;
}

export function ChatMessageBubble({ message, currentCompanyId }: ChatMessageBubbleProps) {
  const isOwnMessage = message.sender_company_id === currentCompanyId;

  return (
    <div className={`flex gap-3 mb-4 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
        {message.sender_company?.logo_url ? (
          <Image 
            src={message.sender_company.logo_url} 
            alt={message.sender_company.name} 
            width={32} 
            height={32} 
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="text-[10px] font-bold font-mono text-sky-400">
            {message.sender_company?.name?.slice(0, 2).toUpperCase() || 'CO'}
          </span>
        )}
      </div>

      <div className={`max-w-[75%] space-y-1.5 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-center gap-2 text-[10px] font-mono text-slate-400 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
          <span className="font-bold text-slate-300">{message.sender_company?.name}</span>
          <span>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
          isOwnMessage 
            ? 'bg-sky-600 text-white rounded-tr-none' 
            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
        }`}>
          <p className="whitespace-pre-wrap">{message.content}</p>

          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-800/60 space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Inspection Attachments</span>
              <div className="flex flex-wrap gap-2">
                {message.attachments.map((url, idx) => (
                  <a 
                    key={idx} 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono underline hover:text-sky-300 transition-colors bg-slate-950/40 px-2.5 py-1 rounded-lg border border-slate-800 block"
                  >
                    Attachment #{idx + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}