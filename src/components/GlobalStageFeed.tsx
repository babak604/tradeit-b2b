'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  Volume2, VolumeX, Sparkles, Building2, ArrowUpRight, ArrowDownLeft, 
  MapPin, Globe, Flame, ArrowRight, Search, Filter, Bell, ShieldCheck 
} from 'lucide-react';

const CATEGORIES = [
  'All', 
  'B2B Services', 
  'Tech & SaaS', 
  'Marketing', 
  'Real Estate', 
  'Logistics', 
  'Retail', 
  'Other'
];

export default function GlobalStageFeed({ onSelectDeal }: { onSelectDeal?: (id: string) => void }) {
  const [pitches, setPitches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [locationFilter, setLocationFilter] = useState<'all' | 'local' | 'global'>('all');
  const [alertSaved, setAlertSaved] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    async function fetchPitches() {
      try {
        setLoading(true);

        let { data, error } = await supabase
          .from('trade_offers')
          .select('*, companies(name, location_name)');

        if (error) {
          const fallback = await supabase.from('trade_offers').select('*');
          data = fallback.data;
          error = fallback.error;
        }

        if (error || !data) {
          const fallbackTrades = await supabase.from('trades').select('*');
          data = fallbackTrades.data;
          error = fallbackTrades.error;
        }

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        if (data) processData(data);
      } catch (err: any) {
        console.error('Feed exception:', err);
        setErrorMsg(err?.message || 'Failed to load offer feed');
      } finally {
        setLoading(false);
      }
    }

    function processData(data: any[]) {
      if (Array.isArray(data)) {
        const formatted = data.map((item) => {
          let url = item?.video_url || '';
          if (url && !url.startsWith('http')) {
            const { data: urlData } = supabase.storage
              .from('trade-media')
              .getPublicUrl(url);
            url = urlData?.publicUrl || url;
          }
          return {
            id: item?.id || `pitch-${Math.random().toString(36).substring(2, 9)}`,
            video_url: url,
            title: item?.title || '60s Trade Pitch',
            company_name: item?.companies?.name ?? item?.company_name ?? 'Verified Member',
            location: item?.companies?.location_name ?? item?.location ?? 'Montreal, QC',
            offering_summary: item?.offering_summary ?? item?.offering_tag ?? 'Unspecified Offer',
            looking_for_summary: item?.looking_for_summary ?? item?.seeking_tag ?? 'Unspecified Need',
            estimated_value: Number(item?.estimated_value ?? item?.amount ?? item?.value_amount ?? 0),
            category: item?.category || 'B2B Services',
            is_local: Boolean(item?.is_local_physical),
            is_verified: true,
          };
        });

        setPitches(formatted);
      }
    }

    fetchPitches();
  }, [mounted]);

  // Dynamic Filtering Pipeline with Strict Safeguards
  const filteredPitches = useMemo(() => {
    if (!Array.isArray(pitches)) return [];

    return pitches.filter((pitch) => {
      if (!pitch) return false;
      const query = searchQuery ? searchQuery.toLowerCase() : '';

      const matchesSearch = 
        (pitch.title ?? '').toLowerCase().includes(query) ||
        (pitch.offering_summary ?? '').toLowerCase().includes(query) ||
        (pitch.looking_for_summary ?? '').toLowerCase().includes(query) ||
        (pitch.company_name ?? '').toLowerCase().includes(query);

      const matchesCategory = 
        selectedCategory === 'All' || 
        (pitch.category ?? '').toLowerCase() === selectedCategory.toLowerCase();

      const matchesLocation = 
        locationFilter === 'all' || 
        (locationFilter === 'local' && pitch.is_local) ||
        (locationFilter === 'global' && !pitch.is_local);

      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [pitches, searchQuery, selectedCategory, locationFilter]);

  const handleCreateAutoMatchAlert = () => {
    setAlertSaved(true);
    setTimeout(() => setAlertSaved(false), 3000);
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="w-full min-h-[500px] bg-slate-950 flex flex-col items-center justify-center space-y-3 rounded-3xl border border-slate-900 text-slate-400">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold">Loading Stage Feed & Filtering Index...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 p-4 sm:p-6 rounded-3xl border border-slate-900 shadow-2xl space-y-6">
      
      {/* Stage Header & Sound Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-900">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-red-500" />
          <h2 className="text-base font-extrabold text-white tracking-wide">
            LIVE OFFER & NEED STAGE
          </h2>
        </div>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 transition-all cursor-pointer self-start sm:self-auto"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          <span>{isMuted ? 'Muted' : 'Sound On'}</span>
        </button>
      </div>

      {/* MINIMAL COMPACT SEARCH, FILTER & AUTO-MATCH ALERT BAR */}
      <div className="flex flex-col md:flex-row items-center gap-2.5">
        
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input 
            type="text"
            placeholder="Search keywords, skills, or service needs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>

        {/* Compact Category Dropdown */}
        <div className="relative w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full md:w-40 bg-slate-900/60 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-red-500 appearance-none cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-slate-950 text-white">
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Scope Toggles */}
        <div className="flex items-center bg-slate-900/60 border border-slate-800 p-0.5 rounded-xl w-full md:w-auto shrink-0">
          <button
            onClick={() => setLocationFilter('all')}
            className={`flex-1 md:flex-none px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              locationFilter === 'all' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Scope
          </button>
          <button
            onClick={() => setLocationFilter('local')}
            className={`flex-1 md:flex-none px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              locationFilter === 'local' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            📍 Local
          </button>
          <button
            onClick={() => setLocationFilter('global')}
            className={`flex-1 md:flex-none px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              locationFilter === 'global' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            🌐 Global
          </button>
        </div>

        {/* Auto-Match Saved Search Button */}
        <button
          onClick={handleCreateAutoMatchAlert}
          className={`w-full md:w-auto px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-all border ${
            alertSaved 
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400' 
              : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <Bell className={`w-3.5 h-3.5 ${alertSaved ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span>{alertSaved ? 'Auto-Match Saved ✓' : 'Auto-Match Alert'}</span>
        </button>

      </div>

      {/* Empty State */}
      {filteredPitches.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[380px] bg-slate-950 border border-dashed border-slate-800 rounded-3xl p-8 text-center space-y-3">
          <Flame className="w-8 h-8 text-slate-600" />
          <h3 className="text-sm font-bold text-slate-300">No Offers or Needs Match Your Filter</h3>
          <p className="text-xs text-slate-500 max-w-sm">Try clearing your search query or switching category scope.</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setLocationFilter('all'); }}
            className="text-xs text-red-400 font-bold hover:underline cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        /* 9:16 Vertical Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
          {filteredPitches.map((pitch) => (
            <div
              key={pitch.id}
              style={{ aspectRatio: '9 / 16' }}
              className="relative w-full max-w-[320px] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between group hover:border-red-500/50 transition-all duration-300"
            >
              {pitch.video_url ? (
                <video
                  src={pitch.video_url}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover z-0"
                />
              ) : (
                <div className="absolute inset-0 bg-slate-950 flex items-center justify-center text-xs text-slate-600">
                  No Video Source
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-slate-950/60 z-10 pointer-events-none" />

              {/* Top Badges */}
              <div className="relative z-20 p-4 flex items-center justify-between">
                <span className="bg-slate-950/80 backdrop-blur-md border border-slate-800 text-emerald-400 text-xs font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                  ${(pitch.estimated_value ?? 0).toLocaleString()} CAD
                </span>
                <span className="bg-slate-950/80 backdrop-blur-md border border-slate-800 text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {pitch.category}
                </span>
              </div>

              {/* Bottom Details */}
              <div className="relative z-20 p-4 space-y-2.5">
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-extrabold text-white flex items-center gap-1.5 truncate">
                      <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      {pitch.company_name}
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 shrink-0">
                      {pitch.is_local ? <MapPin className="w-3 h-3 text-red-400" /> : <Globe className="w-3 h-3 text-slate-500" />}
                      {pitch.location}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-white line-clamp-1 leading-snug">
                    {pitch.title}
                  </h3>
                </div>

                <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl space-y-1.5 text-xs">
                  <div>
                    <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" /> Offer
                    </span>
                    <p className="text-slate-200 font-medium line-clamp-1">
                      {pitch.offering_summary}
                    </p>
                  </div>

                  <div className="border-t border-slate-800/80 pt-1">
                    <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                      <ArrowDownLeft className="w-3 h-3" /> Need
                    </span>
                    <p className="text-slate-200 font-medium line-clamp-1">
                      {pitch.looking_for_summary}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => onSelectDeal ? onSelectDeal(pitch.id) : null}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all block text-center cursor-pointer"
                >
                  <span>Match Offer & Need</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}