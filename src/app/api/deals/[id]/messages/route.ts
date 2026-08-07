import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // 3. Verify that the company is a participant in this deal
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('id, initiator_company_id, counterparty_company_id')
      .eq('id', id)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
    }

    const isParticipant =
      deal.initiator_company_id === profile.company_id ||
      deal.counterparty_company_id === profile.company_id;

    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden: Not a participant in this deal.' }, { status: 403 });
    }

    const body = await request.json();
    const { content, attachments } = body;

    if ((!content || !content.trim()) && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: 'Message content or attachments are required.' }, { status: 400 });
    }

    // 4. Insert message record
    const { data: message, error: messageError } = await supabase
      .from('deal_messages')
      .insert({
        deal_id: id,
        sender_company_id: profile.company_id,
        content: content ? content.trim() : '',
        attachments: attachments || [],
      })
      .select(`
        *,
        sender_company:companies!deal_messages_sender_company_id_fkey(id, name, logo_url)
      `)
      .single();

    if (messageError) {
      return NextResponse.json({ error: messageError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}