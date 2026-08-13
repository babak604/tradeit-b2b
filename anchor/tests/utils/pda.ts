import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey("Es7dux19AYKphx5PtTn7vsem96pqTBKc6oQp9gosfERi");

export function getEscrowPda(dealId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("escrow"),
      Buffer.from(dealId),
    ],
    PROGRAM_ID
  );
}
