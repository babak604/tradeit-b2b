'use client';

import { use, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface DealPageProps {
  params: Promise<{ id: string }>;
}

export default function DealDetailPage({ params }: DealPageProps) {
  // Unwrap params using React.use() for Next.js 15 compatibility
  const { id } = use(params);

  const [deal, setDeal] = useState<any>(null);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch deal details and related evidence on mount
  useEffect(() => {
    async function fetchDealData() {
      try {
        setLoading(true);
        // Fetch deal and company join info
        const { data: dealData, error: dealError } = await supabase
          .from('barter_deals')
          .select('*, companies(name, email)')
          .eq('id', id)
          .single();

        if (dealError) throw dealError;
        setDeal(dealData);

        // Fetch uploaded evidence
        const { data: evidenceData, error: evidenceError } = await supabase
          .from('dispute_evidence')
          .select('*')
          .eq('dispute_id', id);

        if (evidenceError) throw evidenceError;
        setEvidenceList(evidenceData || []);
      } catch (err: any) {
        console.error('Error fetching deal:', err);
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDealData();

    // Setup Supabase Realtime subscription for live status changes
    const channel = supabase
      .channel(`deal-room-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'barter_deals',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setDeal((prev: any) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Handle Action: File Dispute / Change Status
  async function updateDealStatus(newStatus: string) {
    try {
      setErrorMsg(null);
      const { error } = await supabase
        .from('barter_deals')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setSuccessMsg(`Deal status successfully updated to "${newStatus}".`);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  }

  // Handle File Upload to Supabase Storage & Evidence Table
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setUploading(true);
      setErrorMsg(null);

      const filePath = `disputes/${id}/${Date.now()}-${selectedFile.name}`;

      // 1. Upload to Supabase Storage Bucket ('dispute-evidence')
      const { error: storageError } = await supabase.storage
        .from('dispute-evidence')
        .upload(filePath, selectedFile);

      if (storageError) throw storageError;

      // 2. Insert metadata record into 'dispute_evidence' table
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id || null;

      const { data: evidenceRecord, error: dbError } = await supabase
        .from('dispute_evidence')
        .insert({
          dispute_id: id,
          file_path: filePath,
          uploaded_by: userId,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setEvidenceList((prev) => [...prev, evidenceRecord]);
      setSelectedFile(null);
      setSuccessMsg('Evidence uploaded successfully to vault.');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-600">
        Loading deal workspace...
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-red-600">
        Deal not found or access denied.
      </div>
    );
  }

  // Status badge styling helper
  const statusColors: Record<string, string> = {
    active: 'bg-blue-100 text-blue-800 border-blue-200',
    disputed: 'bg-amber-100 text-amber-800 border-amber-200',
    settled: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Deal Reference ID: {deal.id}</p>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">{deal.title || 'Barter Agreement'}</h1>
              <p className="text-sm text-gray-600 mt-1">
                Company: <span className="font-semibold">{deal.companies?.name || 'N/A'}</span> ({deal.companies?.email || 'No email registered'})
              </p>
            </div>
            <div>
              <span className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border ${statusColors[deal.status] || 'bg-gray-100 text-gray-800'}`}>
                {deal.status}
              </span>
            </div>
          </div>

          {/* Action Triggers */}
          <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-100 pt-4">
            {deal.status === 'active' && (
              <button
                onClick={() => updateDealStatus('disputed')}
                className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-md shadow-sm transition"
              >
                File Dispute
              </button>
            )}
            {deal.status === 'disputed' && (
              <button
                onClick={() => updateDealStatus('settled')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-md shadow-sm transition"
              >
                Mark as Settled / Resolve
              </button>
            )}
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 text-sm text-red-700 rounded">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 text-sm text-emerald-700 rounded">
            {successMsg}
          </div>
        )}

        {/* Evidence & Documentation Section */}
        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Dispute Evidence Vault</h2>
          
          {/* Upload Form */}
          <form onSubmit={handleUpload} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gray-50 p-4 rounded-md border border-dashed border-gray-300">
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium px-4 py-2 rounded-md shadow-sm transition"
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </form>

          {/* Evidence List */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Submitted Files ({evidenceList.length})</h3>
            {evidenceList.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No evidence files uploaded for this dispute yet.</p>
            ) : (
              <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden">
                {evidenceList.map((item) => (
                  <li key={item.id} className="p-4 flex items-center justify-between text-sm bg-white hover:bg-gray-50">
                    <span className="font-mono text-gray-600 truncate max-w-md">{item.file_path}</span>
                    <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}