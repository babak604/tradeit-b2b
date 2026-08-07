'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mail, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Use central browser singleton client
  const supabase = createClient();

  if (!isOpen) return null;

  // 1. Google OAuth
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) setMessage({ type: 'error', text: error.message });
    setLoading(false);
  };

  // 2. Apple Sign-In
  const handleAppleSignIn = async () => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setMessage({ type: 'error', text: error.message });
    setLoading(false);
  };

  // 3. LinkedIn OIDC Sign-In
  const handleLinkedInSignIn = async () => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'openid profile email',
      },
    });
    if (error) setMessage({ type: 'error', text: error.message });
    setLoading(false);
  };

  // 4. Email Magic Link
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Check your email for the secure magic login link!' });
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
        >
          ✕
        </button>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Sparkles className="w-3 h-3" /> Enterprise SSO & Auth
          </div>
          <h2 className="text-2xl font-extrabold text-white">Access TradeIt.tv</h2>
          <p className="text-xs text-slate-400">Sign in to manage corporate barter deals and non-monetary trades.</p>
        </div>

        {/* Feedback Message */}
        {message && (
          <div
            className={`p-3 rounded-2xl text-xs font-medium flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="space-y-2.5">
          {/* LinkedIn OIDC */}
          <button
            onClick={handleLinkedInSignIn}
            disabled={loading}
            className="w-full py-3 px-4 rounded-2xl bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 text-[#0A66C2] font-bold text-xs flex items-center justify-center gap-3 border border-[#0A66C2]/30 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current text-[#0A66C2]" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.78a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26Z" />
            </svg>
            <span>Continue with LinkedIn</span>
          </button>

          {/* Google */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs flex items-center justify-center gap-3 border border-slate-700 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z" />
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Apple */}
          <button
            onClick={handleAppleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 rounded-2xl bg-white text-slate-950 hover:bg-slate-200 font-bold text-xs flex items-center justify-center gap-3 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.16-1.9-14.48-6.08-3.37-2.72-7.29-7.43-11.77-14.12-6.3-9.42-11.36-20.08-15.18-32.01-3.82-11.92-5.73-23.36-5.73-34.31 0-14.32 3.53-26.17 10.59-35.53 7.06-9.36 16.03-14.09 26.92-14.2 4.45 0 9.48 1.15 15.08 3.45 5.6 2.3 9.48 3.45 11.63 3.45 1.95 0 5.92-1.2 11.92-3.6 6-2.4 11.07-3.5 15.22-3.3 12.01.52 21.6 4.88 28.77 13.08-10.74 6.5-16.01 15.53-15.8 27.1.21 9.01 3.58 16.51 10.11 22.5 6.53 5.99 14.37 9.3 23.51 9.93-2.5 7.5-5.87 15.11-10.11 22.83zM119.22 31.08c0-7.1 2.53-13.82 7.59-20.17 5.06-6.35 11.45-10.23 19.16-11.64.13.91.2 1.76.2 2.54 0 7.21-2.61 14.06-7.83 20.55-5.22 6.49-11.68 10.37-19.38 11.64-.13-.78-.2-1.74-.2-2.92z" />
            </svg>
            <span>Continue with Apple</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
          <span className="relative bg-slate-900 px-3 text-[10px] font-mono text-slate-500 uppercase font-bold">Or Email Magic Link</span>
        </div>

        {/* Email Passwordless Magic Link */}
        <form onSubmit={handleEmailSignIn} className="space-y-3">
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="work@company.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
          >
            {loading ? 'Sending Magic Link...' : 'Send Magic Link'}
          </button>
        </form>
      </div>
    </div>
  );
}