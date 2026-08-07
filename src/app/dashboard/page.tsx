import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import DashboardClient from '@/components/DashboardClient';

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Verify Authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // 2. Fetch User Credit Balance
  const { data: balanceData } = await supabase
    .from('user_balances')
    .select('available_credits, escrow_credits')
    .eq('user_id', user.id)
    .single();

  const balance = balanceData || { available_credits: 0, escrow_credits: 0 };

  // 3. Fetch User Active Listings
  const { data: listingsData } = await supabase
    .from('user_listings')
    .select('id, title, price, status, description')
    .eq('user_id', user.id)
    .eq('status', 'active');

  const listings = listingsData || [];

  return (
    <DashboardClient
      initialBalance={{
        available_credits: Number(balance.available_credits),
        escrow_credits: Number(balance.escrow_credits),
      }}
      listings={listings}
      userEmail={user.email}
    />
  );
}