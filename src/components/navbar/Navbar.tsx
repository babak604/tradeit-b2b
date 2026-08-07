import { createClient } from '@/utils/supabase/server';
import CreditBalanceBadge from './CreditBalanceBadge';

export async function Navbar() {
  const supabase = await createClient();

  // Get current authenticated user session
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch initial credit balance server-side to prevent layout shift
  const { data: balanceData } = await supabase
    .from('trade_credit_balances')
    .select('available_balance, escrow_balance')
    .eq('company_id', user.id)
    .single();

  const initialAvailable = Number(balanceData?.available_balance ?? 0);
  const initialEscrow = Number(balanceData?.escrow_balance ?? 0);

  return (
    <header className="w-full border-b border-zinc-800 bg-zinc-950 px-6 py-3 flex justify-between items-center">
      <div className="font-bold text-zinc-100 tracking-tight text-lg">
        TradeIt <span className="text-zinc-500 font-normal text-sm">B2B</span>
      </div>

      <div className="flex items-center gap-4">
        <CreditBalanceBadge
          companyId={user.id}
          initialAvailable={initialAvailable}
          initialEscrow={initialEscrow}
        />
      </div>
    </header>
  );
}