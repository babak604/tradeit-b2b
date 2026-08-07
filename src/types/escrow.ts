// --- State Machine & Union Types ---

export type DealStatus =
  | 'negotiating'
  | 'terms_accepted'
  | 'escrow_locked'
  | 'disputed'
  | 'completed'
  | 'refunded'
  | 'cancelled';

export type EscrowHoldStatus = 'held' | 'released' | 'refunded' | 'disputed';

export type LedgerAccountType =
  | 'asset'
  | 'liability'
  | 'equity'
  | 'escrow'
  | 'revenue'
  | 'expense';

// --- Database Table Models ---

export interface CompanySummary {
  name: string;
  is_verified: boolean;
}

export interface OfferSummary {
  id: string;
  title: string;
  estimated_value: number;
  offering_summary: string;
}

export interface DealDetail {
  id: string;
  company_a_id: string;
  company_b_id: string;
  offer_a_id: string;
  offer_b_id: string;
  status: DealStatus;
  terms: string;
  total_amount: number;
  created_at: string;
  updated_at?: string;
  company_a?: CompanySummary;
  company_b?: CompanySummary;
  offer_a?: OfferSummary;
  offer_b?: OfferSummary;
}

export interface EscrowHold {
  id: string;
  deal_id: string;
  buyer_company_id: string;
  seller_company_id: string;
  amount: number;
  currency: string;
  status: EscrowHoldStatus;
  locked_at: string;
  released_at?: string | null;
  refunded_at?: string | null;
}

export interface LedgerAccount {
  id: string;
  company_id: string;
  account_name: string;
  account_type: LedgerAccountType;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface LedgerTransaction {
  id: string;
  deal_id?: string | null;
  description: string;
  created_at: string;
}

export interface LedgerEntry {
  id: string;
  transaction_id: string;
  company_id: string;
  debit_account_id: string;
  credit_account_id: string;
  amount: number;
  currency: string;
  memo: string;
  created_at: string;
}

export interface DealMessage {
  id: string;
  deal_id: string;
  sender_company_id: string;
  message: string;
  created_at: string;
}

// --- Supabase RPC Parameters & Return Signatures ---

export interface LockEscrowParams {
  p_deal_id: string;
}

export interface SettleEscrowParams {
  p_deal_id: string;
}

export interface RefundEscrowParams {
  p_deal_id: string;
}

export interface EscrowRpcResult {
  success: boolean;
  deal_id: string;
  status: DealStatus;
  transaction_id?: string;
  escrow_hold_id?: string;
  amount_processed?: number;
  message?: string;
}