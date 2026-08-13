"use client";

import { useState, useCallback } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  Keypair,
  Transaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getAssociatedTokenAddressSync,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
} from "@solana/spl-token";
import { getTradeItEscrowProgram } from "@/lib/solana/program";
import { getEscrowPda } from "@/lib/solana/pda";
import { logDealTransaction } from "@/lib/supabase/dealHistory";

export interface CycleEscrowState {
  initializer: PublicKey;
  dealId: string;
  cycleCapacity: BN;
  isLocked: boolean;
  isSettled: boolean;
  bump: number;
}

export function useTradeItEscrow() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getProgram = useCallback(() => {
    if (!wallet) throw new Error("Wallet not connected.");
    return getTradeItEscrowProgram(wallet);
  }, [wallet]);

  /**
   * 0. Mock RWA Faucet: Creates a new SPL Token Mint & Mints tokens to Wallet ATA in 1 Tx
   */
  const mintMockRwaTokens = useCallback(
    async (amountToMint = 1_000): Promise<{ mintAddress: string; txSignature: string }> => {
      if (!wallet) throw new Error("Wallet not connected.");
      setLoading(true);
      setError(null);

      try {
        const mintKeypair = Keypair.generate();
        const decimals = 6;
        const mintAmount = amountToMint * 10 ** decimals;

        const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
        const userAta = getAssociatedTokenAddressSync(
          mintKeypair.publicKey,
          wallet.publicKey
        );

        const tx = new Transaction().add(
          // Create Mint Account
          SystemProgram.createAccount({
            fromPubkey: wallet.publicKey,
            newAccountPubkey: mintKeypair.publicKey,
            space: MINT_SIZE,
            lamports,
            programId: TOKEN_PROGRAM_ID,
          }),
          // Initialize Mint (6 decimals)
          createInitializeMintInstruction(
            mintKeypair.publicKey,
            decimals,
            wallet.publicKey,
            wallet.publicKey
          ),
          // Create Associated Token Account for Wallet
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            userAta,
            wallet.publicKey,
            mintKeypair.publicKey
          ),
          // Mint tokens directly into user ATA
          createMintToInstruction(
            mintKeypair.publicKey,
            userAta,
            wallet.publicKey,
            mintAmount
          )
        );

        // Fetch latest blockhash and sign
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        tx.feePayer = wallet.publicKey;

        // Sign with ephemeral mint keypair first, then request wallet signature
        tx.partialSign(mintKeypair);
        const signedTx = await wallet.signTransaction(tx);
        const txSig = await connection.sendRawTransaction(signedTx.serialize());

        await connection.confirmTransaction(txSig, "confirmed");

        return {
          mintAddress: mintKeypair.publicKey.toBase58(),
          txSignature: txSig,
        };
      } catch (err: any) {
        const msg = err.message || "Failed to execute RWA Faucet mint.";
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [connection, wallet]
  );

  /**
   * 1. Initialize Cycle Escrow Vault + Log to Supabase
   */
  const initializeEscrow = useCallback(
    async (dealId: string, capacityLamports: number | BN): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        const program = getProgram();
        const [escrowPda] = getEscrowPda(dealId);
        const capacityBN = BN.isBN(capacityLamports)
          ? capacityLamports
          : new BN(capacityLamports);

        const tx = await program.methods
          .initializeCycleEscrow(dealId, capacityBN)
          .accounts({
            escrowAccount: escrowPda,
            initializer: wallet!.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        await logDealTransaction({
          dealId,
          eventType: "INITIALIZE",
          txSignature: tx,
          walletAddress: wallet!.publicKey.toBase58(),
          amount: capacityBN.toNumber(),
        });

        return tx;
      } catch (err: any) {
        const msg = err.message || "Failed to initialize escrow.";
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [getProgram, wallet]
  );

  /**
   * 2. Deposit RWA Token + Log to Supabase
   */
  const depositToken = useCallback(
    async (dealId: string, mint: PublicKey, amount: number | BN): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        const program = getProgram();
        const [escrowPda] = getEscrowPda(dealId);
        const amountBN = BN.isBN(amount) ? amount : new BN(amount);

        const depositorAta = getAssociatedTokenAddressSync(mint, wallet!.publicKey);
        const vaultAta = getAssociatedTokenAddressSync(mint, escrowPda, true);

        const tx = await program.methods
          .depositRwaToken(amountBN)
          .accounts({
            depositor: wallet!.publicKey,
            depositorTokenAccount: depositorAta,
            vaultTokenAccount: vaultAta,
            escrowAccount: escrowPda,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();

        await logDealTransaction({
          dealId,
          eventType: "DEPOSIT",
          txSignature: tx,
          walletAddress: wallet!.publicKey.toBase58(),
          mintAddress: mint.toBase58(),
          amount: amountBN.toNumber(),
        });

        return tx;
      } catch (err: any) {
        const msg = err.message || "Failed to deposit token.";
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [getProgram, wallet]
  );

  /**
   * 3. Execute Atomic Settlement + Log to Supabase
   */
  const executeSettlement = useCallback(
    async (
      dealId: string,
      mint: PublicKey,
      recipientPublicKey: PublicKey,
      amount: number | BN
    ): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        const program = getProgram();
        const [escrowPda] = getEscrowPda(dealId);
        const amountBN = BN.isBN(amount) ? amount : new BN(amount);

        const vaultAta = getAssociatedTokenAddressSync(mint, escrowPda, true);
        const recipientAta = getAssociatedTokenAddressSync(mint, recipientPublicKey);

        const tx = await program.methods
          .executeAtomicRingSettlement(amountBN)
          .accounts({
            escrowAccount: escrowPda,
            vaultTokenAccount: vaultAta,
            recipientTokenAccount: recipientAta,
            initializer: wallet!.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();

        await logDealTransaction({
          dealId,
          eventType: "SETTLEMENT",
          txSignature: tx,
          walletAddress: wallet!.publicKey.toBase58(),
          mintAddress: mint.toBase58(),
          recipientAddress: recipientPublicKey.toBase58(),
          amount: amountBN.toNumber(),
        });

        return tx;
      } catch (err: any) {
        const msg = err.message || "Failed to execute atomic settlement.";
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [getProgram, wallet]
  );

  /**
   * 4. Fetch On-Chain Escrow State
   */
  const fetchEscrowState = useCallback(
    async (dealId: string): Promise<CycleEscrowState | null> => {
      try {
        const program = getProgram();
        const [escrowPda] = getEscrowPda(dealId);
        const account = await (program as any).account.cycleEscrowAccount.fetch(escrowPda);
        return account as CycleEscrowState;
      } catch (err: any) {
        console.warn(`Escrow state not found for deal ${dealId}:`, err.message);
        return null;
      }
    },
    [getProgram]
  );

  return {
    mintMockRwaTokens,
    initializeEscrow,
    depositToken,
    executeSettlement,
    fetchEscrowState,
    loading,
    error,
    isWalletConnected: !!wallet,
  };
}