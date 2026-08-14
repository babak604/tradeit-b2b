'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tornado, Plus, LogIn, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';

const AuthModal = dynamic(() => import('@/components/AuthModal'), { ssr: false });
const PitchUpload = dynamic(() => import('@/components/PitchUpload'), { ssr: false });

export default function Header() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setCurrentUser(session.user.email);
    });
  }, []);

  return (
    <>
      <header className="border-b border-white/10 bg-[#425965]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-2xl border border-white/20 shadow-sm">
              <Tornado className="w-5 h-5 text-amber-400" />
            </div>
            <span className="font-extrabold text-lg tracking-wider text-white">
              TRADEIT <span className="text-xs font-mono text-amber-300 px-2 py-0.5 bg-amber-400/10 border border-amber-400/30 rounded-full ml-1 font-bold">B2B NETWORK</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-xs font-medium text-slate-200">
            <Link href="/#how-it-works" className="hover:text-amber-300 transition-colors">How It Works</Link>
            <Link href="/rwa" className="hover:text-amber-300 transition-colors">RWA Studio</Link>
            <Link href="/pricing" className="hover:text-amber-300 transition-colors">Pricing</Link>
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          {currentUser ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-900/40 border border-emerald-400/30 rounded-full text-xs font-medium text-emerald-200">
              <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span className="truncate max-w-[140px]">{currentUser}</span>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-xs rounded-full font-bold cursor-pointer transition-all flex items-center gap-1.5 text-white"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}

          <Button
            onClick={() => setIsUploadOpen(true)}
            className="bg-white text-[#334652] hover:bg-slate-100 font-extrabold text-xs px-5 h-9 rounded-full shadow-lg flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 text-[#334652]" />
            <span>Post Trade Offer</span>
          </Button>
        </div>
      </header>

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onAuthSuccess={(email) => { setCurrentUser(email); setIsAuthOpen(false); }} 
      />
      <PitchUpload 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onUploadSuccess={() => window.location.reload()} 
      />
    </>
  );
}