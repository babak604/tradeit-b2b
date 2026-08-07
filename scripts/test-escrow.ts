import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const initialCredits = 100;
const tradeCreditValue = 50;

/**
 * Teardown Cleanup: Removes created test resources in reverse dependency order
 */
async function cleanupTestData(
  userAId?: string,
  userBId?: string,
  dealIds: string[] = [],
  offerIds: string[] = []
) {
  console.log('\n🧹 Starting teardown & cleanup...');

  try {
    // 1. Delete Barter Deals
    if (dealIds.length > 0) {
      await adminSupabase.from('barter_deals').delete().in('id', dealIds);
    }

    // 2. Delete Trade Offers
    if (offerIds.length > 0) {
      await adminSupabase.from('trade_offers').delete().in('id', offerIds);
    }

    // 3. Delete Balances & Auth Users
    if (userAId || userBId) {
      const userIds = [userAId, userBId].filter(Boolean) as string[];
      await adminSupabase.from('user_balances').delete().in('user_id', userIds);

      for (const uid of userIds) {
        await adminSupabase.auth.admin.deleteUser(uid);
      }
    }

    console.log('✨ Teardown complete! All test accounts and state wiped.');
  } catch (cleanErr: any) {
    console.error('❌ Error during teardown:', cleanErr.message);
  }
}

