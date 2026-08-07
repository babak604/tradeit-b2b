'use client';

import { useState, useTransition, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { uploadDealAttachmentAction } from '@/app/actions/attachments';
import { FileUp, Paperclip, FileText, ExternalLink, Building2, CheckCircle2 } from 'lucide-react';

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  companies: { name: string };
}

export default function DealAttachments({ dealId }: { dealId: string }) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  const fetchAttachments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('deal_attachments')
      .select('*, companies!company_id(name)')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAttachments(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAttachments();
  }, [dealId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setErrorMsg(null);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('deal_id', dealId);

    startTransition(async () => {
      const res = await uploadDealAttachmentAction(formData);
      if (res.success) {
        await fetchAttachments();
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    });
  };

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('deal-attachments').getPublicUrl(path);
    return data.publicUrl;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-sky-400" />
            <span>Deliverables & Proof of Fulfillment</span>
          </h3>
          <p className="text-xs font-mono text-slate-400">
            Attach work files, contracts, or delivery receipts to support escrow settlement.
          </p>
        </div>

        <label className="cursor-pointer px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-sky-500/15">
          <FileUp className="w-4 h-4" />
          <span>{isPending ? 'Uploading...' : 'Attach Deliverable'}</span>
          <input
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isPending}
          />
        </label>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Attachments List */}
      {loading ? (
        <div className="text-center py-6 font-mono text-xs text-slate-500">
          Fetching deal attachments...
        </div>
      ) : attachments.length === 0 ? (
        <div className="text-center py-8 bg-slate-950/50 border border-slate-800/60 rounded-2xl space-y-2">
          <FileText className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs font-mono text-slate-500">No proof or deliverable assets uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex items-start justify-between gap-3 transition-all"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{file.file_name}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-sky-400" />
                    {file.companies?.name}
                  </span>
                  <span>&bull;</span>
                  <span>{formatBytes(file.file_size)}</span>
                </div>
              </div>

              <a
                href={getPublicUrl(file.file_path)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-sky-500 text-sky-400 transition-colors shrink-0"
                title="View / Download"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}