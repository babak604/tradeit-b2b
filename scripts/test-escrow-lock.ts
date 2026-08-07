import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testEscrowLock() {
  console.log('🔒 Testing escrow locking via admin_lock_deal_escrow...');

  // 1. Query latest seeded deal
  const { data: deal, error: dealErr } = await supabase
    .from('barter_deals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (dealErr || !deal) {
    console.error('❌ Could not fetch active deal:', dealErr);
    return;
  }

  console.log(`🎯 Testing Deal ID: ${deal.id}`);
  console.log(`🏢 Company A: ${deal.company_a_id}`);
  console.log(`🏢 Company B: ${deal.company_b_id}`);

  // 2. Lock Escrow for Company A
  console.log('\n⏳ Locking Escrow for Company A...');
  const { data: resA, error: errA } = await supabase.rpc('admin_lock_deal_escrow', {
    p_deal_id: deal.id,
    p_company_id: deal.company_a_id,
  });

  if (errA) {
    console.error('❌ Lock failed for Company A:', errA);
    return;
  }
  console.log('✅ Company A Response:', resA);

  // 3. Lock Escrow for Company B (Triggers status transition to pending_signatures)
  console.log('\n⏳ Locking Escrow for Company B...');
  const { data: resB, error: errB } = await supabase.rpc('admin_lock_deal_escrow', {
    p_deal_id: deal.id,
    p_company_id: deal.company_b_id,
  });

  if (errB) {
    console.error('❌ Lock failed for Company B:', errB);
    return;
  }
  console.log('✅ Company B Response:', resB);

  // 4. Verify deal state transition
  const { data: finalDeal } = await supabase
    .from('barter_deals')
    .select('*')
    .eq('id', deal.id)
    .single();

  console.log('\n📊 Final barter_deals State:');
  console.dir(finalDeal, { depth: null });
}

testEscrowLock();