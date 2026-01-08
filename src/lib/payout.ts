// Automated payout system for Degenerate Dice
// Sends SOL from escrow wallet to winners

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";

// Get Solana connection
function getConnection(): Connection {
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
  return new Connection(rpcUrl, "confirmed");
}

// Get escrow wallet keypair from private key
function getEscrowKeypair(): Keypair | null {
  const privateKey = process.env.ESCROW_WALLET_PRIVATE_KEY;

  if (!privateKey) {
    console.error("ESCROW_WALLET_PRIVATE_KEY not configured");
    return null;
  }

  try {
    // Support both base58 and JSON array formats
    if (privateKey.startsWith("[")) {
      // JSON array format
      const secretKey = Uint8Array.from(JSON.parse(privateKey));
      return Keypair.fromSecretKey(secretKey);
    } else {
      // Base58 format
      const secretKey = bs58.decode(privateKey);
      return Keypair.fromSecretKey(secretKey);
    }
  } catch (error) {
    console.error("Failed to parse escrow private key:", error);
    return null;
  }
}

export interface PayoutResult {
  wallet: string;
  amount: number;
  success: boolean;
  signature?: string;
  error?: string;
}

// Send a single payout
async function sendPayout(
  connection: Connection,
  escrowKeypair: Keypair,
  recipientAddress: string,
  amountSOL: number
): Promise<PayoutResult> {
  try {
    const recipient = new PublicKey(recipientAddress);
    const lamports = Math.floor(amountSOL * LAMPORTS_PER_SOL);

    // Create transfer transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: escrowKeypair.publicKey,
        toPubkey: recipient,
        lamports,
      })
    );

    // Send and confirm transaction
    const signature = await sendAndConfirmTransaction(connection, transaction, [escrowKeypair], {
      commitment: "confirmed",
      maxRetries: 3,
    });

    console.log(`Payout successful: ${amountSOL} SOL to ${recipientAddress} (tx: ${signature})`);

    return {
      wallet: recipientAddress,
      amount: amountSOL,
      success: true,
      signature,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Payout failed for ${recipientAddress}: ${errorMessage}`);

    return {
      wallet: recipientAddress,
      amount: amountSOL,
      success: false,
      error: errorMessage,
    };
  }
}

// Process all payouts for a round
export async function processPayouts(
  payouts: { wallet: string; amount: number }[]
): Promise<{
  success: boolean;
  results: PayoutResult[];
  totalPaid: number;
  failedCount: number;
}> {
  const results: PayoutResult[] = [];
  let totalPaid = 0;
  let failedCount = 0;

  // Check if payouts are enabled
  const escrowKeypair = getEscrowKeypair();
  if (!escrowKeypair) {
    console.warn("Automated payouts disabled - ESCROW_WALLET_PRIVATE_KEY not set");
    return {
      success: false,
      results: payouts.map((p) => ({
        wallet: p.wallet,
        amount: p.amount,
        success: false,
        error: "Automated payouts not configured",
      })),
      totalPaid: 0,
      failedCount: payouts.length,
    };
  }

  const connection = getConnection();

  // Check escrow balance first
  const escrowBalance = await connection.getBalance(escrowKeypair.publicKey);
  const totalRequired = payouts.reduce((sum, p) => sum + p.amount, 0);
  const totalRequiredLamports = Math.floor(totalRequired * LAMPORTS_PER_SOL);

  // Add buffer for transaction fees (0.001 SOL per transaction)
  const feeBuffer = payouts.length * 0.001 * LAMPORTS_PER_SOL;

  if (escrowBalance < totalRequiredLamports + feeBuffer) {
    console.error(
      `Insufficient escrow balance: ${escrowBalance / LAMPORTS_PER_SOL} SOL, need ${totalRequired + feeBuffer / LAMPORTS_PER_SOL} SOL`
    );
    return {
      success: false,
      results: payouts.map((p) => ({
        wallet: p.wallet,
        amount: p.amount,
        success: false,
        error: "Insufficient escrow balance",
      })),
      totalPaid: 0,
      failedCount: payouts.length,
    };
  }

  console.log(`Processing ${payouts.length} payouts, total: ${totalRequired} SOL`);

  // Process payouts sequentially to avoid nonce issues
  for (const payout of payouts) {
    // Skip tiny payouts (less than 0.001 SOL) - not worth the tx fee
    if (payout.amount < 0.001) {
      results.push({
        wallet: payout.wallet,
        amount: payout.amount,
        success: false,
        error: "Amount too small (< 0.001 SOL)",
      });
      failedCount++;
      continue;
    }

    const result = await sendPayout(connection, escrowKeypair, payout.wallet, payout.amount);
    results.push(result);

    if (result.success) {
      totalPaid += payout.amount;
    } else {
      failedCount++;
    }

    // Small delay between transactions to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  const success = failedCount === 0;
  console.log(
    `Payout batch complete: ${payouts.length - failedCount}/${payouts.length} successful, ${totalPaid} SOL paid`
  );

  return {
    success,
    results,
    totalPaid,
    failedCount,
  };
}

// Check escrow wallet balance
export async function getEscrowBalance(): Promise<number> {
  const escrowKeypair = getEscrowKeypair();
  if (!escrowKeypair) {
    return 0;
  }

  const connection = getConnection();
  const balance = await connection.getBalance(escrowKeypair.publicKey);
  return balance / LAMPORTS_PER_SOL;
}

// Check if automated payouts are configured
export function isPayoutConfigured(): boolean {
  return !!process.env.ESCROW_WALLET_PRIVATE_KEY;
}
