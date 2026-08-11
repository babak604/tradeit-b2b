'use client';

import { useState, useRef, useEffect } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Building2,
  ShieldCheck,
  MapPin,
  DollarSign,
  ArrowRight,
  Sparkles,
  Tag,
} from 'lucide-react';

export interface OfferItem {
  id: string;
  company_id: string;
  title: string;
  offering_summary: string;
  looking_for_summary: string;
  estimated_value: number;
  category: string;
  video_url: string;
  company_name: string;
  company_verified: boolean;
  location_name: string;
  distance_km?: number;
  created_at?: string;
}

interface VideoPitchModalProps {
  offer: OfferItem | null;
  onClose: () => void;
  onInitiateSwap?: (offer: OfferItem) => void;
}

export default function VideoPitchModal({ offer, onClose, onInitiateSwap }: VideoPitchModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Autoplay when modal opens
    if (offer && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Fallback for browsers requiring user interaction prior to audio playback
        setIsMuted(true);
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play();
        }
      });
    }

    // Escape key listener to close modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [offer, onClose]);

  if (!offer) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration || 1;
    setProgress((current / duration) * 100);
  };

  const handleSwapClick = () => {
    if (onInitiateSwap) {
      onInitiateSwap(offer);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200">
      
      {/* Click Outside Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row max-h-[90vh]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-slate-950/80 text-slate-400 hover:text-white rounded-full border border-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Cinema Video Player */}
        <div className="relative lg:w-3/5 bg-black flex items-center justify-center overflow-hidden min-h-[320px] lg:min-h-[500px]">
          <video
            ref={videoRef}
            src={offer.video_url}
            className="w-full h-full object-cover cursor-pointer"
            loop
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onClick={togglePlay}
          />

          {/* Video Scrub Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
            <div
              className="h-full bg-red-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* On-Screen Video Controls */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2.5 bg-slate-950/80 backdrop-blur-md text-white rounded-xl border border-slate-800 hover:bg-slate-800 transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              onClick={toggleMute}
              className="p-2.5 bg-slate-950/80 backdrop-blur-md text-white rounded-xl border border-slate-800 hover:bg-slate-800 transition-all cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>

          {/* Category Overlay Tag */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-200">
            <Tag className="w-3.5 h-3.5 text-red-500" />
            {offer.category}
          </div>
        </div>

        {/* Right Side: Pitch Specs & Handshake CTA */}
        <div className="lg:w-2/5 p-6 flex flex-col justify-between space-y-6 overflow-y-auto bg-slate-900/80">
          
          <div className="space-y-5">
            {/* Company & Verification Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  {offer.company_name}
                </span>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                  <MapPin className="w-3 h-3 text-red-400" />
                  {offer.location_name}
                  {offer.distance_km !== undefined && offer.distance_km !== null && (
                    <span className="text-emerald-400 font-bold border-l border-slate-800 pl-2">
                      {Math.round(offer.distance_km)} km away
                    </span>
                  )}
                </div>
              </div>

              {offer.company_verified && (
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 flex items-center gap-1 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  Verified
                </div>
              )}
            </div>

            {/* Pitch Title */}
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">{offer.title}</h2>
              <div className="mt-2 inline-flex items-center gap-1 text-base font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                <DollarSign className="w-4 h-4" />
                {offer.estimated_value?.toLocaleString()} CAD Estimated Value
              </div>
            </div>

            {/* Pitch Specs */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                  Offering Provision
                </span>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                  {offer.offering_summary}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400">
                  Seeking Reciprocity
                </span>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                  {offer.looking_for_summary}
                </p>
              </div>
            </div>
          </div>

          {/* Action Handshake CTA */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <button
              onClick={handleSwapClick}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/30 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> Initiate Barter Swap <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
            >
              Back to Feed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}