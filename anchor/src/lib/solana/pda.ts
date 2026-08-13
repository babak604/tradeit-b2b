import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID, ESCROW_SEED } from "./constants";

export function getEscrowPda(dealId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      ESCROW_SEED,
      Buffer.from(dealId),
    ],
    PROGRAM_ID
  );
}
