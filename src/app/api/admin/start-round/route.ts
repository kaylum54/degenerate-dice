import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { getTokensForNewRound, fetchTokenPricesByIds } from "@/lib/coingecko";

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

    // Check if there's already a live round
    const existingLiveRound = await storage.getLiveRound();
    if (existingLiveRound) {
      return NextResponse.json(
        { error: "A live round is already in progress" },
        { status: 400 }
      );
    }

    // Start fresh live round with new random tokens
    const tokens = await getTokensForNewRound(6);
    const tokenIds = tokens.map((t) => t.id);
    const priceMap = await fetchTokenPricesByIds(tokenIds);

    const startPrices: Record<string, number> = {};
    tokens.forEach((token) => {
      startPrices[token.symbol] = priceMap[token.id] || 0;
    });

    const round = await storage.startNewLiveRound(tokens, startPrices);

    return NextResponse.json({
      success: true,
      round,
      message: `Round is now LIVE with ${tokens.map((t) => t.symbol).join(", ")}!`,
    });
  } catch (error) {
    console.error("Error starting round:", error);
    return NextResponse.json(
      { error: "Failed to start round" },
      { status: 500 }
    );
  }
}
