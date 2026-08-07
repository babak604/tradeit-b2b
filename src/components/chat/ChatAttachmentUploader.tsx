'use client';

import { useState, useRef } from 'react';
import { Paperclip, X, Loader2, FileText, Image as ImageIcon } from 'lucide-react';

export interface AttachmentMeta {
  name: string;
  size: number;
  type: string;
  url: string;
  path: string;
}

interface ChatAttachmentUploaderProps {
  dealId: string;
  onUploadComplete: (attachment: AttachmentMeta) => void;
  disabled?: boolean;
}

export function ChatAttachmentUploader({ dealId, onUploadComplete, disabled }: ChatAttachmentUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dealId', dealId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload attachment.');
      }

      onUploadComplete(data.attachment);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*,application/pdf"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        className="p-2.5 text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-slate-800 disabled:opacity-50"
        title="Attach file or media"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin text-sky-400" /> : <Paperclip className="w-4 h-4" />}
      </button>
    </div>
  );
}