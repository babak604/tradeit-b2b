import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

// Admin Supabase Client using Service Role Key for setup & assertions
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Atomic Escrow Lifecycle Suite', () => {
  let partyACompanyId: string;
  let partyBCompanyId: string;
  let partyAUserId: string;
  let partyBUserId: string;
  let testDealId: string;

  const INITIAL_BALANCE_A = 5000;
  const INITIAL_BALANCE_B = 2000;
  const DEAL_VALUATION = 1500;

  beforeAll(async () => {
    // 1. Seed Company A and Wallet
    const { data: compA } = await adminSupabase
      .from('companies')
      .insert({ name: 'Alpha Tech Corp' })
      .select('id')
      .single();
    partyACompanyId = compA!.id;

    await adminSupabase.from('wallets').insert({
      company_id: partyACompanyId,
      balance: INITIAL_BALANCE_A,
      locked_escrow: 0,
    });

    // 2. Seed Company B and Wallet
    const { data: compB } = await adminSupabase
      .from('companies')
      .insert({ name: 'Beta Logistics Inc' })
      .select('id')
      .single();
    partyBCompanyId = compB!.id;

    await adminSupabase.from('wallets').insert({
      company_id: partyBCompanyId,
      balance: INITIAL_BALANCE_B,
      locked_escrow: 0,
    });
  });

  afterAll(async () => {
    // Cleanup seeded test entities
    if (partyACompanyId) await adminSupabase.from('companies').delete().eq('id', partyACompanyId);
    if (partyBCompanyId) await adminSupabase.from('companies').delete().eq('id', partyBCompanyId);
  });

  test('1. Propose Deal: Creates deal record with status PROPOSED', async () => {
    const { data: deal, error } = await adminSupabase
      .from('deals')
      .insert({
        party_a_id: partyACompanyId,
        party_b_id: partyBCompanyId,
        credit_amount: DEAL_VALUATION,
        status: 'proposed',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(deal).toBeDefined();
    expect(deal.status).toEqual('proposed');
    testDealId = deal.id;
  });

  test('2. Lock Escrow (Sign Deal): Atomically moves funds from balance to locked_escrow', async () => {
    // Invoke private database function or RPC handling atomic signing & lock
    const { error } = await adminSupabase.rpc('sign_and_lock_deal', {
      p_deal_id: testDealId,
      p_company_id: partyACompanyId,
    });

    expect(error).toBeNull();

    // Verify Deal Status
    const { data: deal } = await adminSupabase
      .from('deals')
      .select('status')
      .eq('id', testDealId)
      .single();
    expect(deal?.status).toEqual('signed');

    // Verify Wallet A: Balance decreased, Locked Escrow increased
    const { data: walletA } = await adminSupabase
      .from('wallets')
      .select('balance, locked_escrow')
      .eq('company_id', partyACompanyId)
      .single();

    expect(walletA?.balance).toEqual(INITIAL_BALANCE_A - DEAL_VALUATION);
    expect(walletA?.locked_escrow).toEqual(DEAL_VALUATION);
  });

  test('3. Settle Deal: Unlocks escrow and completes credit transfer', async () => {
    const { error } = await adminSupabase.rpc('settle_deal', {
      p_deal_id: testDealId,
    });

    expect(error).toBeNull();

    // Verify Deal Status
    const { data: deal } = await adminSupabase
      .from('deals')
      .select('status')
      .eq('id', testDealId)
      .single();
    expect(deal?.status).toEqual('settled');

    // Verify Wallet A: Escrow cleared
    const { data: walletA } = await adminSupabase
      .from('wallets')
      .select('balance, locked_escrow')
      .eq('company_id', partyACompanyId)
      .single();
    expect(walletA?.locked_escrow).toEqual(0);

    // Verify Wallet B: Balance credited with deal valuation
    const { data: walletB } = await adminSupabase
      .from('wallets')
      .select('balance')
      .eq('company_id', partyBCompanyId)
      .single();
    expect(walletB?.balance).toEqual(INITIAL_BALANCE_B + DEAL_VALUATION);
  });

  test('4. Atomic Rollback: Rejects deal signing if wallet balance is insufficient', async () => {
    // Create an oversized deal exceeding Wallet B balance
    const { data: hugeDeal } = await adminSupabase
      .from('deals')
      .insert({
        party_a_id: partyBCompanyId,
        party_b_id: partyACompanyId,
        credit_amount: 999999, // Exceeds balance
        status: 'proposed',
      })
      .select()
      .single();

    // Attempt to lock escrow
    const { error } = await adminSupabase.rpc('sign_and_lock_deal', {
      p_deal_id: hugeDeal!.id,
      p_company_id: partyBCompanyId,
    });

    // Should throw an error due to check constraint / transaction failure
    expect(error).not.toBeNull();

    // Verify deal was NOT marked as signed
    const { data: checkDeal } = await adminSupabase
      .from('deals')
      .select('status')
      .eq('id', hugeDeal!.id)
      .single();
    expect(checkDeal?.status).toEqual('proposed');
  });
});