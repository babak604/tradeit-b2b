// src/app/api/match/route.ts
import { NextRequest } from 'next/server';
import { POST as matchOffersHandler } from '../offers/match/route';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Delegate directly to the full offers/match handler
  return matchOffersHandler(req);
}