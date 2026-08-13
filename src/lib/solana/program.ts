import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { RPC_ENDPOINT } from "./constants";
import tradeitEscrowIdl from "./idl/tradeit_escrow.json";

export function getTradeItEscrowProgram(wallet: AnchorWallet) {
  const connection = new Connection(RPC_ENDPOINT, "confirmed");

  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  return new Program(tradeitEscrowIdl as any, provider);
}