'use client';

import React from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';

import { Layers, ShieldCheck, Box } from 'lucide-react';

interface CircularDealGraphProps {
  companyA: { name: string; offer: string; value: number; isRWA?: boolean };
  companyB: { name: string; offer: string; value: number; isRWA?: boolean };
  companyC?: { name: string; offer: string; value: number; isRWA?: boolean };
}

export default function CircularDealGraph({
  companyA,
  companyB,
  companyC,
}: CircularDealGraphProps) {
  const is3Way = !!companyC;

  // Node Positions (Triangle layout for 3-way, Line for 2-way)
  const initialNodes: Node[] = [
    {
      id: 'A',
      position: { x: 250, y: 50 },
      data: {
        label: (
          <div className="p-3 bg-slate-900 border border-sky-500/50 rounded-xl text-left space-y-1">
            <div className="text-[10px] font-mono text-sky-400 font-bold uppercase flex items-center gap-1">
              {companyA.isRWA ? <Box className="w-3 h-3 text-amber-400" /> : <Layers className="w-3 h-3" />}
              {companyA.name}
            </div>
            <div className="text-xs text-white font-bold">{companyA.offer}</div>
            <div className="text-[11px] font-mono text-emerald-400">${companyA.value.toLocaleString()} CAD</div>
          </div>
        ),
      },
      style: { background: 'transparent', border: 'none', width: 180 },
    },
    {
      id: 'B',
      position: is3Way ? { x: 450, y: 280 } : { x: 250, y: 280 },
      data: {
        label: (
          <div className="p-3 bg-slate-900 border border-emerald-500/50 rounded-xl text-left space-y-1">
            <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1">
              {companyB.isRWA ? <Box className="w-3 h-3 text-amber-400" /> : <Layers className="w-3 h-3" />}
              {companyB.name}
            </div>
            <div className="text-xs text-white font-bold">{companyB.offer}</div>
            <div className="text-[11px] font-mono text-emerald-400">${companyB.value.toLocaleString()} CAD</div>
          </div>
        ),
      },
      style: { background: 'transparent', border: 'none', width: 180 },
    },
  ];

  if (is3Way && companyC) {
    initialNodes.push({
      id: 'C',
      position: { x: 50, y: 280 },
      data: {
        label: (
          <div className="p-3 bg-slate-900 border border-amber-500/50 rounded-xl text-left space-y-1">
            <div className="text-[10px] font-mono text-amber-400 font-bold uppercase flex items-center gap-1">
              {companyC.isRWA ? <Box className="w-3 h-3 text-amber-400" /> : <Layers className="w-3 h-3" />}
              {companyC.name}
            </div>
            <div className="text-xs text-white font-bold">{companyC.offer}</div>
            <div className="text-[11px] font-mono text-emerald-400">${companyC.value.toLocaleString()} CAD</div>
          </div>
        ),
      },
      style: { background: 'transparent', border: 'none', width: 180 },
    });
  }

  // Directed Flow Edges
  const initialEdges: Edge[] = is3Way
    ? [
        {
          id: 'e-A-B',
          source: 'A',
          target: 'B',
          animated: true,
          label: `$${companyB.value.toLocaleString()} Trade`,
          style: { stroke: '#0ea5e9', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#0ea5e9' },
        },
        {
          id: 'e-A-C',
          source: 'A',
          target: 'C',
          animated: true,
          label: `$${(companyA.value - companyB.value).toLocaleString()} Delta RWA/Service`,
          style: { stroke: '#f59e0b', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
        },
        {
          id: 'e-C-A',
          source: 'C',
          target: 'A',
          animated: true,
          label: 'Loop Closure',
          style: { stroke: '#10b981', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
        },
      ]
    : [
        {
          id: 'e-A-B',
          source: 'A',
          target: 'B',
          animated: true,
          label: '1:1 Direct Barter',
          style: { stroke: '#10b981', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
        },
      ];

  return (
    <div className="w-full h-[420px] bg-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-mono text-slate-300">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        {is3Way ? 'Absorptive 3-Way Multigraph Loop' : '1:1 Reciprocal Trade'}
      </div>
      <ReactFlow nodes={initialNodes} edges={initialEdges} fitView>
        <Background color="#334155" gap={16} />
        <Controls className="bg-slate-900 border-slate-800 text-white" />
      </ReactFlow>
    </div>
  );
}