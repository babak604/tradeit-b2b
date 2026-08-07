import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import DisputeWorkspace from '@/components/disputes/DisputeWorkspace';

interface DisputePageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function DisputePage({ params }: DisputePageProps) {
  const resolvedParams = await Promise.resolve(params);
  const dealId = resolvedParams.id;

  if (!dealId) {
    notFound();
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Fetch deal details with joined company names
  const { data: deal, error: dealError } = await supabase
    .from('barter_deals')
    .select(`
      *,
      company_a:company_a_id(id, name),
      company_b:company_b_id(id, name)
    `)
    .eq('id', dealId)
    .single();

  if (dealError || !deal) {
    notFound();
  }

  // Determine user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isArbitrator = profile?.role === 'ADMIN' || profile?.role === 'ARBITRATOR';
  const disputeWorkspaceProps = {
    deal: deal as any,
    isArbitrator,
  } as any;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <DisputeWorkspace {...disputeWorkspaceProps} />
    </main>
  );
}