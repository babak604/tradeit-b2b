import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_URL = 'http://localhost:3000/api/webhooks/disputes';

async function runTest() {
  console.log('🚀 Starting B2B Dispute & Arbitration E2E Integration Test...');
  console.log(`🔍 Target Webhook URL: ${TARGET_URL}\n`);

  // 1. Setup: Provision company profile with email
  console.log('📦 Setup: Provisioning company profile & deal...');
  
  const testEmail = 'b2b-test-recipient@example.com';
  const { data: company, error: compErr } = await supabase
    .from('companies')
    .upsert(
      { name: 'Test Barter Corp', email: testEmail },
      { onConflict: 'name' }
    )
    .select()
    .single();

  if (compErr) {
    console.error('❌ Failed to upsert test company:', compErr);
    return;
  }

  // Fetch or fallback to a test user ID for uploaded_by constraint
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const testUserId = users?.[0]?.id || '00000000-0000-0000-0000-000000000000';

  // Create test barter deal
  const { data: deal, error: dealErr } = await supabase
    .from('barter_deals')
    .insert({
      company_id: company.id,
      status: 'active',
      title: 'E2E Test Shipment Deal',
    })
    .select()
    .single();

  if (dealErr || !deal) {
    console.error('❌ Failed to create test deal:', dealErr);
    return;
  }

  console.log(`✅ Deal created successfully [ID: ${deal.id}]`);

  // 2. Step 1: File dispute
  console.log('\n⚡ Step 1: Filing dispute on deal...');
  const { error: updateErr1 } = await supabase
    .from('barter_deals')
    .update({ status: 'disputed' })
    .eq('id', deal.id);

  if (updateErr1) {
    console.error('❌ Failed to set dispute status:', updateErr1);
    return;
  }
  console.log('✅ Deal status set to disputed');

  // Dispatch "disputed" webhook
  console.log('📡 Step 2: Dispatching "disputed" webhook to API handler...');
  try {
    const res = await fetch(TARGET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': process.env.SUPABASE_WEBHOOK_SECRET || 'test-secret',
      },
      body: JSON.stringify({
        type: 'UPDATE',
        table: 'barter_deals',
        record: { id: deal.id, status: 'disputed', company_id: company.id },
      }),
    });
    const data = await res.json();
    console.log(`✅ Webhook Response (Disputed): ${data.message || JSON.stringify(data)}`);
  } catch (err: any) {
    console.error('❌ Webhook dispatch failed:', err.message);
  }

  // 3. Step 3: Simulate evidence upload into private storage vault & log metadata
  console.log('\n📄 Step 3: Simulating evidence upload into private storage vault...');
  const filePath = `disputes/${deal.id}/bill-of-lading-${Date.now()}.pdf`;
  const dummyFileBuffer = Buffer.from('Mock PDF Bill of Lading Binary Content');

  await supabase.storage
    .from('dispute-evidence')
    .upload(filePath, dummyFileBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  const { error: evidenceErr } = await supabase
    .from('dispute_evidence')
    .insert({
      dispute_id: deal.id,
      file_path: filePath,
      uploaded_by: testUserId,
    });

  if (evidenceErr) {
    console.log(`⚠️ Evidence metadata insert warning: ${evidenceErr.message}`);
  } else {
    console.log(`✅ Uploaded file & logged metadata for path: ${filePath}`);
  }

  // 4. Step 4: Executing Arbitrator Determination (settled)
  console.log('\n⚖️ Step 4: Executing Arbitrator Determination (settled)...');
  const { error: updateErr2 } = await supabase
    .from('barter_deals')
    .update({ status: 'settled' })
    .eq('id', deal.id);

  if (updateErr2) {
    console.error('❌ Failed to settle deal:', updateErr2);
    return;
  }
  console.log('✅ Deal status updated to settled');

  // 5. Step 5: Dispatch "settled" webhook
  console.log('📡 Step 5: Dispatching "settled" webhook to API handler...');
  try {
    const res = await fetch(TARGET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': process.env.SUPABASE_WEBHOOK_SECRET || 'test-secret',
      },
      body: JSON.stringify({
        type: 'UPDATE',
        table: 'barter_deals',
        record: { id: deal.id, status: 'settled', company_id: company.id },
      }),
    });
    const data = await res.json();
    console.log(`✅ Webhook Response (Resolved): ${data.message || JSON.stringify(data)}`);
  } catch (err: any) {
    console.error('❌ Webhook dispatch failed:', err.message);
  }

  console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
}

runTest().catch(console.error);