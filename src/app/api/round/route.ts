import { NextResponse } from "next/server";
import { storage, ROUND_DURATION_MS, BETTING_WINDOW_MS, PREVIEW_WINDOW_MS, isBettingOpen } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const liveRound = await storage.getLiveRound();
    const nextRound = await storage.getNextRound();
    const activity = await storage.getActivityFeed(10);

    // Get bet counts for both rounds
    const liveBetCounts = liveRound ? await storage.getBetCountsByToken(liveRound.id) : {};
    const nextBetCounts = nextRound ? await storage.getBetCountsByToken(nextRound.id) : {};

    // Calculate betting status
    const now = Date.now();
    let bettingStatus: "open" | "locked" | "none" = "none";
    let bettingTarget: "live" | "next" | null = null;
    let bettingEndsIn: number | null = null;

    if (nextRound && isBettingOpen(nextRound)) {
      // Next round is accepting bets (preview phase)
      bettingStatus = "open";
      bettingTarget = "next";
      // Betting on next round ends when it goes live + 2 min
      if (liveRound) {
        // Will go live when current round ends, then 2 min betting
        bettingEndsIn = (liveRound.endTime - now) + BETTING_WINDOW_MS;
      }
    } else if (liveRound && isBettingOpen(liveRound)) {
      // Live round is still accepting bets
      bettingStatus = "open";
      bettingTarget = "live";
      bettingEndsIn = liveRound.bettingEndsAt - now;
    } else if (liveRound) {
      // Live round exists but betting is locked
      bettingStatus = "locked";
    }

    return NextResponse.json({
      liveRound,
      nextRound,
      liveBetCounts,
      nextBetCounts,
      activity,
      betting: {
        status: bettingStatus,
        target: bettingTarget,
        endsIn: bettingEndsIn,
        isLiveRoundBettingOpen: liveRound ? isBettingOpen(liveRound) : false,
        isNextRoundBettingOpen: nextRound ? isBettingOpen(nextRound) : false,
      },
      config: {
        roundDuration: ROUND_DURATION_MS,
        bettingWindow: BETTING_WINDOW_MS,
        previewWindow: PREVIEW_WINDOW_MS,
      },
    });
  } catch (error) {
    console.error("Error fetching round:", error);
    return NextResponse.json(
      { error: "Failed to fetch round" },
      { status: 500 }
    );
  }
}
