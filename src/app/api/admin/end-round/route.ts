import { NextRequest, NextResponse } from "next/server";
import { storage, RoundHistoryEntry } from "@/lib/storage";
import { fetchTokenPricesByIds } from "@/lib/coingecko";
import { processPayouts, isPayoutConfigured } from "@/lib/payout";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60 seconds for payouts

// Calculate percentage change between two prices
function calculatePercentageChange(startPrice: number, endPrice: number): number {
  if (startPrice === 0) return 0;
  return ((endPrice - startPrice) / startPrice) * 100;
}

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

    // Check if there's an active live round
    const liveRound = await storage.getLiveRound();
    if (!liveRound) {
      return NextResponse.json(
        { error: "No live round to end" },
        { status: 400 }
      );
    }

    if (liveRound.status === "settled") {
      return NextResponse.json(
        { error: "Round already settled" },
        { status: 400 }
      );
    }

    // Check for minimum 2 unique bettors
    const uniqueWallets = new Set(liveRound.bets.map((bet) => bet.wallet));
    const uniqueBettorCount = uniqueWallets.size;

    // If less than 2 unique bettors, refund all bets
    if (uniqueBettorCount < 2 && liveRound.bets.length > 0) {
      // Process refunds - return full bet amount (no fee)
      const refunds = liveRound.bets.map((bet) => ({
        wallet: bet.wallet,
        amount: bet.amount, // Full refund, no fee
      }));

      let refundResult = null;
      if (isPayoutConfigured()) {
        refundResult = await processPayouts(refunds);
      }

      // End round with no winner (refund scenario)
      const refundedRound = await storage.endRound({}, "REFUNDED");

      // Save to history as refunded
      const historyEntry: RoundHistoryEntry = {
        round: refundedRound!,
        payouts: refunds.map((r) => ({
          wallet: r.wallet,
          amount: r.amount,
          betAmount: r.amount,
          txSignature: refundResult?.results.find((res) => res.wallet === r.wallet && res.success)?.signature,
        })),
        priceChanges: [],
        settledAt: Date.now(),
      };
      await storage.saveRoundToHistory(historyEntry);

      return NextResponse.json({
        success: true,
        refunded: true,
        reason: `Only ${uniqueBettorCount} unique bettor(s) - minimum 2 required`,
        round: refundedRound,
        refunds,
        refundResult: refundResult
          ? {
              totalRefunded: refundResult.totalPaid,
              successCount: refundResult.results.length - refundResult.failedCount,
              failedCount: refundResult.failedCount,
            }
          : null,
        autoPayoutEnabled: isPayoutConfigured(),
        message: `Round refunded! Only ${uniqueBettorCount} unique bettor(s) - need at least 2 to play.`,
      });
    }

    // Fetch current prices for the round's tokens
    const tokenIds = liveRound.tokens.map((t) => t.id);
    const priceMap = await fetchTokenPricesByIds(tokenIds);

    const endPrices: Record<string, number> = {};
    liveRound.tokens.forEach((token) => {
      endPrices[token.symbol] = priceMap[token.id] || 0;
    });

    // Calculate percentage changes and find winner
    const changes: { symbol: string; change: number }[] = [];

    liveRound.tokens.forEach((token) => {
      const startPrice = liveRound.startPrices[token.symbol] || 0;
      const endPrice = endPrices[token.symbol] || 0;
      const change = calculatePercentageChange(startPrice, endPrice);
      changes.push({ symbol: token.symbol, change });
    });

    // Sort by change (highest first)
    changes.sort((a, b) => b.change - a.change);
    const winner = changes[0].symbol;

    // End the round
    const settledRound = await storage.endRound(endPrices, winner);

    if (!settledRound) {
      return NextResponse.json(
        { error: "Failed to settle round" },
        { status: 500 }
      );
    }

    // Calculate payouts
    const payouts = await storage.calculatePayouts(settledRound.id);

    // Send automated payouts if configured
    let payoutResult = null;
    if (payouts.length > 0 && isPayoutConfigured()) {
      payoutResult = await processPayouts(payouts);

      // Update leaderboard for successful payouts only
      for (const result of payoutResult.results) {
        if (result.success) {
          await storage.updateLeaderboard(result.wallet, result.amount);
        }
      }
    } else {
      // Manual payouts - just update leaderboard
      for (const { wallet, amount } of payouts) {
        await storage.updateLeaderboard(wallet, amount);
      }
    }

    // Save round to history for auditing
    const priceChanges = liveRound.tokens.map((token) => {
      const startPrice = liveRound.startPrices[token.symbol] || 0;
      const endPrice = endPrices[token.symbol] || 0;
      const change = calculatePercentageChange(startPrice, endPrice);
      return { symbol: token.symbol, startPrice, endPrice, change };
    });

    // Get winning bets with their bet amounts
    const winningBets = settledRound.bets.filter((bet) => bet.token === winner);
    const payoutsWithBetAmount = payouts.map((p) => {
      const winningBet = winningBets.find((b) => b.wallet === p.wallet);
      const payoutTx = payoutResult?.results.find((r) => r.wallet === p.wallet && r.success);
      return {
        wallet: p.wallet,
        amount: p.amount,
        betAmount: winningBet?.amount || 0,
        txSignature: payoutTx?.signature,
      };
    });

    const historyEntry: RoundHistoryEntry = {
      round: settledRound,
      payouts: payoutsWithBetAmount,
      priceChanges,
      settledAt: Date.now(),
    };

    await storage.saveRoundToHistory(historyEntry);

    return NextResponse.json({
      success: true,
      round: settledRound,
      winner,
      changes,
      payouts,
      payoutResult: payoutResult
        ? {
            totalPaid: payoutResult.totalPaid,
            successCount: payoutResult.results.length - payoutResult.failedCount,
            failedCount: payoutResult.failedCount,
          }
        : null,
      autoPayoutEnabled: isPayoutConfigured(),
      message: `Round ended! Winner: ${winner} (${changes[0].change.toFixed(2)}%)`,
    });
  } catch (error) {
    console.error("Error ending round:", error);
    return NextResponse.json(
      { error: "Failed to end round" },
      { status: 500 }
    );
  }
}
