'use server';

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const CompanyProfileSchema = z.object({
  companyName: z.string(),
  oneLiner: z.string().describe('Elevator pitch under 12 words'),
  summary: z.string().describe('2-3 sentence overview of business model and core offerings'),
  category: z.string().describe('Primary industry (e.g., Marketing, SaaS, Legal, Manufacturing)'),
  suggestedOffers: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      estimatedValueUsd: z.number().describe('Estimated fair value in USD'),
      category: z.string(),
    })
  ).length(2).describe('2 things this company can offer as barter (e.g. ad slots, excess inventory, billable hours)'),
  suggestedNeeds: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      estimatedValueUsd: z.number().describe('Estimated budget needed in USD'),
      category: z.string(),
    })
  ).length(2).describe('2 operational services or products this company likely needs to buy'),
});

export async function enrichCompanyFromUrl(companyUrl: string) {
  try {
    // 1. Sanitize & Fetch raw text content from the URL
    const formattedUrl = companyUrl.startsWith('http') ? companyUrl : `https://${companyUrl}`;
    const res = await fetch(formattedUrl, { headers: { 'User-Agent': 'TradeItBot/1.0' } });
    const htmlText = await res.text();

    // Clean basic HTML tags to reduce token noise
    const cleanText = htmlText.replace(/<[^>]*>?/gm, ' ').slice(0, 8000);

    // 2. Structured LLM Generation
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: CompanyProfileSchema,
      prompt: `Analyze the following website content for ${formattedUrl} and create a B2B marketplace profile:

Website Raw Content:
${cleanText}`,
    });

    return { success: true, data: object };
  } catch (error) {
    console.error('Failed to enrich company:', error);
    return { success: false, error: 'Could not extract company details from URL.' };
  }
}