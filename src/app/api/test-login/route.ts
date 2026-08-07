import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Fetch user by email using service role admin API
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.find((u) => u.email === email);

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userEmail = user.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'User email missing' }, { status: 400 });
    }

    // Generate a fresh session link or token via admin API
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    });

    if (linkError) {
      return NextResponse.json({ error: linkError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      hashedToken: linkData.properties?.hashed_token,
      redirectUrl: linkData.properties?.action_link 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}