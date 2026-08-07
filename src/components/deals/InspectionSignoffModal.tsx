'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { signoffTradeInspection } from '@/app/actions/inspection';

interface InspectionSignoffModalProps {
  dealId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function InspectionSignoffModal({
  dealId,
  isOpen,
  onClose,
}: InspectionSignoffModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState('');
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const supabase = createClient();
      const uploadedPaths: string[] = [];

      // 1. Upload files directly to Supabase Storage
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgress(`Uploading evidence (${i + 1}/${selectedFiles.length})...`);

        const fileExt = file.name.split('.').pop();
        const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${dealId}/${cleanFileName}`;

        const { data: storageData, error: storageError } = await supabase.storage
          .from('deal-inspection-evidence')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (storageError) {
          setErrorMessage(`Failed to upload ${file.name}: ${storageError.message}`);
          setUploadProgress('');
          return;
        }

        uploadedPaths.push(storageData.path);
      }

      setUploadProgress('Finalizing trade sign-off...');

      // 2. Invoke sign-off Server Action
      const result = await signoffTradeInspection({
        dealId,
        notes,
        attachmentPaths: uploadedPaths,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to complete sign-off.');
        setUploadProgress('');
      } else {
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100">
        <h2 className="text-lg font-semibold text-white">
          Sign Off Trade & Attach Evidence
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Upload inspection photos or verification documents before releasing escrow.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Notes Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Inspection Notes / Summary
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. All goods verified, quantity matched manifest."
              rows={3}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* File Upload Zone */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Inspection Evidence (Photos / PDFs)
            </label>
            <input
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              disabled={isPending}
              className="w-full text-xs text-slate-400 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
            />
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="max-h-28 overflow-y-auto rounded-md border border-slate-800 bg-slate-950/50 p-2 space-y-1">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs text-slate-300"
                >
                  <span className="truncate max-w-[80%]">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    disabled={isPending}
                    className="text-red-400 hover:text-red-300 text-[11px]"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Status Feedback */}
          {uploadProgress && (
            <p className="text-xs text-blue-400 font-mono animate-pulse">
              {uploadProgress}
            </p>
          )}

          {errorMessage && (
            <p className="text-xs text-red-400 bg-red-950/40 p-2 rounded border border-red-900">
              {errorMessage}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {isPending ? 'Processing...' : 'Confirm Sign-off'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}