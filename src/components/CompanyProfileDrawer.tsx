'use client';

import { X, Building2, MapPin, ShieldCheck, ArrowUpRight, ArrowDownLeft, Award, CheckCircle2 } from 'lucide-react';

interface CompanyProfileDrawerProps {
  companyName: string | null;
  locationName?: string;
  onClose: () => void;
}

export default function CompanyProfileDrawer({ 
  companyName, 
  locationName = 'Montreal, QC', 
  onClose 
}: CompanyProfileDrawerProps) {
  if (!companyName) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h3 className="font-extrabold text-white text-sm">COMPANY NETWORK PROFILE</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Company Card */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-black text-white">{companyName}</h2>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                <MapPin className="w-3 h-3 text-red-400" /> {locationName}
              </p>
            </div>
            <span className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 flex items-center gap-1 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" /> Verified
            </span>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900 text-center">
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Network Parity Score</p>
              <p className="text-sm font-black text-emerald-400 font-mono">99.4%</p>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Swaps Completed</p>
              <p className="text-sm font-black text-white font-mono">14 Executed</p>
            </div>
          </div>
        </div>

        {/* Badges & Trust Badges */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Network Credentials</h4>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-slate-950 border border-slate-800 text-slate-300 px-3 py-1 rounded-xl flex items-center gap-1.5 font-medium">
              <Award className="w-3.5 h-3.5 text-amber-400" /> Top Tier Contributor
            </span>
            <span className="bg-slate-950 border border-slate-800 text-slate-300 px-3 py-1 rounded-xl flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Zero Dispute Record
            </span>
          </div>
        </div>

        {/* Active Stage Offers */}
        <div className="space-y-3">
          <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Active Stage Postings</h4>
          
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <div>
              <span className="text-[10px] font-extrabold text-emerald-400 uppercase flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> Offer
              </span>
              <p className="text-slate-200 font-medium">50 Hours Studio Video Production or Retail Stock</p>
            </div>
            <div className="border-t border-slate-900 pt-1.5">
              <span className="text-[10px] font-extrabold text-blue-400 uppercase flex items-center gap-1">
                <ArrowDownLeft className="w-3 h-3" /> Need
              </span>
              <p className="text-slate-200 font-medium">Downtown Coworking / Commercial Office Space</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <button
        onClick={onClose}
        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2.5 rounded-xl cursor-pointer"
      >
        Close Profile
      </button>

    </div>
  );
}