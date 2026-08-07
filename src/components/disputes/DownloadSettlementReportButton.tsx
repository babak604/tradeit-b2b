'use client';

import { useState } from 'react';
import { generateSettlementReportAction } from '@/app/actions/settlement';

interface DownloadSettlementReportButtonProps {
  dealId: string;
}

export function DownloadSettlementReportButton({ dealId }: DownloadSettlementReportButtonProps) {
  const [generating, setGenerating] = useState(false);

  const handleGenerateAndDownload = async () => {
    setGenerating(true);
    try {
      const result = await generateSettlementReportAction(dealId);
      if (result.success && result.downloadUrl) {
        window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
      } else {
        alert(result.error || 'Could not generate settlement report.');
      }
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred while preparing the PDF.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGenerateAndDownload}
      disabled={generating}
      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-100 border border-slate-700 rounded-md text-xs font-semibold transition"
    >
      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      {generating ? 'Generating Audit PDF...' : 'Download Settlement Certificate'}
    </button>
  );
}