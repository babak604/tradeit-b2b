'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  Play,
  Building2,
  BadgeCheck,
  Globe,
  MapPin,
  Handshake,
  Loader2,
  DollarSign,
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Current User's Company ID fallback
const CURRENT_USER_COMPANY_ID = '11111111-1111-1111-1111-111111111111';

export interface OfferData {
  id: string;
  company_id?: string;
  title: string;
  offering_summary: string;
  looking_for_summary: string;
  estimated_value: number;
  category: string;
  scope: 'remote' | 'local' | 'hybrid';
  video_url: string;
  thumbnail_url?: string;
  created_at: string;
  companies: {
    id?: string;
    name: string;
    slug?: string;
    logo_url?: string;
    is_verified: boolean;
    location_name?: string;
  };
}

export default function VideoPitchCard({ offer }: { offer: OfferData }) {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle Initiating a Barter Deal
  const handleInitiateBarter = async () => {
    setLoading(true);
    try {
      const targetCompanyId = offer.companies?.id || offer.company_id || CURRENT_USER_COMPANY_ID;

      // 1. Check if an active draft deal already exists for this offer
      const { data: existingDeal } = await supabase
        .from('barter_deals')
        .select('id')
        .eq('offer_a_id', offer.id)
        .eq('company_b_id', CURRENT_USER_COMPANY_ID)
        .maybeSingle();

      if (existingDeal) {
        router.push(`/deals/${existingDeal.id}`);
        return;
      }

      // 2. Create new barter deal record
      const { data: newDeal, error } = await supabase
        .from('barter_deals')
        .insert([
          {
            offer_a_id: offer.id,
            company_a_id: targetCompanyId,
            company_b_id: CURRENT_USER_COMPANY_ID,
            status: 'draft',
            signed_a: false,
            signed_b: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // 3. Send initial automated system message into deal room
      await supabase.from('deal_messages').insert([
        {
          deal_id: newDeal.id,
          sender_company_id: CURRENT_USER_COMPANY_ID,
          content: `🤝 Barter handshake proposal initiated for "${offer.title}". Let's finalize scope details!`,
        },
      ]);

      // 4. Direct route to Deal Room
      router.push(`/deals/${newDeal.id}`);
    } catch (err: unknown) {
      console.error('Error initiating barter:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all rounded-2xl overflow-hidden flex flex-col group shadow-xl">
      {/* 1. Video Player Container */}
      <div className="relative aspect-video bg-slate-950 overflow-hidden">
        {isPlaying ? (
          <video
            src={offer.video_url}
            controls
            autoPlay
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
            {offer.thumbnail_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={offer.thumbnail_url}
                alt={offer.title}
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-tr from-sky-950/40 via-slate-900 to-slate-950" />
            )}

            {/* Play Button Overlay */}
            <button
              onClick={() => setIsPlaying(true)}
              className="z-10 w-14 h-14 rounded-full bg-sky-500/90 hover:bg-sky-400 text-slate-950 flex items-center justify-center shadow-lg shadow-sky-500/20 transform hover:scale-110 transition-all cursor-pointer"
            >
              <Play className="w-6 h-6 fill-current ml-1" />
            </button>

            {/* Category & Value Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-900/90 text-sky-400 border border-slate-700/80 backdrop-blur-md">
                {offer.category}
              </span>
            </div>

            <div className="absolute top-3 right-3">
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-md flex items-center gap-0.5">
                <DollarSign className="w-3.5 h-3.5" />
                {offer.estimated_value?.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Content Details */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Company Badge */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <Building2 className="w-3.5 h-3.5 text-sky-400" />
              <span>{offer.companies?.name || 'Verified Startup'}</span>
              {offer.companies?.is_verified && (
                <BadgeCheck className="w-4 h-4 text-sky-400 fill-sky-500/10" />
              )}
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              {offer.scope === 'remote' ? (
                <span className="flex items-center gap-1 text-sky-400">
                  <Globe className="w-3 h-3" /> Remote
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {offer.companies?.location_name || 'Local'}
                </span>
              )}
            </div>
          </div>

          <h3 className="font-bold text-base text-white line-clamp-1 group-hover:text-sky-400 transition-colors">
            {offer.title}
          </h3>

          {/* Asset Exchange Grid */}
          <div className="mt-3 grid grid-cols-1 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block mb-0.5">
                Offering:
              </span>
              <p className="text-slate-300 line-clamp-2 leading-relaxed">
                {offer.offering_summary}
              </p>
            </div>
            <div className="border-t border-slate-800/60 pt-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-0.5">
                Looking For:
              </span>
              <p className="text-slate-300 line-clamp-2 leading-relaxed">
                {offer.looking_for_summary}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Initiate Barter CTA */}
        <button
          onClick={handleInitiateBarter}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-sky-500/10 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Opening Deal Room...
            </>
          ) : (
            <>
              <Handshake className="w-4 h-4" /> Initiate Barter Handshake
            </>
          )}
        </button>
      </div>
    </div>
  );
}