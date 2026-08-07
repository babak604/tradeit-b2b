import { config } from 'dotenv';
import { resolve } from 'path';

// Automatically load .env.local from the project root
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedMarketplace() {
  console.log('🌱 Starting marketplace seed...');

  try {
    const timestamp = Date.now();

    // 1. Create Test Companies
    const { data: companyA, error: errA } = await supabase
      .from('companies')
      .insert({ 
        name: 'Acme Logistics Solutions', 
        slug: `acme-logistics-${timestamp}`,
        is_verified: true 
      })
      .select()
      .single();
    if (errA) throw errA;

    const { data: companyB, error: errB } = await supabase
      .from('companies')
      .insert({ 
        name: 'Nexus Cloud Infrastructure', 
        slug: `nexus-cloud-${timestamp}`,
        is_verified: true 
      })
      .select()
      .single();
    if (errB) throw errB;

    console.log(`✅ Created Companies: "${companyA.name}" & "${companyB.name}"`);

    // 2. Create B2B Trade Offers
    const { data: offerA, error: errOffA } = await supabase
      .from('trade_offers')
      .insert({
        company_id: companyA.id,
        title: 'Fleet Logistics & Freight Routing Services',
        category: 'Logistics',
        estimated_value: 25000.00,
        offering_summary: 'Dedicated enterprise regional freight dispatch and route optimization.',
        looking_for_summary: 'Enterprise cloud compute infrastructure or GPU server clusters.',
        video_url: 'https://example.com/videos/fleet-logistics-demo.mp4',
      })
      .select()
      .single();
    if (errOffA) throw errOffA;

    const { data: offerB, error: errOffB } = await supabase
      .from('trade_offers')
      .insert({
        company_id: companyB.id,
        title: 'High-Concurrency GPU Server Allocation',
        category: 'Infrastructure',
        estimated_value: 25000.00,
        offering_summary: '6-month dedicated instance cluster with guaranteed 99.99% uptime.',
        looking_for_summary: 'Freight dispatch, supply chain routing, or freight logistics management.',
        video_url: 'https://example.com/videos/gpu-cluster-demo.mp4',
      })
      .select()
      .single();
    if (errOffB) throw errOffB;

    console.log(`✅ Created Trade Offers`);

    // 3. Create Bilateral Deal Session in barter_deals
    const { data: deal, error: errDeal } = await supabase
      .from('barter_deals')
      .insert({
        offer_a_id: offerA.id,
        offer_b_id: offerB.id,
        company_a_id: companyA.id,
        company_b_id: companyB.id,
        status: 'draft',
      })
      .select()
      .single();
    if (errDeal) throw errDeal;

    console.log(`✅ Created Active Deal: ID ${deal.id}`);

    // 4. Seed Real-Time Chat Thread
    const { error: errMsgs } = await supabase.from('deal_messages').insert([
      {
        deal_id: deal.id,
        sender_company_id: companyA.id,
        content: 'Hello! We reviewed the GPU cluster terms and agreed to the 30-day delivery timeline.',
      },
      {
        deal_id: deal.id,
        sender_company_id: companyB.id,
        content: 'Great. Let’s proceed to lock the escrow ledger when you are ready.',
      },
      {
        deal_id: deal.id,
        sender_company_id: companyA.id,
        content: 'SYSTEM: Agreed to initial terms. Ready for escrow locking.',
      },
    ]);
    if (errMsgs) throw errMsgs;

    console.log(`✅ Seeded Realtime Deal Messages`);
    console.log(`\n🚀 Seed complete! Active Deal ID for testing: ${deal.id}`);

  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedMarketplace();