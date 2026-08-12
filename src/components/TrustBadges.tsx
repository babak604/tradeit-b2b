import { ShieldCheck, CheckCircle2, Award, Zap } from 'lucide-react';

export default function TrustBadges({ isPassHolder = true, completionRate = 100 }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
      <span className="flex items-center gap-1 bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
        <ShieldCheck className="w-3 h-3" /> Entity Verified
      </span>
      {isPassHolder && (
        <span className="flex items-center gap-1 bg-amber-950/80 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full font-bold">
          <Award className="w-3 h-3" /> Annual Pass Member
        </span>
      )}
      <span className="flex items-center gap-1 bg-blue-950/80 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-full font-bold">
        <CheckCircle2 className="w-3 h-3" /> {completionRate}% Escrow Record
      </span>
    </div>
  );
}