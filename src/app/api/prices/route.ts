import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { fetchRoundTokenPrices } from "@/lib/coingecko";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get the live round
    const liveRound = await storage.getLiveRound();

    if (!liveRound || !liveRound.tokens) {
      return NextResponse.json({
        prices: [],
        timestamp: Date.now(),
      });
    }

    // Fetch prices for the round's tokens
    const prices = await fetchRoundTokenPrices(liveRound.tokens);

    return NextResponse.json({
      prices,
      tokens: liveRound.tokens,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error fetching prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    );
  }
}
