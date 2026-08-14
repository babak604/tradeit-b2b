'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { 
  Coins, FileCheck, KeyRound, Loader2, 
  Layers, Building2, Truck, Package, Wheat, FileText
} from 'lucide-react';

export default function RwaStudioPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('Invoices');
  const [assetValuation, setAssetValuation] = useState<number>(150000);
  const [docName, setDocName] = useState<string>('COMMERCIAL_INVOICE_9920.pdf');
  const [fractionalShares, setFractionalShares] = useState<number>(100);
  const [enforceToken2022, setEnforceToken2022] = useState<boolean>(true);

  const [mintStage, setMintStage] = useState<'idle' | 'hashing' | 'minting' | 'complete'>('idle');
  const [mintResult, setMintResult] = useState<any>(null);

  const categories = [
    { id: 'Invoices', name: 'Commercial Invoices', icon: FileText, desc: 'Unpaid B2B accounts receivable & trade credit notes.' },
    { id: 'Fleet', name: 'Equipment & Fleet', icon: Truck, desc: 'Heavy machinery, vehicle fleets, and manufacturing equipment.' },
    { id: 'Cargo', name: 'Freight & Cargo', icon: Package, desc: 'Containerized freight stock and logistics inventory.' },
    { id: 'Agri', name: 'Commodities', icon: Wheat, desc: 'Agricultural produce, raw materials, and energy credits.' },
    { id: 'Space', name: 'Commercial Space', icon: Building2, desc: 'Co-working leases, warehouse space, and studio hours.' },
  ];

  const handleExecuteMint = () => {
    setMintStage('hashing');
    setMintResult(null);

    setTimeout(() => {
      setMintStage('minting');
      setTimeout(() => {
        const hash = '0x' + Array.from({length: 16}, () => Math.floor(Math.random()*16).toString(16)).join('');
        setMintResult({
          mintAddress: 'RWA_SOL_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
          category: selectedCategory,
          valuation: assetValuation,
          shares: fractionalShares,
          sharePrice: (assetValuation / fractionalShares).toFixed(2),
          docHash: hash,
          standard: enforceToken2022 ? 'Solana Token-2022 (Transfer Hooks Enforced)' : 'SPL Token Standard',
          timestamp: new Date().toLocaleTimeString(),
        });
        setMintStage('complete');
      }, 1200);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#4a6370] text-slate-100 flex flex-col font-sans">
      
      {/* SHARED UNIFIED HEADER */}
      <Header />

      {/* MAIN CONTENT */}
      <main className="max-w-[1300px] w-full mx-auto p-6 sm:p-10 space-y-12 flex-1">
        
        {/* HERO */}
        <div className="space-y-3 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/10 border border-amber-400/30 rounded-full text-xs font-semibold text-amber-300">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Institutional Asset Provenance</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white">Institutional Asset Tokenization</h1>
          <p className="text-sm text-slate-200 max-w-2xl leading-relaxed">
            Transform physical commercial assets into compliant, on-chain Solana Token-2022 digital assets. Use tokenized RWAs as collateral or parity backing in 2-of-2 trade escrows.
          </p>
        </div>

        {/* CATEGORY SELECTION */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                  isSelected 
                    ? 'bg-[#3b505d] border-amber-400 text-white shadow-xl' 
                    : 'bg-[#2d404b] border-white/10 text-slate-300 hover:border-white/30'
                }`}
              >
                <Icon className={`w-6 h-6 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                <h3 className="font-bold text-xs">{cat.name}</h3>
                <p className="text-[10px] text-slate-300 leading-tight">{cat.desc}</p>
              </div>
            );
          })}
        </div>

        {/* INTERACTIVE MINTING STUDIO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT 7 COLS: PARAMETERS */}
          <div className="lg:col-span-7 bg-[#3b505d] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <span>Configure Asset Parameters</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-200 mb-1 font-medium">Appraised Valuation ($ USD)</label>
                <input
                  type="number"
                  value={assetValuation}
                  onChange={(e) => setAssetValuation(Number(e.target.value))}
                  className="w-full rounded-xl bg-[#2d404b] border border-white/20 p-3 text-white font-mono focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-200 mb-1 font-medium">Fractional Shares</label>
                <input
                  type="number"
                  value={fractionalShares}
                  onChange={(e) => setFractionalShares(Number(e.target.value))}
                  className="w-full rounded-xl bg-[#2d404b] border border-white/20 p-3 text-white font-mono focus:outline-none font-bold"
                />
              </div>
            </div>

            <div className="text-xs space-y-1">
              <label className="block text-slate-200 font-medium">Verified Legal PDF Attachment</label>
              <div className="flex items-center gap-2 bg-[#2d404b] border border-white/20 rounded-xl p-3">
                <FileCheck className="w-4 h-4 text-amber-400" />
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="bg-transparent text-white font-mono text-xs w-full focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#2d404b] border border-white/15 rounded-2xl text-xs">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="font-bold text-white block">Token-2022 Transfer Hook Enforcement</span>
                  <span className="text-[10px] text-slate-300">Requires multi-sig escrow verification prior to on-chain transfer.</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={enforceToken2022}
                onChange={(e) => setEnforceToken2022(e.target.checked)}
                className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
              />
            </div>

            <button
              onClick={handleExecuteMint}
              disabled={mintStage === 'hashing' || mintStage === 'minting'}
              className="w-full py-3.5 bg-white hover:bg-slate-100 text-[#334652] font-black text-xs rounded-full shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {mintStage === 'hashing' && <><Loader2 className="w-4 h-4 animate-spin" /> <span>Hashing Legal Document...</span></>}
              {mintStage === 'minting' && <><Loader2 className="w-4 h-4 animate-spin" /> <span>Minting Token-2022 SPL Asset...</span></>}
              {(mintStage === 'idle' || mintStage === 'complete') && <span>⚡ Mint Compliant RWA Asset Token</span>}
            </button>
          </div>

          {/* RIGHT 5 COLS: PROVENANCE RESULT */}
          <div className="lg:col-span-5 bg-[#2d404b] border border-white/15 rounded-3xl p-6 space-y-4 font-mono text-xs shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-slate-300 uppercase text-[10px]">On-Chain Asset Provenance</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${mintResult ? "bg-emerald-900/60 text-emerald-200 border border-emerald-400/30" : "bg-white/10 text-slate-300"}`}>
                {mintResult ? "MINTED ON SOLANA" : "AWAITING MINT"}
              </span>
            </div>

            {mintResult ? (
              <div className="space-y-3 text-slate-200">
                <div className="flex justify-between"><span className="text-slate-400">Mint Address:</span> <span className="text-amber-300 font-bold">{mintResult.mintAddress}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Category:</span> <span>{mintResult.category}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Valuation:</span> <span className="text-emerald-300">${mintResult.valuation.toLocaleString()} USD</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Shares:</span> <span>{mintResult.shares} (${mintResult.sharePrice}/share)</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Doc Hash:</span> <span className="text-slate-300 text-[10px]">{mintResult.docHash}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Standard:</span> <span className="text-sky-200 font-bold">{mintResult.standard}</span></div>

                <div className="pt-3 border-t border-white/10 text-[11px] text-emerald-200">
                  ✓ Verified and ready for 2-of-2 Escrow Staking
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-300 space-y-2 font-sans">
                <Coins className="w-8 h-8 text-amber-400 mx-auto opacity-60" />
                <p className="text-xs">Configure your parameters on the left and click mint to simulate on-chain asset creation.</p>
              </div>
            )}
          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#24333b] py-6 px-6 text-xs text-slate-300 flex items-center justify-between">
        <div><strong>TradeIt RWA Engine</strong> • Solana Token-2022 Compliant</div>
        <Link href="/" className="hover:text-white">Back to Dashboard</Link>
      </footer>

    </div>
  );
}