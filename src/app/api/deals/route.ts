import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch user's company ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'User is not associated with any company.' }, { status: 400 });
    }

    const body = await request.json();
    const { counterparty_company_id, credit_amount, initial_terms } = body;

    if (!counterparty_company_id || !credit_amount) {
      return NextResponse.json({ error: 'Counterparty and credit amount are required.' }, { status: 400 });
    }

    if (profile.company_id === counterparty_company_id) {
      return NextResponse.json({ error: 'Cannot initiate a deal with your own company.' }, { status: 400 });
    }

    // 3. Insert new deal record
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .insert({
        initiator_company_id: profile.company_id,
        counterparty_company_id,
        credit_amount: parseFloat(credit_amount),
        status: 'pending',
      })
      .select()
      .single();

    if (dealError) {
      return NextResponse.json({ error: dealError.message }, { status: 400 });
    }

    // 4. If initial terms/description were provided, insert as the first chat message
    if (initial_terms && initial_terms.trim()) {
      await supabase.from('deal_messages').insert({
        deal_id: deal.id,
        sender_company_id: profile.company_id,
        content: initial_terms.trim(),
        attachments: [],
      });
    }

    return NextResponse.json({ success: true, deal });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}