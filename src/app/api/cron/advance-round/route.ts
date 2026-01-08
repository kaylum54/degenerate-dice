import { NextResponse } from "next/server";
import { storage, PREVIEW_WINDOW_MS } from "@/lib/storage";
import { getTokensForNewRound, fetchTokenPricesByIds } from "@/lib/coingecko";
import { processPayouts, isPayoutConfigured } from "@/lib/payout";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60 seconds for this endpoint (payouts take time)

// This endpoint handles automatic round progression
// It should be called periodically (every 30-60 seconds) via:
// - Vercel Cron
// - Client-side polling
// - External cron service

export async function GET() {
  try {
    const actions: string[] = [];

    const liveRound = await storage.getLiveRound();
    const nextRound = await storage.getNextRound();
    const now = Date.now();

    // Check if live round has ended
    if (liveRound && now >= liveRound.endTime) {
      // End the live round
      const tokenIds = liveRound.tokens.map((t) => t.id);
      const priceMap = await fetchTokenPricesByIds(tokenIds);

      const endPrices: Record<string, number> = {};
      liveRound.tokens.forEach((token) => {
        endPrices[token.symbol] = priceMap[token.id] || 0;
      });

      // Calculate winner
      let maxChange = -Infinity;
      let winner = liveRound.tokens[0]?.symbol || "UNKNOWN";

      liveRound.tokens.forEach((token) => {
        const startPrice = liveRound.startPrices[token.symbol] || 0;
        const endPrice = endPrices[token.symbol] || 0;
        const change = startPrice > 0 ? ((endPrice - startPrice) / startPrice) * 100 : 0;

        if (change > maxChange) {
          maxChange = change;
          winner = token.symbol;
        }
      });

      // End the round
      await storage.endRound(endPrices, winner);
      actions.push(`Ended live round. Winner: ${winner} (${maxChange.toFixed(2)}%)`);

      // Calculate payouts
      const payouts = await storage.calculatePayouts(liveRound.id);

      // Send automated payouts if configured
      if (payouts.length > 0 && isPayoutConfigured()) {
        const payoutResult = await processPayouts(payouts);
        actions.push(
          `Sent ${payoutResult.results.length - payoutResult.failedCount}/${payoutResult.results.length} payouts (${payoutResult.totalPaid.toFixed(4)} SOL)`
        );

        // Update leaderboard for successful payouts
        for (const result of payoutResult.results) {
          if (result.success) {
            await storage.updateLeaderboard(result.wallet, result.amount);
          }
        }

        // Log failed payouts
        const failedPayouts = payoutResult.results.filter((r) => !r.success);
        if (failedPayouts.length > 0) {
          console.error("Failed payouts:", failedPayouts);
          actions.push(`WARNING: ${failedPayouts.length} payouts failed`);
        }
      } else if (payouts.length > 0) {
        // Payouts not configured - just update leaderboard
        for (const { wallet, amount } of payouts) {
          await storage.updateLeaderboard(wallet, amount);
        }
        actions.push(`Recorded ${payouts.length} payouts (manual payout required - auto-payout not configured)`);
      } else {
        actions.push("No winners this round");
      }

      // Promote next round to live if it exists
      if (nextRound) {
        const nextTokenIds = nextRound.tokens.map((t) => t.id);
        const nextPriceMap = await fetchTokenPricesByIds(nextTokenIds);

        const startPrices: Record<string, number> = {};
        nextRound.tokens.forEach((token) => {
          startPrices[token.symbol] = nextPriceMap[token.id] || 0;
        });

        await storage.promoteNextRoundToLive(startPrices);
        actions.push(`Promoted next round to live with tokens: ${nextRound.tokens.map(t => t.symbol).join(", ")}`);
      } else {
        // Start a fresh live round
        const tokens = await getTokensForNewRound(6);
        const newTokenIds = tokens.map((t) => t.id);
        const newPriceMap = await fetchTokenPricesByIds(newTokenIds);

        const startPrices: Record<string, number> = {};
        tokens.forEach((token) => {
          startPrices[token.symbol] = newPriceMap[token.id] || 0;
        });

        await storage.startNewLiveRound(tokens, startPrices);
        actions.push(`Started new live round with tokens: ${tokens.map(t => t.symbol).join(", ")}`);
      }
    }

    // Check if we need to create preview for next round (2 min before live round ends)
    const currentLiveRound = await storage.getLiveRound();
    const currentNextRound = await storage.getNextRound();

    if (currentLiveRound && !currentNextRound) {
      const timeUntilEnd = currentLiveRound.endTime - now;

      if (timeUntilEnd <= PREVIEW_WINDOW_MS && timeUntilEnd > 0) {
        // Create preview for next round
        const tokens = await getTokensForNewRound(6);
        await storage.createNextRound(tokens);
        actions.push(`Created next round preview with tokens: ${tokens.map(t => t.symbol).join(", ")}`);
      }
    }

    // If no live round exists, start one
    if (!currentLiveRound && !currentNextRound) {
      const noLive = await storage.getLiveRound();

      if (!noLive) {
        const tokens = await getTokensForNewRound(6);
        const tokenIds = tokens.map((t) => t.id);
        const priceMap = await fetchTokenPricesByIds(tokenIds);

        const startPrices: Record<string, number> = {};
        tokens.forEach((token) => {
          startPrices[token.symbol] = priceMap[token.id] || 0;
        });

        await storage.startNewLiveRound(tokens, startPrices);
        actions.push(`Started initial round with tokens: ${tokens.map(t => t.symbol).join(", ")}`);
      }
    }

    return NextResponse.json({
      success: true,
      actions,
      timestamp: now,
    });
  } catch (error) {
    console.error("Error in round advancement:", error);
    return NextResponse.json(
      { error: "Failed to advance round", details: String(error) },
      { status: 500 }
    );
  }
}
