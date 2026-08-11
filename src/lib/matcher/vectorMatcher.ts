import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { supabase } from '@/lib/supabase/client';

/**
 * Generates an OpenAI text embedding vector for a given offer/need pair
 */
export async function generateOfferEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: text,
  });
  return embedding;
}

/**
 * Performs semantic vector search on Supabase using cosine similarity
 */
export async function findSemanticMatches(needText: string, similarityThreshold = 0.75) {
  try {
    const queryVector = await generateOfferEmbedding(needText);

    const { data, error } = await supabase.rpc('match_trade_offers', {
      query_embedding: queryVector,
      match_threshold: similarityThreshold,
      match_count: 5,
    });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Vector search error:', err);
    return [];
  }
}