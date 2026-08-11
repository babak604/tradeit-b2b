import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DEMO_PRESET_OFFERS } from '@/lib/demo/demoSeedData';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: 'Missing Supabase service key' }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Insert preset demo offers into trade_offers
    const formattedRows = DEMO_PRESET_OFFERS.map((item) => ({
      title: item.title,
      offering_summary: item.offering_summary,
      looking_for_summary: item.looking_for_summary,
      estimated_value: item.estimated_value,
      category: item.category,
      video_url: item.video_url,
      status: 'active',
    }));

    const { data, error } = await supabaseAdmin
      .from('trade_offers')
      .upsert(formattedRows, { onConflict: 'title' });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Successfully seeded 4 production-ready demo companies and pitch offers into Supabase!',
      insertedCount: formattedRows.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}