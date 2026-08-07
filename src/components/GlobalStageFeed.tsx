'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function GlobalStageFeed() {
  const [pitches, setPitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Prevent Next.js SSR Hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    async function fetchPitches() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('trades')
          .select('*');

        if (error) {
          console.error('Database query error:', error);
          setErrorMsg(error.message);
          return;
        }

        if (data && Array.isArray(data)) {
          const formatted = data.map((item) => {
            let url = item.video_url || '';
            if (url && !url.startsWith('http')) {
              const { data: urlData } = supabase.storage
                .from('trade-pitches')
                .getPublicUrl(url);
              url = urlData?.publicUrl || url;
            }
            return {
              id: item.id || String(Math.random()),
              video_url: url,
              offering_tag: item.offering_tag || 'Unspecified Offer',
              seeking_tag: item.seeking_tag || 'Unspecified Need',
              amount: item.amount ?? item.value_amount ?? 0,
              is_local_physical: Boolean(item.is_local_physical),
            };
          });

          setPitches(formatted);
        }
      } catch (err: any) {
        console.error('Feed exception:', err);
        setErrorMsg(err?.message || 'Failed to load stage feed');
      } finally {
        setLoading(false);
      }
    }

    fetchPitches();
  }, [mounted]);

  if (!mounted) {
    return ;
  }

  if (loading) {
    return (
      
        
        Loading stage feed...
      
    );
  }

  if (errorMsg) {
    return (
      
        Feed Runtime Error
        {errorMsg}
      
    );
  }

  if (pitches.length === 0) {
    return (
      
        No live trade pitches on stage.
        
          Broadcast First Pitch
        
      
    );
  }

  return (
    
      {pitches.map((pitch) => (
        
          

           setIsMuted(!isMuted)}
            className="absolute top-6 right-6 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/20 rounded-full text-xs font-mono font-bold text-white z-20"
          >
            {isMuted ? '🔇 MUTED' : '🔊 UNMUTED'}
          

          
            
              
                OFFERING
              
              
                ${pitch.amount} CAD
              
            

            
              {pitch.offering_tag}
            

            
              
                
                  SEEKING
                
                
                  {pitch.seeking_tag}
                
              

              
                {pitch.is_local_physical ? '📍 Local' : '🌐 Global'}
              
            
          
        
      ))}
    
  );
}