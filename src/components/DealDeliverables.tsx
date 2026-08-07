'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getSignedFileUrlAction } from '@/app/actions/attachments';
import { Paperclip, UploadCloud, FileText, Download, Loader2, AlertCircle } from 'lucide-react';

export interface FileItem {
  id: string; // The full storage path e.g. "deal-id/171000000_filename.pdf"
  name: string; // Display name e.g. "filename.pdf"
  created_at: string;
  metadata?: { size?: number };
}

interface Props {
  dealId: string;
  initialFiles: FileItem[];
  isLockedInEscrow: boolean;
}

export function DealDeliverables({ dealId, initialFiles, isLockedInEscrow }: Props) {
  const router = useRouter();
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('File size exceeds the 25MB limit.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${dealId}/${Date.now()}_${sanitizedName}`;

      // 1. Direct Storage Upload
      const { error: uploadErr } = await supabase
        .storage
        .from('deal-attachments')
        .upload(storagePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadErr) throw uploadErr;

      // 2. Local State Update with correct storage path
      const newFileItem: FileItem = {
        id: storagePath,
        name: selectedFile.name,
        created_at: new Date().toISOString(),
        metadata: { size: selectedFile.size },
      };

      setFiles((prev) => [newFileItem, ...prev]);

      // 3. Revalidate Server Components
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to upload deliverable.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (storagePath: string) => {
    setDownloadingId(storagePath);
    setError(null);

    startTransition(async () => {
      try {
        // Pass the exact relative storage path (dealId/timestamp_filename.pdf)
        const res = await getSignedFileUrlAction(storagePath);
        
        if (res.success && res.url) {
          window.open(res.url, '_blank', 'noopener,noreferrer');
        } else {
          setError(res.error || 'Failed to generate download URL.');
        }
      } catch (err: any) {
        setError(err.message || 'Error executing download request.');
      } finally {
        setDownloadingId(null);
      }
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
          <Paperclip className="h-5 w-5 text-indigo-500" />
          Deal Deliverables & Attachments
        </h3>
        <span className="text-xs text-slate-500 font-mono">Max file size: 25MB</span>
      </div>

      {/* Upload Zone */}
      {isLockedInEscrow ? (
        <div className="mb-6">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-4 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-800">
            {uploading ? (
              <Loader2 className="mb-2 h-8 w-8 text-indigo-500 animate-spin" />
            ) : (
              <UploadCloud className="mb-2 h-8 w-8 text-slate-400" />
            )}
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {uploading ? 'Uploading deliverable to vault...' : 'Click or drop files here to upload deliverable'}
            </span>
            <input
              type="file"
              disabled={uploading}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="mb-6 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-mono">
          Escrow must be signed and funded before deliverable attachments can be uploaded.
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 font-mono">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* File List */}
      <div className="space-y-2">
        {files.length === 0 ? (
          <p className="text-center py-6 text-sm text-slate-500 font-mono">
            No deliverables uploaded yet.
          </p>
        ) : (
          files.map((file) => {
            const isDownloadingThis = isPending && downloadingId === file.id;

            return (
              <div
                key={file.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                  <div className="truncate max-w-[250px] sm:max-w-xs">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">
                      Uploaded {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(file.id)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50 transition-colors"
                >
                  {isDownloadingThis ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>{isDownloadingThis ? 'Generating Link...' : 'Download'}</span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}