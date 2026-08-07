import { FileText } from "lucide-react";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <a
      href={`/api/deals/${params.id}/pdf`}
      target="_blank"
      rel="noopener noreferrer"
      className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-mono text-xs rounded-xl transition-all flex items-center gap-2"
    >
      <FileText className="w-4 h-4 text-sky-400" />
      <span>Export PDF Contract</span>
    </a>
  );
}