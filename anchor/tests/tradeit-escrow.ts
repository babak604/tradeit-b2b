import * as anchor from "@coral-xyz/anchor";
import { Program, BN, Wallet, AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Connection, Keypair } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Read IDL dynamically
const idl = JSON.parse(fs.readFileSync("./target/idl/tradeit_escrow.json", "utf8"));

const PROGRAM_ID = new PublicKey("Es7dux19AYKphx5PtTn7vsem96pqTBKc6oQp9gosfERi");

function getEscrowPda(dealId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), Buffer.from(dealId)],
    PROGRAM_ID
  );
}

function getProvider(): AnchorProvider {
  if (process.env.ANCHOR_PROVIDER_URL) {
    return AnchorProvider.env();
  }

  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const walletPath = process.env.ANCHOR_WALLET || path.join(os.homedir(), ".config", "solana", "id.json");

  if (!fs.existsSync(walletPath)) {
    throw new Error(`Solana keypair not found at ${walletPath}.`);
  }

  const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, "utf8")));
  const keypair = Keypair.fromSecretKey(secretKey);
  const wallet = new Wallet(keypair);

  return new AnchorProvider(connection, wallet, { commitment: "confirmed" });
}

async function main() {
  const provider = getProvider();
  anchor.setProvider(provider);

  const program = new Program(idl as any, provider);
  const payer = (provider.wallet as Wallet).payer;

  const dealId = "DEAL-RING-" + Math.floor(Math.random() * 10000);
  const capacityLamports = new BN(1_000_000_000);
  const [escrowPda] = getEscrowPda(dealId);

  console.log("==================================================");
  console.log("🚀 STARTING TRADEIT ESCROW FULL ATOMIC LIFECYCLE");
  console.log("==================================================");
  console.log("Deal ID:", dealId);
  console.log("Escrow PDA Address:", escrowPda.toBase58());
  console.log("Payer/Initializer:", provider.publicKey.toBase58());

  // 1. Initialize Cycle Escrow Vault
  console.log("\n[1/4] Initializing Cycle Escrow Vault on Devnet...");
  const initTx = await program.methods
    .initializeCycleEscrow(dealId, capacityLamports)
    .accounts({
      escrowAccount: escrowPda,
      initializer: provider.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  console.log("  ✔ Init Tx Signature:", initTx);

  // 2. Create Mock RWA Mint & Token Accounts
  console.log("\n[2/4] Setting up Mock RWA SPL Token & ATAs...");
  const mint = await createMint(
    provider.connection,
    payer,
    provider.publicKey,
    null,
    6 // 6 decimals
  );
  console.log("  ✔ Mock RWA Mint:", mint.toBase58());

  // Depositor ATA
  const depositorAta = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    payer,
    mint,
    provider.publicKey
  );

  // Vault ATA (Owned by Escrow PDA - requires allowOwnerOffCurve = true)
  const vaultAta = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    payer,
    mint,
    escrowPda,
    true
  );

  // Recipient ATA (Simulating Ring Settlement Counterparty)
  const recipientKeypair = Keypair.generate();
  const recipientAta = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    payer,
    mint,
    recipientKeypair.publicKey
  );

  // Mint 1,000 RWA Tokens to Depositor ATA
  const mintAmount = 1_000 * 10 ** 6;
  await mintTo(
    provider.connection,
    payer,
    mint,
    depositorAta.address,
    payer,
    mintAmount
  );
  console.log("  ✔ Minted 1,000 RWA Tokens to Depositor ATA:", depositorAta.address.toBase58());
  console.log("  ✔ Created Vault ATA (PDA Owned):", vaultAta.address.toBase58());
  console.log("  ✔ Created Recipient ATA:", recipientAta.address.toBase58());

  // 3. Deposit RWA Tokens into Escrow
  const depositAmount = new BN(500 * 10 ** 6); // Deposit 500 RWA
  console.log("\n[3/4] Depositing 500 RWA Tokens into Escrow Vault...");
  const depositTx = await program.methods
    .depositRwaToken(depositAmount)
    .accounts({
      depositor: provider.publicKey,
      depositorTokenAccount: depositorAta.address,
      vaultTokenAccount: vaultAta.address,
      escrowAccount: escrowPda,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
  console.log("  ✔ Deposit Tx Signature:", depositTx);

  // Fetch Vault ATA Balance
  let vaultBalance = await provider.connection.getTokenAccountBalance(vaultAta.address);
  console.log("  📊 Current Vault ATA Balance:", vaultBalance.value.uiAmount, "RWA");

  // 4. Execute Atomic Ring Settlement
  console.log("\n[4/4] Executing Atomic Ring Settlement (PDA Signing CPI)...");
  const settleTx = await program.methods
    .executeAtomicRingSettlement(depositAmount)
    .accounts({
      escrowAccount: escrowPda,
      vaultTokenAccount: vaultAta.address,
      recipientTokenAccount: recipientAta.address,
      initializer: provider.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
  console.log("  ✔ Settlement Tx Signature:", settleTx);

  // Final Balances Verification
  vaultBalance = await provider.connection.getTokenAccountBalance(vaultAta.address);
  const recipientBalance = await provider.connection.getTokenAccountBalance(recipientAta.address);

  console.log("\n==================================================");
  console.log("🎉 ATOMIC SETTLEMENT COMPLETE & VERIFIED");
  console.log("==================================================");
  console.log("Vault ATA Balance (Should be 0):", vaultBalance.value.uiAmount, "RWA");
  console.log("Recipient ATA Balance (Should be 500):", recipientBalance.value.uiAmount, "RWA");
  console.log("==================================================");
}

main().catch((err) => {
  console.error("\n❌ Execution Error:", err);
  process.exit(1);
});