'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Upload, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function PitchUpload() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [offeringTag, setOfferingTag] = useState('');
  const [seekingTag, setSeekingTag] = useState('');
  const [valueAmount, setValueAmount] = useState('');
  const [isLocalPhysical, setIsLocalPhysical] = useState(true);
  
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!file || !offeringTag || !seekingTag || !valueAmount) {
      setErrorMessage('Please fill out all fields and select a video pitch.');
      return;
    }

    try {
      setUploading(true);

      // 1. Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

      // 2. Upload video file to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('trade-pitches')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageError) {
        throw new Error(`Storage Error: ${storageError.message}`);
      }

      // 3. Insert record into PostgreSQL trades table
const numericVal = parseFloat(valueAmount) || 0;

// Get logged-in user if available (optional)
const { data: { user } } = await supabase.auth.getUser();

const payload: Record<string, unknown> = {
  video_url: fileName,
  offering_tag: offeringTag,
  seeking_tag: seekingTag,
  amount: numericVal,
  is_local_physical: isLocalPhysical,
  status: 'PENDING'
};

// Only add user_id if a user is logged in
if (user?.id) {
  payload.user_id = user.id;
}

const { error: dbError } = await supabase
  .from('trades')
  .insert([payload]);

if (dbError) {
  throw new Error(`Database Error: ${dbError.message}`);
}

      // 4. Success -> Route back to stage feed
      router.push('/');
      router.refresh();

    } catch (err: any) {
      console.error('Upload pipeline failed:', err);
      setErrorMessage(err.message || 'An unexpected error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="p-2 bg-neutral-800 rounded-full hover:bg-neutral-700 transition">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-sm font-bold tracking-wider uppercase text-emerald-400 font-mono">Broadcast Pitch</h1>
          <div className="w-8"></div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          
          {/* Video Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1.5">Video Asset (.mp4 / .mov)</label>
            <div className="relative border-2 border-dashed border-neutral-700 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-neutral-950/50">
              <input 
                type="file" 
                accept="video/*" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="text-neutral-500 mb-2" size={24} />
              {file ? (
                <p className="text-xs text-emerald-400 font-medium truncate max-w-xs">{file.name}</p>
              ) : (
                <p className="text-xs text-neutral-400">Tap to select or drop video pitch</p>
              )}
            </div>
          </div>

          {/* Offering Tag */}
          <div>
            <label className="block text-xs font-semibold uppercase text-emerald-400 mb-1">What are you offering?</label>
            <input 
              type="text"
              placeholder="e.g. Executive Web Design & Branding"
              value={offeringTag}
              onChange={(e) => setOfferingTag(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Seeking Tag */}
          <div>
            <label className="block text-xs font-semibold uppercase text-cyan-400 mb-1">What are you seeking?</label>
            <input 
              type="text"
              placeholder="e.g. Warehouse Space / Logistics"
              value={seekingTag}
              onChange={(e) => setSeekingTag(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Value & Trade Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Est. Value (CAD)</label>
              <input 
                type="number"
                placeholder="5000"
                value={valueAmount}
                onChange={(e) => setValueAmount(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Scope</label>
              <button
                type="button"
                onClick={() => setIsLocalPhysical(!isLocalPhysical)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs font-bold text-neutral-300 hover:border-neutral-700 transition"
              >
                {isLocalPhysical ? '📍 Local Asset' : '🌐 Global Service'}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3.5 rounded-xl transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 text-sm flex items-center justify-center gap-2 mt-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span>Broadcasting...</span>
              </>
            ) : (
              <span>Broadcast Pitch</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}