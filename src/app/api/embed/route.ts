import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface OpenAIErrorResponse {
  error?: {
    message?: string;
  };
}

interface OpenAIEmbeddingResponse {
  data: Array<{
    embedding: number[];
  }>;
}

interface EmbedRequestBody {
  offerId?: string;
  offeringSummary?: string;
  lookingForSummary?: string;
}

// Helper to generate vector embedding via OpenAI
async function generateEmbedding(text: string): Promise<number[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not configured.');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 1536,
    }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as OpenAIErrorResponse;
    throw new Error(`OpenAI Embedding API Error: ${errorData.error?.message || response.statusText}`);
  }

  const data = (await response.json()) as OpenAIEmbeddingResponse;
  return data.data[0].embedding;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EmbedRequestBody;
    const { offerId, offeringSummary, lookingForSummary } = body;

    if (!offerId || !offeringSummary || !lookingForSummary) {
      return NextResponse.json(
        { error: 'Missing offerId, offeringSummary, or lookingForSummary' },
        { status: 400 }
      );
    }

    // 1. Generate 1536-dimensional vectors for both offering and seeking summaries in parallel
    const [offeringEmbedding, lookingForEmbedding] = await Promise.all([
      generateEmbedding(offeringSummary),
      generateEmbedding(lookingForSummary),
    ]);

    // 2. Save vectors into Supabase pgvector columns
    const supabase = await createClient();
    const { error: updateError } = await supabase
      .from('trade_offers')
      .update({
        offering_embedding: offeringEmbedding,
        looking_for_embedding: lookingForEmbedding,
      })
      .eq('id', offerId);

    if (updateError) {
      console.error('Supabase Vector Update Error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      offerId,
      message: 'Successfully generated and stored dual 1536-dim embeddings.',
    });
  } catch (err: unknown) {
    console.error('Embedding Route Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}