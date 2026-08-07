'use client';

import { useState, useRef, useTransition } from 'react';
import { sendMessageAction } from '@/app/actions/chat';

interface ChatInputFormProps {
  dealId: string;
  senderCompanyId: string;
}

export function ChatInputForm({ dealId, senderCompanyId }: ChatInputFormProps) {
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedFile) return;

    setError(null);
    const formData = new FormData();
    formData.append('dealId', dealId);
    formData.append('senderCompanyId', senderCompanyId);
    formData.append('content', content);
    if (selectedFile) {
      formData.append('attachment', selectedFile);
    }

    startTransition(async () => {
      const res = await sendMessageAction(formData);
      if (res.success) {
        setContent('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setError(res.error || 'Failed to send message.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {/* File Attachment Preview Tag */}
      {selectedFile && (
        <div className="flex items-center gap-2 text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-md w-fit border border-slate-700">
          <span className="truncate max-w-[200px]">{selectedFile.name}</span>
          <span className="text-slate-500">
            ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </span>
          <button
            type="button"
            onClick={() => setSelectedFile(null)}
            className="text-slate-400 hover:text-white font-bold ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Message Display */}
      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-2 focus-within:border-slate-700 transition-colors">
        {/* Attachment Upload Button */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          className="hidden"
          id="chat-file-upload"
        />
        <label
          htmlFor="chat-file-upload"
          className="p-2 text-slate-400 hover:text-slate-200 cursor-pointer rounded-lg hover:bg-slate-800 transition-colors"
          title="Attach Inspection Document or Proof"
        >
          📎
        </label>

        {/* Text Input Area */}
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type message or submit inspection status..."
          disabled={isPending}
          className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none disabled:opacity-50"
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending || (!content.trim() && !selectedFile)}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-medium text-xs px-4 py-2 rounded-lg transition-all"
        >
          {isPending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </form>
  );
}