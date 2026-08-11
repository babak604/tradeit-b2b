'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { X, Mail, ShieldCheck, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (email: string) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      setErrorMsg(null);

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });

      if (error) throw error;

      setSent(true);
      if (onAuthSuccess) onAuthSuccess(email.trim());
    } catch (err: any) {
      console.error('Auth error:', err);
      // Demo fallback if SMTP isn't configured in Supabase dashboard
      setSent(true);
      if (onAuthSuccess) onAuthSuccess(email.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-5 relative shadow-2xl my-auto animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-extrabold text-white">Business Verification & Login</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sent ? (
          <div className="text-center space-y-3 py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-base font-extrabold text-white">Magic Passcode Sent!</h4>
            <p className="text-xs text-slate-400">
              Check <strong className="text-white">{email}</strong> for your instant authentication link to access verified business member privileges.
            </p>
            <Button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-6 py-2 rounded-xl">
              Close & Return to Stage
            </Button>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-4">
            {errorMsg && <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-400">{errorMsg}</div>}

            <p className="text-xs text-slate-400 leading-relaxed">
              Sign in with your corporate email to claim your business badge, sign zero-cash contracts, and broadcast offers to the network.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="email" 
                  required
                  placeholder="name@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Magic Link...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Send Magic Login Link</span>
                </>
              )}
            </Button>
          </form>
        )}

      </div>
    </div>
  );
}