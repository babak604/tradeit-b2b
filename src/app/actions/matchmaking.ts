'use server';

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { generateEmbedding } from '@/lib/embeddings';

const TradeMatchSchema = z.object({
  matches: z.array(
    z.object({
      counterparty_listing_id: z.string().uuid(),
      company_name: z.string(),
      credit_value: z.number(),
      you_provide: z.string(),
      you_receive: z.string(),
      match_score: z.number().min(0).max(100),
      reasoning: z.string(),
    })
  ),
});

export async function generateTradeMatchesAction(targetListingId: string) {
  const supabase = await createClient();

  // 1. Authenticate session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized.' };
  }

  // 2. Fetch target listing details
  const { data: targetListing, error: listingError } = await supabase
    .from('user_listings')
    .select('id, title, description, price, embedding')
    .eq('id', targetListingId)
    .single();

  if (listingError || !targetListing) {
    return { success: false, error: 'Target listing not found.' };
  }

  // 3. Generate embedding on the fly if missing
  let queryVector: number[] = targetListing.embedding;
  if (!queryVector || queryVector.length === 0) {
    const textToEmbed = `${targetListing.title}: ${targetListing.description || ''}`;
    queryVector = await generateEmbedding(textToEmbed);

    // Store back to DB for future caching
    await supabase
      .from('user_listings')
      .update({ embedding: queryVector })
      .eq('id', targetListing.id);
  }

  // 4. Perform vector similarity search in Postgres (top 5 candidates)
  const { data: vectorCandidates, error: rpcError } = await supabase.rpc(
    'match_listings',
    {
      query_embedding: queryVector,
      match_threshold: 0.2, // Minimum cosine similarity
      match_count: 5,
      p_user_id: user.id,
      p_target_listing_id: targetListing.id,
    }
  );

  if (rpcError || !vectorCandidates || vectorCandidates.length === 0) {
    return {
      success: true,
      matches: [],
      message: 'No semantically compatible counterparties found.',
    };
  }

  // 5. Structured LLM Match Evaluation with Vercel AI SDK
  try {
    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: TradeMatchSchema,
      prompt: `
        You are an expert B2B Barter Matchmaking Engine. Evaluate the synergy between the target offering and these vector-retrieved candidate listings.

        TARGET OFFERING:
        - Title: ${targetListing.title}
        - Description: ${targetListing.description || 'N/A'}
        - Value: ${targetListing.price} Credits

        CANDIDATE LISTINGS (Pre-filtered by pgvector semantic similarity):
        ${JSON.stringify(vectorCandidates, null, 2)}

        INSTRUCTIONS:
        For each candidate listing that forms a viable exchange:
        1. Assign a synergy match score (0-100).
        2. Clearly summarize "you_provide" and "you_receive" deliverable descriptions.
        3. Output concise reasoning explaining why this trade makes business sense.
      `,
    });

    return { success: true, matches: object.matches };
  } catch (err: unknown) {
    console.error('LLM Matchmaking exception:', err);
    return { success: false, error: 'AI processing failed.' };
  }
}