import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Explicitly load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exitCode = 1;
  process.exit();
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const log = {
  section: (msg: string) => console.log(`\n========================================\n🚀 ${msg}\n========================================`),
  pass: (msg: string) => console.log(`   ✅ [PASS] ${msg}`),
  fail: (msg: string, err?: any) => {
    console.error(`   ❌ [FAIL] ${msg}`);
    if (err) {
      const formattedErr = typeof err === 'object' 
        ? JSON.stringify(err, Object.getOwnPropertyNames(err), 2) 
        : err;
      console.error('     Error Details:', formattedErr);
    }
  },
  info: (msg: string) => console.log(`   ℹ️  ${msg}`),
};

// Fixed Seeded UUIDs
const SEEDED_BUYER_ID = '11111111-1111-1111-1111-111111111111';
const SEEDED_SELLER_ID = '22222222-2222-2222-2222-222222222222';

async function runEscrowIntegrationTest() {
  log.section('Starting End-to-End Escrow Settlement Integration Test');

  let testBuyerId: string = SEEDED_BUYER_ID;
  let testSellerId: string = SEEDED_SELLER_ID;

  let testOfferId: string | null = null;
  let testDealId: string | null = null;

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Verify / Fetch Test Users
    // -------------------------------------------------------------------------
    log.info('Checking for test users in auth.users...');

    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();

    if (users && users.length >= 2) {
      testBuyerId = users[0].id;
      testSellerId = users[1].id;
    }

    log.pass(`Buyer Auth UUID:  ${testBuyerId}`);
    log.pass(`Seller Auth UUID: ${testSellerId}`);

    // -------------------------------------------------------------------------
    // STEP 2: Initialize Starting Balances
    // -------------------------------------------------------------------------
    log.info('Setting initial balances (Buyer: $1000.00, Seller: $0.00)...');

    const INITIAL_BUYER_BALANCE = 1000.00;
    const DEAL_CREDIT_VALUE = 350.00;

    const { error: buyerBalErr } = await supabaseAdmin
      .from('user_balances')
      .upsert({ 
        user_id: testBuyerId, 
        available_credits: INITIAL_BUYER_BALANCE,
        escrow_credits: 0.00 
      });

    if (buyerBalErr) throw new Error(`Failed to set buyer balance: ${buyerBalErr.message}`);

    const { error: sellerBalErr } = await supabaseAdmin
      .from('user_balances')
      .upsert({ 
        user_id: testSellerId, 
        available_credits: 0.00,
        escrow_credits: 0.00 
      });

    if (sellerBalErr) throw new Error(`Failed to set seller balance: ${sellerBalErr.message}`);

    log.pass('Initial wallet balances assigned in user_balances table.');

    // -------------------------------------------------------------------------
    // STEP 3: Create Test Offer & Draft Deal
    // -------------------------------------------------------------------------
    log.info('Creating test provision offer and draft deal...');

    const { data: offer, error: offerError } = await supabaseAdmin
      .from('offers')
      .insert({
        user_id: testSellerId,
        title: '[TEST] Full-Stack Code Audit',
        description: 'Temporary test provision offer for escrow validation.',
        credits: DEAL_CREDIT_VALUE,
        category: 'Development & Software',
      })
      .select()
      .single();

    if (offerError || !offer) {
      throw new Error(`Failed to create test offer: ${offerError?.message || JSON.stringify(offerError)}`);
    }
    testOfferId = offer.id;

    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .insert({
        offer_id: testOfferId,
        initiator_id: testBuyerId,
        receiver_id: testSellerId,
        value_credits: DEAL_CREDIT_VALUE,
        status: 'draft',
        terms: 'Atomic escrow test execution.',
        initiator_signed: false,
        receiver_signed: false,
      })
      .select()
      .single();

    if (dealError || !deal) {
      throw new Error(`Failed to create test deal: ${dealError?.message || JSON.stringify(dealError)}`);
    }
    testDealId = deal.id;

    if (!testDealId) {
      throw new Error('Failed to create test deal: deal ID missing after insert.');
    }

    log.pass(`Deal #${testDealId.slice(0, 8)} created in 'draft' state.`);

    // -------------------------------------------------------------------------
    // STEP 4: Test public.sign_deal (Buyer Sign)
    // -------------------------------------------------------------------------
    log.info('Executing sign_deal RPC (Buyer)...');

    const { error: buyerSignErr } = await supabaseAdmin
      .rpc('sign_deal', { p_deal_id: testDealId, p_user_id: testBuyerId });

    if (buyerSignErr) {
      throw new Error(`Buyer sign_deal RPC failed: ${buyerSignErr.message || JSON.stringify(buyerSignErr)}`);
    }
    log.pass('Buyer signature recorded.');

    // -------------------------------------------------------------------------
    // STEP 5: Test public.sign_deal (Seller Sign -> Triggers Escrow Lock)
    // -------------------------------------------------------------------------
    log.info('Executing sign_deal RPC (Seller)...');

    const { error: sellerSignErr } = await supabaseAdmin
      .rpc('sign_deal', { p_deal_id: testDealId, p_user_id: testSellerId });

    if (sellerSignErr) {
      throw new Error(`Seller sign_deal RPC failed: ${sellerSignErr.message || JSON.stringify(sellerSignErr)}`);
    }
    log.pass('Seller signature recorded.');

    // Verify Deal state = 'in_escrow'
    const { data: escrowDeal } = await supabaseAdmin
      .from('deals')
      .select('status')
      .eq('id', testDealId)
      .single();

    if (escrowDeal?.status !== 'in_escrow') {
      throw new Error(`Expected status 'in_escrow', got '${escrowDeal?.status}'`);
    }
    log.pass("Deal status transitioned to 'in_escrow'.");

    // Verify Buyer balance locked into escrow_credits
    const { data: buyerEscrowBalance } = await supabaseAdmin
      .from('user_balances')
      .select('available_credits, escrow_credits')
      .eq('user_id', testBuyerId)
      .single();

    const expectedAvailable = INITIAL_BUYER_BALANCE - DEAL_CREDIT_VALUE;
    if (buyerEscrowBalance?.available_credits !== expectedAvailable) {
      throw new Error(`Buyer available credits mismatch! Expected $${expectedAvailable}, got $${buyerEscrowBalance?.available_credits}`);
    }
    log.pass(`Buyer available credits locked. Available: $${buyerEscrowBalance.available_credits}, Escrow: $${buyerEscrowBalance.escrow_credits}.`);

    // -------------------------------------------------------------------------
    // STEP 6: Test public.settle_deal (Release Escrow Funds)
    // -------------------------------------------------------------------------
    log.info('Executing settle_deal RPC to release escrow funds...');

    const { error: settleErr } = await supabaseAdmin
      .rpc('settle_deal', { 
        p_deal_id: testDealId,
        p_releasing_user_id: testBuyerId 
      });

    if (settleErr) {
      throw new Error(`settle_deal RPC failed: ${settleErr.message || JSON.stringify(settleErr)}`);
    }
    log.pass('Settlement RPC executed.');

    // Verify Deal state = 'settled'
    const { data: finalDeal } = await supabaseAdmin
      .from('deals')
      .select('status')
      .eq('id', testDealId)
      .single();

    if (finalDeal?.status !== 'settled') {
      throw new Error(`Expected deal status 'settled', got '${finalDeal?.status}'`);
    }
    log.pass("Deal status transitioned to 'settled'.");

    // Verify Seller balance credited
    const { data: sellerFinalBalance } = await supabaseAdmin
      .from('user_balances')
      .select('available_credits')
      .eq('user_id', testSellerId)
      .single();

    if (sellerFinalBalance?.available_credits !== DEAL_CREDIT_VALUE) {
      throw new Error(`Seller balance mismatch! Expected $${DEAL_CREDIT_VALUE}, got $${sellerFinalBalance?.available_credits}`);
    }
    log.pass(`Seller wallet credited. Final Available Balance: $${sellerFinalBalance.available_credits}.`);

    // Verify Audit Log Entry
    const { data: txLogs } = await supabaseAdmin
      .from('credit_transactions')
      .select('*')
      .eq('deal_id', testDealId);

    if (!txLogs || txLogs.length === 0) {
      throw new Error('Audit check failed: No credit_transactions logged.');
    }
    log.pass(`Audit Log Verified: ${txLogs.length} ledger entry recorded.`);

    log.section('✨ ALL ESCROW INTEGRATION TESTS PASSED PERFECTLY!');

  } catch (err: any) {
    log.fail('Escrow Integration Test Failed!', err);
    process.exitCode = 1;
  } finally {
    log.info('Cleaning up temporary deal and offer records...');

    if (testDealId) {
      await supabaseAdmin.from('deal_messages').delete().eq('deal_id', testDealId);
      await supabaseAdmin.from('credit_transactions').delete().eq('deal_id', testDealId);
      await supabaseAdmin.from('deals').delete().eq('id', testDealId);
    }

    if (testOfferId) {
      await supabaseAdmin.from('offers').delete().eq('id', testOfferId);
    }

    log.pass('Cleanup completed cleanly.');
  }
}

runEscrowIntegrationTest();