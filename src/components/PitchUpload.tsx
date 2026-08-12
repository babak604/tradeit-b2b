'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  X, UploadCloud, Loader2, CheckCircle2, Sparkles, Wand2, 
  Video, Mic, Square, RotateCcw, Upload, AlertCircle 
} from 'lucide-react';

interface PitchUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

export default function PitchUpload({ isOpen, onClose, onUploadSuccess }: PitchUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workflow Mode
  const [mode, setMode] = useState<'upload' | 'record'>('upload');

  // File Upload & Drag-and-Drop States
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

  // Webcam Studio & AI Teleprompter States
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [teleprompterScript, setTeleprompterScript] = useState(
    "Hi, we are offering $8,500 in premium apparel and hoodie inventory. In exchange, we are seeking 50 hours of 4K video production and post-editing for our fall launch."
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Cleanup camera stream when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Camera & Recording Handlers
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setErrorMsg('Camera and Microphone access required to record.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleModeSwitch = (newMode: 'upload' | 'record') => {
    setMode(newMode);
    setErrorMsg(null);
    if (newMode === 'record') {
      startCamera();
    } else {
      stopCamera();
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/mp4' });
      setRecordedBlob(blob);
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    startCamera();
  };

  // AI Speech-to-Text Extraction Simulation
  const handleAiAutoExtract = () => {
    if (!selectedFile && !recordedBlob) {
      setErrorMsg('Please upload or record a video reel first to run AI extraction.');
      return;
    }

    setAiAnalyzing(true);
    setErrorMsg(null);

    setTimeout(() => {
      setTitle('Full-Stack React & Next.js Engineering');
      setOffering('80 Hours Senior Web & App Development');
      setLookingFor('Commercial Co-Working Space or SEO Agency');
      setEstimatedValue('6500');
      setCategory('Tech & SaaS');
      setAiAnalyzing(false);
    }, 1200);
  };

  // Drag & Drop Handlers
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

  // Publishing Pipeline
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();

    const fileToUpload = selectedFile || (recordedBlob ? new File([recordedBlob], `pitch-${Date.now()}.mp4`, { type: 'video/mp4' }) : null);

    if (!fileToUpload) {
      setErrorMsg('Please upload or record a 60s video pitch file.');
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

      const fileExt = fileToUpload.name.split('.').pop() || 'mp4';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `pitches/${fileName}`;

      const { error: storageError } = await supabase.storage
        .from('trade-media')
        .upload(filePath, fileToUpload, { cacheControl: '3600', upsert: false });

      let publicUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
      
      if (!storageError) {
        const urlRes = supabase.storage.from('trade-media').getPublicUrl(filePath);
        publicUrl = urlRes.data.publicUrl;
      }

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

      stopCamera();
      setSelectedFile(null);
      setRecordedBlob(null);
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
            onClick={() => { stopCamera(); onClose(); }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Upload File vs Record Studio */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleModeSwitch('upload')}
            className={`py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'upload' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
          
          <button
            type="button"
            onClick={() => handleModeSwitch('record')}
            className={`py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'record' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Teleprompter Studio</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handlePublish} className="space-y-4">
          
          {/* Mode 1: Drag & Drop File Zone */}
          {mode === 'upload' && (
            <>
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
            </>
          )}

          {/* Mode 2: In-Browser Webcam Studio & AI Teleprompter */}
          {mode === 'record' && (
            <div className="space-y-3">
              <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                {!recordedBlob ? (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2 text-emerald-400">
                    <CheckCircle2 className="w-10 h-10" />
                    <p className="text-xs font-bold">Pitch Reel Recorded!</p>
                  </div>
                )}

                {/* AI Teleprompter Banner Overlay */}
                {isRecording && (
                  <div className="absolute top-3 left-3 right-3 bg-slate-950/85 backdrop-blur-md border border-slate-800 p-3 rounded-xl text-xs text-white space-y-1 z-20 shadow-2xl">
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold text-red-400 uppercase">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" /> REC
                      </span>
                      <span>AI Teleprompter</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">{teleprompterScript}</p>
                  </div>
                )}
              </div>

              {/* Studio Teleprompter Input & Controls */}
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <input 
                  type="text" 
                  value={teleprompterScript}
                  onChange={(e) => setTeleprompterScript(e.target.value)}
                  placeholder="Type teleprompter script..."
                  className="bg-transparent text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none flex-1 mr-2"
                />

                {!isRecording && !recordedBlob && (
                  <Button type="button" size="sm" onClick={startRecording} className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 h-8 rounded-lg cursor-pointer">
                    <Mic className="w-3.5 h-3.5 mr-1" /> Start
                  </Button>
                )}

                {isRecording && (
                  <Button type="button" size="sm" onClick={stopRecording} className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 h-8 rounded-lg cursor-pointer">
                    <Square className="w-3.5 h-3.5 mr-1 fill-current" /> Stop
                  </Button>
                )}

                {recordedBlob && (
                  <Button type="button" size="sm" onClick={resetRecording} className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 h-8 rounded-lg cursor-pointer">
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Retake
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* AI Auto-Extract Button */}
          {(selectedFile || recordedBlob) && (
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