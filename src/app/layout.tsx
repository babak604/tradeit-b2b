import { createClient } from '@/lib/supabase/server';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { RealtimeDealListener } from '@/components/providers/RealtimeDealListener';
import '@/app/globals.css';

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
      .single();
    companyId = profile?.company_id || '';
  }

  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-sky-500 selection:text-white">
        <ToastProvider>
          {companyId && <RealtimeDealListener companyId={companyId} />}
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}