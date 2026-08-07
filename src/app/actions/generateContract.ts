'use server';

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const ContractSchema = z.object({
  title: z.string().describe('Title of the Barter Agreement'),
  totalEstimatedValueUsd: z.number().describe('Total combined fair market value of the trade in USD'),
  partyA: z.object({
    role: z.string(),
    deliverables: z.array(z.string()).describe('List of specific items/services Party A agrees to deliver'),
    estimatedValueUsd: z.number(),
    deadlineDays: z.number().describe('Completion window in days'),
  }),
  partyB: z.object({
    role: z.string(),
    deliverables: z.array(z.string()).describe('List of specific items/services Party B agrees to deliver'),
    estimatedValueUsd: z.number(),
    deadlineDays: z.number().describe('Completion window in days'),
  }),
  valueAdjustment: z.string().describe('Explanation of how value parity is achieved (e.g. 1:1 swap or trade credits applied to balance difference)'),
  milestones: z.array(
    z.object({
      phase: z.string(),
      description: z.string(),
      releaseCondition: z.string().describe('Condition required for trade credits or escrow release'),
    })
  ),
  disputeResolutionClause: z.string().describe('Concise legal clause outlining AI-assisted arbitration or escrow hold rules'),
});

export async function generateBarterContract(offerListing: {
  title: string;
  description: string;
  value: number;
}, needListing: {
  title: string;
  description: string;
  value: number;
}) {
  try {
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: ContractSchema,
      prompt: `Generate a formal, balanced B2B Barter Statement of Work (SOW) agreement between two companies:

Party A (Offering):
- Title: ${offerListing.title}
- Description: ${offerListing.description}
- Value: $${offerListing.value}

Party B (In Need):
- Title: ${needListing.title}
- Description: ${needListing.description}
- Value: $${needListing.value}

Ensure terms are balanced, fair market values are reconciled, and clear delivery milestones are established.`,
    });

    return { success: true, contract: object };
  } catch (error) {
    console.error('Failed to generate SOW contract:', error);
    return { success: false, error: 'Failed to generate contract.' };
  }
}