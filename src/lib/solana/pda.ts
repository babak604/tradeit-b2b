import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID, ESCROW_SEED } from "./constants";

/**
 * Derives the Escrow PDA and bump seed for a given deal ID.
 * @param dealId String identifier for the cycle deal (e.g. "DEAL-1561")
 * @returns [escrowPda, bumpSeed]
 */
export function getEscrowPda(dealId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      ESCROW_SEED,
      Buffer.from(dealId),
    ],
    PROGRAM_ID
  );
}