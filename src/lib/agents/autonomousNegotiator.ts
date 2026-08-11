import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export interface CompanyAgentPolicy {
  companyName: string;
  minAcceptableValueCAD: number;
  maxDeliveryDaysAllowed: number;
  flexibilityStrategy: 'aggressive' | 'balanced' | 'fast_close';
  requiredDeliverables: string[];
}

export interface NegotiatorResponse {
  action: 'ACCEPT_DEAL' | 'COUNTER_OFFER' | 'REJECT_DEAL' | 'REQUEST_INFO';
  agentMessage: string;
  proposedValueCAD?: number;
  suggestedContractModification?: string;
  confidenceScore: number;
  reasoning: string;
}

/**
 * Autonomous AI Negotiator Agent
 * Evaluates trade proposals and responds autonomously based on private company rules.
 */
export async function runAutonomousNegotiator(
  policy: CompanyAgentPolicy,
  myOfferSummary: string,
  theirOfferSummary: string,
  theirCompany: string,
  chatHistory: { sender: string; text: string }[]
): Promise<NegotiatorResponse> {
  const prompt = `
    You are an elite B2B Autonomous Trade Negotiator Agent representing "${policy.companyName}".
    
    YOUR COMPANY POLICY & CONSTRAINTS:
    - Target CAD Value: $${policy.minAcceptableValueCAD}
    - Max Allowed Timeline: ${policy.maxDeliveryDaysAllowed} days
    - Negotiation Strategy: ${policy.flexibilityStrategy}
    
    CURRENT TRADE CONTEXT:
    - Your Company (${policy.companyName}) Offering: "${myOfferSummary}"
    - Counterparty (${theirCompany}) Offering: "${theirOfferSummary}"
    
    CONVERSATION HISTORY:
    ${chatHistory.map((m) => `${m.sender}: ${m.text}`).join('\n')}
    
    INSTRUCTIONS:
    Analyze the proposal. If terms align with constraints, ACCEPT_DEAL. If terms have minor gaps (value discrepancy < 15%), generate a constructive COUNTER_OFFER.
    Be professional, direct, concise, and focused on maximizing mutual zero-cash barter value.
  `;

  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema: z.object({
      action: z.enum(['ACCEPT_DEAL', 'COUNTER_OFFER', 'REJECT_DEAL', 'REQUEST_INFO']),
      agentMessage: z.string().describe('The message posted into the Deal Room chat.'),
      proposedValueCAD: z.number().optional().describe('Revised CAD value if countering.'),
      suggestedContractModification: z.string().optional().describe('Specific wording change for the agreement.'),
      confidenceScore: z.number().min(0).max(100),
      reasoning: z.string().describe('Internal agent justification for this action.'),
    }),
    prompt,
  });

  return object;
}