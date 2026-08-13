import { PublicKey } from "@solana/web3.js";

// Active Devnet Program ID
export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || "Es7dux19AYKphx5PtTn7vsem96pqTBKc6oQp9gosfERi"
);

// RPC Connection
export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.devnet.solana.com";

// PDA Seed Prefixes
export const ESCROW_SEED = Buffer.from("escrow");