// scripts/test-inspection-flow.ts
import { signoffInspectionAction, raiseDisputeAction } from '@/app/actions/inspection';
import { createAdminClient } from '@/lib/supabase/server';

async function runTests() {
  console.log('🧪 Starting Inspection & Dispute Flow Tests...\n');

  const adminClient = createAdminClient();

  // 1. Setup Mock Test Deal & Company
  const { data: company, error: compErr } = await adminClient
    .from('companies')
    .select('id')
    .limit(1)
    .single();

  if (compErr || !company) {
    console.error('❌ Failed to find test company:', compErr);
    return;
  }

  const companyId = company.id;

  // Fetch or create a test deal in 'inspection' status
  const { data: deal, error: dealErr } = await adminClient
    .from('barter_deals')
    .select('id, status')
    .eq('status', 'inspection')
    .limit(1)
    .maybeSingle();

  if (dealErr) {
    console.error('❌ Failed to fetch test deal:', dealErr);
    return;
  }

  if (!deal) {
    console.log('ℹ️ No active deal in "inspection" state found. Please set a deal status to "inspection" to test.');
    return;
  }

  console.log(`📌 Found Active Deal ID: ${deal.id} (Current Status: ${deal.status})`);

  // 2. Test Inspection Sign-Off RPC Direct Execution
  console.log('\n--- Test 1: Executing signoff_trade_inspection RPC ---');
  const { data: signoffRes, error: signoffErr } = await adminClient.rpc(
    'signoff_trade_inspection',
    {
      p_deal_id: deal.id,
      p_company_id: companyId,
    }
  );

  if (signoffErr) {
    console.error('❌ Sign-off RPC Failed:', signoffErr.message);
  } else {
    console.log('✅ Sign-off RPC Succeeded:', signoffRes);
  }

  // Verify database state updated
  const { data: updatedDeal } = await adminClient
    .from('barter_deals')
    .select('status')
    .eq('id', deal.id)
    .single();

  console.log(`📊 Updated Deal Status: ${updatedDeal?.status}`);

  // 3. Test Dispute Mechanism
  console.log('\n--- Test 2: Resetting Deal & Executing raise_trade_dispute RPC ---');
  
  // Temporarily reset status back to inspection for dispute test
  await adminClient
    .from('barter_deals')
    .update({ status: 'inspection' })
    .eq('id', deal.id);

  const { data: disputeRes, error: disputeErr } = await adminClient.rpc(
    'raise_trade_dispute',
    {
      p_deal_id: deal.id,
      p_company_id: companyId,
      p_reason: 'Automated Test: Delivered item did not meet specified grade.',
    }
  );

  if (disputeErr) {
    console.error('❌ Dispute RPC Failed:', disputeErr.message);
  } else {
    console.log('✅ Dispute RPC Succeeded:', disputeRes);
  }

  const { data: disputedDeal } = await adminClient
    .from('barter_deals')
    .select('status')
    .eq('id', deal.id)
    .single();

  console.log(`📊 Final Deal Status: ${disputedDeal?.status}`);
}

runTests().catch(console.error);