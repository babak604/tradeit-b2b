import { createClient } from '@/lib/supabase/server';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { RealtimeDealListener } from '@/components/providers/RealtimeDealListener';
// @ts-expect-error Next.js handles this CSS side-effect import at build time.
import './globals.css';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Fetch company ID server-side to initialize listener cleanly
  const { data: { user } } = await supabase.auth.getUser();
  let companyId = '';

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle();

    // Fallback: If no company_id in profiles, use user.id directly
    companyId = profile?.company_id || user.id;
  }

  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-sky-500 selection:text-white hide-scrollbar">
        <ToastProvider>
          {companyId && <RealtimeDealListener companyId={companyId} />}
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}