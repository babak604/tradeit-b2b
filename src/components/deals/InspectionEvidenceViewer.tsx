'use client';

import { useEffect, useState } from 'react';
import { getSignedEvidenceUrls, SignedEvidenceUrl } from '@/app/actions/storage';

interface InspectionEvidenceViewerProps {
  paths: string[];
}

export function InspectionEvidenceViewer({ paths }: InspectionEvidenceViewerProps) {
  const [urls, setUrls] = useState<SignedEvidenceUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchUrls() {
      setIsLoading(true);
      const res = await getSignedEvidenceUrls(paths);
      if (isMounted && res.success && res.data) {
        setUrls(res.data);
      }
      if (isMounted) setIsLoading(false);
    }

    if (paths && paths.length > 0) {
      fetchUrls();
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [paths]);

  if (!paths || paths.length === 0) return null;

  if (isLoading) {
    return (
      <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-500">
        <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
        <span>Resolving secure storage links...</span>
      </div>
    );
  }

  return (
    <div className="mt-2.5 flex flex-wrap gap-2">
      {urls.map((item, idx) => {
        if (!item.signedUrl) return null;

        const fileName = item.path.split('/').pop() || `Evidence #${idx + 1}`;
        const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName);

        return (
          <a
            key={item.path}
            href={item.signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] font-mono text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-900 hover:text-white"
          >
            <span className={isImage ? 'text-emerald-400' : 'text-blue-400'}>
              {isImage ? '📷' : '📄'}
            </span>
            <span className="max-w-[150px] truncate">{fileName}</span>
            <span className="text-zinc-500">↗</span>
          </a>
        );
      })}
    </div>
  );
}