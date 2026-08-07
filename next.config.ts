import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

// Soft-check required environment variables during build, hard error on runtime/server boot
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY', // Added for privileged escrow RPC operations
  'OPENAI_API_KEY',
];

const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  const errorMessage =
    `\n❌ [ENVIRONMENT WARNING] Missing required environment variables:\n` +
    missingEnvVars.map((v) => `   - ${v}`).join('\n') +
    `\n\nPlease ensure these exist in .env.local or your deployment configuration.\n`;

  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    console.warn(errorMessage);
  } else if (process.env.NODE_ENV === 'development') {
    console.warn(errorMessage);
  }
}

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  workboxOptions: {
    skipWaiting: true,
  },
});

const nextConfig: NextConfig = {
  // serverActions options inside experimental
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  turbopack: {},
};

export default withPWA(nextConfig);