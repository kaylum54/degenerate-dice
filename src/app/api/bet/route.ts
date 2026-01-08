import { NextRequest, NextResponse } from "next/server";
import { storage, isBettingOpen } from "@/lib/storage";
import { isValidSolanaAddress, isValidBetAmount, MIN_BET_AMOUNT, MAX_BET_AMOUNT } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface BetRequest {
  wallet: string;
  token: string;
  amount: number;
  txSignature: string;
  roundId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BetRequest = await request.json();
    const { wallet, token, amount, txSignature, roundId } = body;

    // Validate wallet address
    if (!wallet || !isValidSolanaAddress(wallet)) {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    // Find the appropriate round to bet on
    let targetRound = null;

    if (roundId) {
      // Specific round requested
      targetRound = await storage.getRound(roundId);
      if (!targetRound) {
        return NextResponse.json(
          { error: "Round not found" },
          { status: 400 }
        );
      }
    } else {
      // Try next round first (preview), then live round
      const nextRound = await storage.getNextRound();
      if (nextRound && isBettingOpen(nextRound)) {
        targetRound = nextRound;
      } else {
        const liveRound = await storage.getLiveRound();
        if (liveRound && isBettingOpen(liveRound)) {
          targetRound = liveRound;
        }
      }
    }

    if (!targetRound) {
      return NextResponse.json(
        { error: "No active round accepting bets" },
        { status: 400 }
      );
    }

    // Check if betting is open for this round
    if (!isBettingOpen(targetRound)) {
      return NextResponse.json(
        { error: "Betting is closed for this round" },
        { status: 400 }
      );
    }

    // Validate token against round's tokens
    const validToken = targetRound.tokens?.find((t) => t.symbol === token);
    if (!validToken) {
      return NextResponse.json(
        { error: "Invalid token for this round" },
        { status: 400 }
      );
    }

    // Validate amount
    if (!isValidBetAmount(amount)) {
      return NextResponse.json(
        { error: `Bet amount must be between ${MIN_BET_AMOUNT} and ${MAX_BET_AMOUNT} SOL` },
        { status: 400 }
      );
    }

    // Validate transaction signature
    if (!txSignature || txSignature.length < 32) {
      return NextResponse.json(
        { error: "Invalid transaction signature" },
        { status: 400 }
      );
    }

    // Record bet
    const bet = await storage.addBet(wallet, token, amount, txSignature, targetRound.id);

    if (!bet) {
      return NextResponse.json(
        { error: "Failed to record bet - betting may have closed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bet,
      roundId: targetRound.id,
      roundStatus: targetRound.status,
      message: `Bet placed on ${token} for ${targetRound.status === "preview" ? "next" : "current"} round`,
    });
  } catch (error) {
    console.error("Error placing bet:", error);
    return NextResponse.json(
      { error: "Failed to place bet" },
      { status: 500 }
    );
  }
}
