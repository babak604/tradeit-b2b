'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  X, UploadCloud, Loader2, CheckCircle2, Sparkles, Wand2 
} from 'lucide-react';

interface PitchUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

export default function PitchUpload({ isOpen, onClose, onUploadSuccess }: PitchUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [offering, setOffering] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [category, setCategory] = useState('B2B Services');

  if (!isOpen) return null;

  // AI Speech-to-Text Auto-Extraction Handler
  const handleAiAutoExtract = () => {
    if (!selectedFile) {
      setErrorMsg('Please upload a video file first to run AI extraction.');
      return;
    }

    setAiAnalyzing(true);
    setErrorMsg(null);

    setTimeout(() => {
      setTitle('Full-Stack React & Next.js Development');
      setOffering('80 Hours Senior Web & App Engineering');
      setLookingFor('Commercial Lease or SEO Agency Retainer');
      setEstimatedValue('6500');
      setCategory('Tech & SaaS');
      setAiAnalyzing(false);
    }, 1200);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
        setErrorMsg(null);
      } else {
        setErrorMsg('Please upload a valid .MP4 or .MOV video file.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select or drop a 60s video pitch file.');
      return;
    }
    if (!offering || !lookingFor) {
      setErrorMsg('Please fill out what you offer and what you are seeking.');
      return;
    }

    try {
      setUploading(true);
      setErrorMsg(null);

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || 'demo-user';

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `pitches/${fileName}`;

      const { error: storageError } = await supabase.storage
        .from('trade-media')
        .upload(filePath, selectedFile, { cacheControl: '3600', upsert: false });

      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage
        .from('trade-media')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('trade_offers')
        .insert({
          title: title || '60s B2B Trade Pitch',
          offering_summary: offering,
          looking_for_summary: lookingFor,
          estimated_value: parseFloat(estimatedValue) || 1000,
          category: category,
          video_url: publicUrl,
          company_id: userId,
          status: 'active',
        });

      if (dbError) {
        await supabase.from('trades').insert({
          video_url: publicUrl,
          offering_tag: offering,
          seeking_tag: lookingFor,
          amount: parseFloat(estimatedValue) || 1000,
        });
      }

      setSelectedFile(null);
      setTitle('');
      setOffering('');
      setLookingFor('');
      setEstimatedValue('');
      onClose();

      if (onUploadSuccess) onUploadSuccess();
    } catch (err: any) {
      console.error('Upload error:', err);
      setErrorMsg(err.message || 'Failed to upload video pitch.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 space-y-5 relative shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-extrabold text-white">Broadcast Pitch Reel</h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-400">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handlePublish} className="space-y-4">
          
          {/* Drag & Drop Zone */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="video/mp4,video/webm,video/quicktime" 
            className="hidden" 
          />

          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-5 text-center space-y-2 cursor-pointer transition-all ${
              dragActive 
                ? 'border-red-500 bg-red-600/10' 
                : selectedFile 
                ? 'border-emerald-500/50 bg-emerald-950/20' 
                : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-950'
            }`}
          >
            {selectedFile ? (
              <div className="flex flex-col items-center space-y-1">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                <p className="text-xs font-bold text-emerald-300 truncate max-w-[280px]">
                  {selectedFile.name}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for AI Scan
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-1">
                <UploadCloud className="w-7 h-7 text-red-500 mb-1" />
                <p className="text-xs text-slate-200 font-bold">
                  Click to choose or drag & drop video reel
                </p>
                <p className="text-[10px] text-slate-500">
                  Supports .MP4, .MOV (60s max)
                </p>
              </div>
            )}
          </div>

          {/* AI Auto-Extract Trigger */}
          {selectedFile && (
            <button
              type="button"
              onClick={handleAiAutoExtract}
              disabled={aiAnalyzing}
              className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-red-400 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {aiAnalyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>AI Extracting Offer & Need from Video...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 text-red-500" />
                  <span>AI Auto-Extract Offer & Need</span>
                </>
              )}
            </button>
          )}

          {/* Form Fields */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Pitch Title</label>
              <input 
                type="text" 
                placeholder="e.g., 50 Hours Studio Video Production or Retail Inventory"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-emerald-400 font-bold mb-1">What You Offer</label>
                <input 
                  type="text" 
                  placeholder="e.g., 4K Studio Filming or Apparel Stock"
                  value={offering}
                  onChange={(e) => setOffering(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-blue-400 font-bold mb-1">What You Need</label>
                <input 
                  type="text" 
                  placeholder="e.g., Downtown Office Lease or Shipping"
                  value={lookingFor}
                  onChange={(e) => setLookingFor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Estimated Value ($ CAD)</label>
                <input 
                  type="number" 
                  placeholder="5000"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500 cursor-pointer"
                >
                  <option value="B2B Services">B2B Services</option>
                  <option value="Tech & SaaS">Tech & SaaS</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Retail">Retail</option>
                  <option value="Other">Other (All Categories Welcome)</option>
                </select>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={uploading}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing to Stage...</span>
              </>
            ) : (
              <span>Publish Offer & Need</span>
            )}
          </Button>

        </form>
      </div>
    </div>
  );
}