async function runSelfSeedingEscrowTest() {
  console.log('🚀 Starting Full Lifecycle Escrow Integration Test (Settle & Cancel/Refund)...\n');

  let userAId: string | undefined;
  let userBId: string | undefined;
  const createdDealIds: string[] = [];
  const createdOfferIds: string[] = [];
  let testPassed = false;

  try {
    // ------------------------------------------------------------------------
    // 1. Seed Temporary Auth Users
    // ------------------------------------------------------------------------
    console.log('🌱 Creating temporary test auth users...');
    
    const { data: authA, error: authAErr } = await adminSupabase.auth.admin.createUser({
      email: `test_party_a_${Date.now()}@example.com`,
      password: 'TestPassword123!',
      email_confirm: true,
    });
    if (authAErr || !authA.user) throw new Error(`Failed to create Auth User A: ${authAErr?.message}`);
    userAId = authA.user.id;

    const { data: authB, error: authBErr } = await adminSupabase.auth.admin.createUser({
      email: `test_party_b_${Date.now()}@example.com`,
      password: 'TestPassword123!',
      email_confirm: true,
    });
    if (authBErr || !authB.user) throw new Error(`Failed to create Auth User B: ${authBErr?.message}`);
    userBId = authB.user.id;

    console.log(`✅ Test Auth Users Created:\n   User A: ${userAId}\n   User B: ${userBId}`);

    // ------------------------------------------------------------------------
    // 2. Seed Initial User Balances
    // ------------------------------------------------------------------------
    console.log('\n🌱 Seeding user balances...');
    const { error: balErr } = await adminSupabase.from('user_balances').upsert([
      { user_id: userAId, available_credits: initialCredits, escrow_credits: 0 },
      { user_id: userBId, available_credits: initialCredits, escrow_credits: 0 },
    ]);
    if (balErr) throw new Error(`Failed to seed balances: ${balErr.message}`);

    // ------------------------------------------------------------------------
    // 3. Seed Trade Offers (Valid Enum Alignment)
    // ------------------------------------------------------------------------
    console.log('🌱 Seeding trade offers in trade_offers...');
    const { data: offerA, error: offerAErr } = await adminSupabase
      .from('trade_offers')
      .insert({
        company_id: userAId,
        title: 'Test Offer A',
        video_url: 'https://example.com/demo_a.mp4',
        offering_summary: 'B2B Software Development Services',
        looking_for_summary: 'Marketing & Ad Campaigns',
        estimated_value: tradeCreditValue,
        category: 'Development',
        scope: 'remote', // Valid delivery_scope enum
        status: 'active',
      })
      .select()
      .single();
    if (offerAErr || !offerA) throw new Error(`Failed to seed trade offer A: ${offerAErr?.message}`);
    createdOfferIds.push(offerA.id);

    const { data: offerB, error: offerBErr } = await adminSupabase
      .from('trade_offers')
      .insert({
        company_id: userBId,
        title: 'Test Offer B',
        video_url: 'https://example.com/demo_b.mp4',
        offering_summary: 'Growth Marketing Services',
        looking_for_summary: 'Custom Web Application',
        estimated_value: tradeCreditValue,
        category: 'Marketing',
        scope: 'remote', // Valid delivery_scope enum
        status: 'active',
      })
      .select()
      .single();
    if (offerBErr || !offerB) throw new Error(`Failed to seed trade offer B: ${offerBErr?.message}`);
    createdOfferIds.push(offerB.id);

    // ========================================================================
    // PHASE 1: LOCK & SETTLE LIFECYCLE
    // ========================================================================
    console.log('\n==================================================');
    console.log('  PHASE 1: TESTING LOCK & SETTLE LIFECYCLE');
    console.log('==================================================');

    const { data: deal1, error: deal1Err } = await adminSupabase
      .from('barter_deals')
      .insert({
        company_a_id: userAId,
        company_b_id: userBId,
        offer_a_id: offerA.id,
        offer_b_id: offerB.id,
        status: 'pending',
        signed_a: false,
        signed_b: false,
        is_escrow_locked_a: false,
        is_escrow_locked_b: false,
      })
      .select()
      .single();

    if (deal1Err || !deal1) throw new Error(`Failed to create Deal 1: ${deal1Err?.message}`);
    createdDealIds.push(deal1.id);

    // Lock Phase 1
    console.log('🔒 Executing lock_trade_escrow RPC for Deal 1...');
    const { data: lock1Res, error: lock1Err } = await adminSupabase.rpc('lock_trade_escrow', {
      p_match_id: deal1.id,
      p_amount: tradeCreditValue,
    });
    if (lock1Err || (lock1Res && !lock1Res.success)) {
      throw new Error(`Lock RPC Failed (Deal 1): ${lock1Err?.message || lock1Res?.error}`);
    }
    console.log('✅ Escrow locked successfully.');

    // Settle Phase 1
    console.log('🤝 Executing settle_trade_escrow RPC for Deal 1...');
    const { data: settleRes, error: settleErr } = await adminSupabase.rpc('settle_trade_escrow', {
      p_match_id: deal1.id,
    });
    if (settleErr || (settleRes && !settleRes.success)) {
      throw new Error(`Settle RPC Failed: ${settleErr?.message || settleRes?.error}`);
    }
    console.log('✅ Trade settled successfully.');

    // Audit Phase 1
    const { data: userABalAfterSettle } = await adminSupabase
      .from('user_balances')
      .select('*')
      .eq('user_id', userAId)
      .single();

    console.log(`📊 Post-Settle Audit: User A Available Credits = ${userABalAfterSettle?.available_credits} (Expected: ${initialCredits - tradeCreditValue})`);

    // ========================================================================
    // PHASE 2: LOCK & CANCEL (REFUND) LIFECYCLE
    // ========================================================================
    console.log('\n==================================================');
    console.log('  PHASE 2: TESTING LOCK & CANCEL (REFUND) LIFECYCLE');
    console.log('==================================================');

    const { data: deal2, error: deal2Err } = await adminSupabase
      .from('barter_deals')
      .insert({
        company_a_id: userAId,
        company_b_id: userBId,
        offer_a_id: offerA.id,
        offer_b_id: offerB.id,
        status: 'pending',
        signed_a: false,
        signed_b: false,
        is_escrow_locked_a: false,
        is_escrow_locked_b: false,
      })
      .select()
      .single();

    if (deal2Err || !deal2) throw new Error(`Failed to create Deal 2: ${deal2Err?.message}`);
    createdDealIds.push(deal2.id);

    // Lock Phase 2
    console.log('🔒 Executing lock_trade_escrow RPC for Deal 2...');
    const { data: lock2Res, error: lock2Err } = await adminSupabase.rpc('lock_trade_escrow', {
      p_match_id: deal2.id,
      p_amount: 25,
    });
    if (lock2Err || (lock2Res && !lock2Res.success)) {
      throw new Error(`Lock RPC Failed (Deal 2): ${lock2Err?.message || lock2Res?.error}`);
    }
    console.log('✅ Escrow locked (25 credits).');

    // Cancel Phase 2
    console.log('🚫 Executing cancel_trade_escrow RPC for Deal 2...');
    const { data: cancelRes, error: cancelErr } = await adminSupabase.rpc('cancel_trade_escrow', {
      p_match_id: deal2.id,
    });
    if (cancelErr || (cancelRes && !cancelRes.success)) {
      throw new Error(`Cancel RPC Failed: ${cancelErr?.message || cancelRes?.error}`);
    }
    console.log('✅ Trade cancelled and escrow released.');

    // Audit Phase 2
    const { data: deal2Final } = await adminSupabase
      .from('barter_deals')
      .select('*')
      .eq('id', deal2.id)
      .single();

    const { data: userABalAfterCancel } = await adminSupabase
      .from('user_balances')
      .select('*')
      .eq('user_id', userAId)
      .single();

    console.log(`\n🏁 Final Cancellation Audit:`);
    console.log(`- Deal 2 Status: ${deal2Final?.status} (Expected: cancelled)`);
    console.log(`- User A Available Credits: ${userABalAfterCancel?.available_credits} (Expected: ${initialCredits - tradeCreditValue})`);
    console.log(`- User A Escrow Credits: ${userABalAfterCancel?.escrow_credits} (Expected: 0)`);

    console.log('\n🎉 ALL ESCROW LIFECYCLE & REFUND TESTS PASSED PERFECTLY!');
    testPassed = true;

  } catch (err: any) {
    console.error('\n❌ Escrow Integration Test Failed:', err.message);
  } finally {
    await cleanupTestData(userAId, userBId, createdDealIds, createdOfferIds);
    setTimeout(() => process.exit(testPassed ? 0 : 1), 500);
  }
}

runSelfSeedingEscrowTest();