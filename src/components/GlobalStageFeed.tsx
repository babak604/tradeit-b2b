'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { DEMO_PRESET_OFFERS } from '@/lib/demo/demoSeedData';
import { Button } from '@/components/ui/button';
import { 
  Play, Pause, Volume2, VolumeX, Search, Sparkles, 
  MapPin, Building2, ArrowLeftRight, Filter, ShieldCheck, Video, Tag
} from 'lucide-react';

export interface TradeOffer {
  id: string;
  title?: string;
  offering_summary?: string;
  offering?: string;
  looking_for_summary?: string;
  looking_for?: string;
  estimated_value?: number;
  value?: number;
  category?: string;
  video_url?: string;
  company_name?: string;
  company?: string;
  location_name?: string;
  companies?: {
    name?: string;
    location_name?: string;
  };
}

interface GlobalStageFeedProps {
  onSelectDeal?: (dealId: string) => void;
}

const CATEGORIES = ['All', 'B2B Services', 'Tech & SaaS', 'Marketing', 'Real Estate', 'Logistics', 'Retail'];

export default function GlobalStageFeed({ onSelectDeal }: GlobalStageFeedProps) {
  const [offers, setOffers] = useState<TradeOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Video playback states
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  // Fetch offers with automatic fallback to seed data
  useEffect(() => {
    async function loadStageOffers() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('trade_offers')
          .select('*, companies(name, location_name)')
          .order('created_at', { ascending: false });

        if (error || !data || data.length === 0) {
          if (error) {
            console.warn('Supabase offer query skipped (RLS/Auth notice):', error.message);
          }
          // Fallback to demo preset offers
          setOffers(DEMO_PRESET_OFFERS as TradeOffer[]);
        } else {
          setOffers(data as TradeOffer[]);
        }
      } catch (err) {
        console.warn('Failed to connect to Supabase, loading fallback demo pitches:', err);
        setOffers(DEMO_PRESET_OFFERS as TradeOffer[]);
      } finally {
        setLoading(false);
      }
    }

    loadStageOffers();
  }, []);

  // Video play/pause handler
  const togglePlay = (id: string) => {
    const video = videoRefs.current[id];
    if (!video) return;

    if (playingId === id) {
      video.pause();
      setPlayingId(null);
    } else {
      // Pause any currently playing video
      if (playingId && videoRefs.current[playingId]) {
        videoRefs.current[playingId]?.pause();
      }
      video.play().catch((err) => console.warn('Video playback interrupted:', err));
      setPlayingId(id);
    }
  };

  const toggleMute = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const video = videoRefs.current[id];
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  };

  // Filtered dataset logic
  const filteredOffers = offers.filter((offer) => {
    const company = offer.company_name || offer.company || offer.companies?.name || '';
    const offeringText = offer.offering_summary || offer.offering || '';
    const seekingText = offer.looking_for_summary || offer.looking_for || '';
    const titleText = offer.title || '';
    
    const matchesSearch = 
      company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offeringText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seekingText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      titleText.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = 
      selectedCategory === 'All' || 
      (offer.category && offer.category.toLowerCase() === selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-600/10 border border-red-500/20 rounded-xl text-red-500">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-wide flex items-center gap-2">
                GLOBAL BROADCAST STAGE
                <span className="text-[10px] font-mono bg-red-950/80 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">
                  LIVE REELS
                </span>
              </h2>
              <p className="text-xs text-slate-400">Discover zero-cash reciprocal B2B barter pitches</p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search companies, offers, needs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 mr-1" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-slate-900 border border-slate-800 rounded-3xl h-[420px] animate-pulse p-4 space-y-4">
              <div className="bg-slate-950 rounded-2xl h-56 w-full" />
              <div className="h-4 bg-slate-800 rounded w-3/4" />
              <div className="h-3 bg-slate-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredOffers.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <Sparkles className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-200">No Pitch Reels Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or category filter to discover more B2B opportunities.
          </p>
        </div>
      )}

      {/* Broadcast Feed Grid */}
      {!loading && filteredOffers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOffers.map((offer) => {
            const companyName = offer.company_name || offer.company || offer.companies?.name || 'Verified B2B Enterprise';
            const locationName = offer.location_name || offer.companies?.location_name || 'Montreal, QC';
            const offeringText = offer.offering_summary || offer.offering || 'B2B Asset / Service Offering';
            const seekingText = offer.looking_for_summary || offer.looking_for || 'Required Service or Resource';
            const val = offer.estimated_value || offer.value || 5000;
            const videoSrc = offer.video_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

            return (
              <div 
                key={offer.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl group"
              >
                {/* Video Pitch Card Header */}
                <div className="relative aspect-video bg-slate-950 overflow-hidden cursor-pointer" onClick={() => togglePlay(offer.id)}>
                  <video
                    ref={(el) => { videoRefs.current[offer.id] = el; }}
                    src={videoSrc}
                    loop
                    muted={isMuted}
                    playsInline
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Top Badges Overlay */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
                    <span className="px-2.5 py-1 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl text-[10px] font-bold text-slate-300 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-red-500" />
                      {offer.category || 'B2B Services'}
                    </span>

                    <span className="px-2.5 py-1 bg-emerald-950/90 backdrop-blur-md border border-emerald-500/40 rounded-xl text-[10px] font-mono font-bold text-emerald-400">
                      ${val.toLocaleString()} CAD
                    </span>
                  </div>

                  {/* Video Play / Mute Overlay Controls */}
                  <div className="absolute inset-0 bg-slate-950/30 group-hover:bg-slate-950/10 transition-all flex items-center justify-center">
                    <div className="w-12 h-12 bg-red-600/90 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-xl backdrop-blur-sm transition-all transform group-hover:scale-110">
                      {playingId === offer.id ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5" />
                      )}
                    </div>
                  </div>

                  {/* Audio Toggle Button */}
                  <button
                    type="button"
                    onClick={(e) => toggleMute(e, offer.id)}
                    className="absolute bottom-3 right-3 p-2 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-all z-20 cursor-pointer"
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                </div>

                {/* Card Content Details */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  
                  <div className="space-y-2">
                    {/* Company Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[180px]">{companyName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                        <MapPin className="w-3 h-3 text-red-500" />
                        <span>{locationName}</span>
                      </div>
                    </div>

                    <h3 className="font-extrabold text-sm text-white line-clamp-1">
                      {offer.title || offeringText}
                    </h3>
                  </div>

                  {/* Side-by-Side Reciprocal Exchange Overview */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
                    <div className="space-y-1 border-r border-slate-800/80 pr-2">
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">OFFERING</span>
                      <p className="text-slate-200 text-[11px] font-medium leading-tight line-clamp-2">
                        {offeringText}
                      </p>
                    </div>

                    <div className="space-y-1 pl-1">
                      <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider block">SEEKING</span>
                      <p className="text-slate-200 text-[11px] font-medium leading-tight line-clamp-2">
                        {seekingText}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800/60">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Zero-Cash Trade</span>
                    </div>

                    <Button
                      onClick={() => onSelectDeal && onSelectDeal(offer.id)}
                      className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 h-8 rounded-xl shadow-lg shadow-red-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>Enter Deal Room</span>
                    </Button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}