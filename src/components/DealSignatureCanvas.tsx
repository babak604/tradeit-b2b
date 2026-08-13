'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, RotateCcw, PenTool } from 'lucide-react';

interface DealSignatureCanvasProps {
  signerTitle: string;
  onSaveSignature: (dataUrl: string) => void;
}

export default function DealSignatureCanvas({ signerTitle, onSaveSignature }: DealSignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = '#22c55e'; // Green signature ink
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasSigned(false);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSigned) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSaveSignature(dataUrl);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between text-xs font-bold text-slate-300">
        <span className="flex items-center gap-1.5">
          <PenTool className="w-4 h-4 text-emerald-400" />
          {signerTitle}
        </span>
        <span className="text-[10px] text-slate-500 font-mono">DIGITAL VERIFICATION</span>
      </div>

      <div className="relative border border-slate-700/80 rounded-xl bg-slate-950 overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={450}
          height={120}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-[120px] touch-none"
        />
        {!hasSigned && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-600 text-xs font-medium">
            Draw signature inside boundary
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          onClick={clearCanvas}
          variant="outline"
          className="bg-slate-950 border-slate-800 text-slate-400 hover:text-white h-8 text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          Clear
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={!hasSigned}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold h-8 text-xs"
        >
          <Check className="w-3.5 h-3.5 mr-1" />
          Attach Signature
        </Button>
      </div>
    </div>
  );
}