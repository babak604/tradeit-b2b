import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static image/asset extensions (.svg, .png, .jpg, etc.)
     * - public Web3 routes (/escrow, /deals)
     */
    '/((?!_next/static|_next/image|favicon.ico|escrow|deals|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};