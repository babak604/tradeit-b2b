import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse incoming form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const dealId = formData.get('dealId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    const fileExt = file.name.split('.').pop() || 'bin';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = dealId ? `deals/${dealId}/${fileName}` : `general/${fileName}`;

    // 3. Upload file to Supabase Storage bucket ('deal-attachments')
    const { error: uploadError } = await supabase.storage
      .from('deal-attachments')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }

    // 4. Retrieve public/signed URL for immediate frontend rendering
    const { data: publicUrlData } = supabase.storage
      .from('deal-attachments')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      attachment: {
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrlData.publicUrl,
        path: filePath,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}