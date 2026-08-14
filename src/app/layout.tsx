import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TradeIt B2B Network | Reciprocal Barter & Tokenization Platform',
  description: 'Enterprise reciprocal trading, circular loop matching, and RWA tokenization engine on Solana.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-[#4a6370]">
      <body className="bg-[#4a6370] text-slate-100 min-h-screen antialiased selection:bg-[#384c57] selection:text-white">
        {children}
      </body>
    </html>
  );
}