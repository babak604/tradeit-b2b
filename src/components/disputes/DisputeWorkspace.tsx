'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';

interface DisputeEvidenceUploaderProps {
  dealId: string;
  onUploadSuccess?: () => void;
}

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export function DisputeEvidenceUploader({
  dealId,
  onUploadSuccess,
}: DisputeEvidenceUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    setSuccessMsg(null);

    // Size check
    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File size exceeds maximum allowed limit of ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    // Type check (allow general fallback if MIME is custom)
    if (!ALLOWED_TYPES.includes(selectedFile.type) && selectedFile.type !== '') {
      setError('Invalid file type. Please upload a PDF, PNG, JPEG, WEBP, or DOCX document.');
      return;
    }

    setFile(selectedFile);
    if (!title) {
      // Auto-populate title with cleaned file name
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(cleanName);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dealId', dealId);
      formData.append('title', title.trim() || file.name);
      formData.append('description', description.trim());

      const res = await fetch('/api/disputes/evidence/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to upload evidence.');
      }

      setSuccessMsg('Evidence uploaded successfully.');
      setFile(null);
      setTitle('');
      setDescription('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err: any) {
      console.error('Evidence upload error:', err);
      setError(err.message || 'An unexpected error occurred during file upload.');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <span>📁</span>
          <span>Submit Supporting Evidence</span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Upload official contracts, communications, invoices, or delivery receipts for arbitration review.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs rounded-lg flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Drag & Drop File Input Box */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
            isDragging
              ? 'border-blue-500 bg-blue-950/30'
              : file
              ? 'border-emerald-500/60 bg-slate-950/80 cursor-default'
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg,.webp,.docx"
            className="hidden"
          />

          {!file ? (
            <>
              <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-300 text-lg">
                ⬆️
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-200">
                  Click to choose file or drag & drop
                </p>
                <p className="text-[11px] text-slate-500">
                  PDF, PNG, JPG, WEBP, or DOCX (Max {MAX_FILE_SIZE_MB}MB)
                </p>
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg">
              <div className="flex items-center gap-3 overflow-hidden text-left">
                <div className="p-2 bg-slate-800 rounded text-base">📄</div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-200 truncate">{file.name}</p>
                  <p className="text-[10px] text-slate-400">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
                className="text-xs font-bold text-slate-400 hover:text-rose-400 p-1.5 transition"
                title="Remove file"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Evidence Metadata Fields */}
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Proof of Delivery / Signed Bill of Lading"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Context / Remarks (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Explain how this document supports your dispute position..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition resize-none"
            />
          </div>
        </div>

        {/* Submit Action */}
        <button
          type="submit"
          disabled={!file || uploading}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-lg transition flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>Encrypting & Uploading Evidence...</span>
            </>
          ) : (
            <>
              <span>Lock Evidence into Case Vault</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default DisputeEvidenceUploader;