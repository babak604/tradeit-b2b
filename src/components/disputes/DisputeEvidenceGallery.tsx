'client';

import { useState, useEffect } from 'react';
import { 
  getDisputeEvidenceAction, 
  getEvidenceDownloadUrlAction, 
  EvidenceRecord 
} from '@/app/actions/evidence';

interface DisputeEvidenceGalleryProps {
  dealId: string;
  refreshKey?: number; // Pass a counter increment to trigger re-fetches after uploads
}

export function DisputeEvidenceGallery({ dealId, refreshKey = 0 }: DisputeEvidenceGalleryProps) {
  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchEvidence = async () => {
    setLoading(true);
    setError(null);
    const res = await getDisputeEvidenceAction(dealId);
    if (res.success && res.data) {
      setEvidenceList(res.data);
    } else {
      setError(res.error || 'Failed to load dispute evidence.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvidence();
  }, [dealId, refreshKey]);

  const handleDownload = async (item: EvidenceRecord) => {
    setDownloadingId(item.id);
    try {
      const res = await getEvidenceDownloadUrlAction(item.file_path);
      if (res.success && res.url) {
        // Open signed URL in new window/tab
        window.open(res.url, '_blank', 'noopener,noreferrer');
      } else {
        alert(res.error || 'Failed to retrieve access link.');
      }
    } catch (err) {
      console.error('Error fetching signed URL:', err);
      alert('An error occurred while generating the secure link.');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (isoString: string): string => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileBadge = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950/80 text-red-400 border border-red-800/50">
          PDF
        </span>
      );
    }
    if (fileType.includes('image')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
          IMAGE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
        FILE
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-12 bg-slate-950/50 rounded"></div>
          <div className="h-12 bg-slate-950/50 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Dispute Evidence & Documents</h3>
          <p className="text-xs text-slate-400">
            {evidenceList.length} {evidenceList.length === 1 ? 'file' : 'files'} submitted for arbitration
          </p>
        </div>
        <button
          onClick={fetchEvidence}
          className="text-xs text-slate-400 hover:text-slate-200 transition underline underline-offset-2"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 mb-4 bg-rose-950/60 border border-rose-800/80 rounded text-rose-300 text-xs">
          {error}
        </div>
      )}

      {evidenceList.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-lg p-8 text-center bg-slate-950/30">
          <p className="text-slate-400 text-xs mb-1">No evidence uploaded yet.</p>
          <p className="text-slate-500 text-[11px]">
            Both counter-parties can upload supporting receipts, contracts, or inspection logs.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
          {evidenceList.map((item) => (
            <div
              key={item.id}
              className="p-3.5 flex items-center justify-between hover:bg-slate-800/30 transition gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0">{getFileBadge(item.file_type)}</div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate" title={item.file_name}>
                    {item.file_name}
                  </p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{formatFileSize(item.file_size)}</span>
                    <span>•</span>
                    <span>{formatDate(item.created_at)}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDownload(item)}
                disabled={downloadingId === item.id}
                className="shrink-0 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 text-xs font-medium rounded transition flex items-center gap-1.5"
              >
                {downloadingId === item.id ? (
                  <span>Securing link...</span>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>View / Download</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}