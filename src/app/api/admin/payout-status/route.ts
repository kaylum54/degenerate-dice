import { NextRequest, NextResponse } from "next/server";
import { isPayoutConfigured, getEscrowBalance } from "@/lib/payout";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Verify admin password
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword || password !== adminPassword) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const configured = isPayoutConfigured();
    let escrowBalance = 0;
    let escrowWallet = null;

    if (configured) {
      try {
        escrowBalance = await getEscrowBalance();
        // Get the public key of the escrow wallet
        const { Keypair } = await import("@solana/web3.js");
        const bs58 = await import("bs58");
        const privateKey = process.env.ESCROW_WALLET_PRIVATE_KEY;
        if (privateKey) {
          let keypair: InstanceType<typeof Keypair>;
          if (privateKey.startsWith("[")) {
            keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(privateKey)));
          } else {
            keypair = Keypair.fromSecretKey(bs58.default.decode(privateKey));
          }
          escrowWallet = keypair.publicKey.toBase58();
        }
      } catch (e) {
        console.error("Error getting escrow balance:", e);
      }
    }

    return NextResponse.json({
      payoutConfigured: configured,
      escrowWallet,
      escrowBalance,
      rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
    });
  } catch (error) {
    console.error("Error checking payout status:", error);
    return NextResponse.json(
      { error: "Failed to check payout status" },
      { status: 500 }
    );
  }
}
