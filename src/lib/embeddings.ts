import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function generateEmbedding(text: string): Promise<number[]> {
  const cleanText = text.replace(/\n/g, ' ').trim();
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: cleanText,
  });
  return embedding;
}