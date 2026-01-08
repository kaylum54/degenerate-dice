// Vercel KV Storage for Degenerate Dice
// Falls back to in-memory storage if KV is not configured
// Note: Uses direct REST API instead of @vercel/kv due to reliability issues

import { RoundToken } from "./coingecko";

// Round timing constants
export const ROUND_DURATION_MS = 15 * 60 * 1000; // 15 minutes
export const BETTING_WINDOW_MS = 2 * 60 * 1000; // 2 minutes - betting allowed after round goes live
export const PREVIEW_WINDOW_MS = 2 * 60 * 1000; // 2 minutes - next round revealed before current ends

export interface Bet {
  id: string;
  wallet: string;
  token: string;
  amount: number;
  timestamp: number;
  txSignature: string;
  roundId: string;
}

export interface Round {
  id: string;
  startTime: number; // When round goes live (prices snapshotted)
  endTime: number; // When this round ends and winner is determined
  bettingEndsAt: number; // When betting closes (startTime + BETTING_WINDOW_MS)
  tokens: RoundToken[]; // Randomly selected tokens for this round
  startPrices: Record<string, number>; // Prices at startTime (keyed by token symbol)
  endPrices?: Record<string, number>;
  bets: Bet[];
  winner?: string;
  status: "preview" | "live" | "settled"; // preview = next round, live = in play, settled = done
  totalPool: number;
}

export interface LeaderboardEntry {
  wallet: string;
  totalWinnings: number;
  winCount: number;
}

// Helper to check if betting is open for a round
export function isBettingOpen(round: Round): boolean {
  if (round.status === "settled") return false;
  if (round.status === "preview") return true; // Preview rounds always accept bets
  // Live rounds only accept bets within the betting window
  return Date.now() < round.bettingEndsAt;
}

// KV Keys
const KEYS = {
  LIVE_ROUND_ID: "dice:live_round_id", // Currently playing round
  NEXT_ROUND_ID: "dice:next_round_id", // Preview/upcoming round
  ROUND: (id: string) => `dice:round:${id}`,
  LEADERBOARD: "dice:leaderboard",
  ACTIVITY_FEED: "dice:activity_feed",
};

// Check if KV is configured
const isKVConfigured = () => {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
};

// Direct REST API helper for Upstash KV (workaround for @vercel/kv bug)
const kvRest = {
  async get<T>(key: string): Promise<T | null> {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) return null;
    try {
      const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      if (data.result === null) return null;
      // Parse JSON if it's a stringified object
      if (typeof data.result === "string" && data.result.startsWith("{")) {
        return JSON.parse(data.result) as T;
      }
      return data.result as T;
    } catch (e) {
      console.error("KV REST get error:", e);
      return null;
    }
  },
  async set<T>(key: string, value: T): Promise<void> {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) return;
    try {
      const val = typeof value === "string" ? value : JSON.stringify(value);
      await fetch(`${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(val)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
    } catch (e) {
      console.error("KV REST set error:", e);
    }
  },
  async del(key: string): Promise<void> {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) return;
    try {
      await fetch(`${url}/del/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
    } catch (e) {
      console.error("KV REST del error:", e);
    }
  },
};

// In-memory fallback storage
class InMemoryStorage {
  private rounds: Map<string, Round> = new Map();
  private liveRoundId: string | null = null;
  private nextRoundId: string | null = null;
  private leaderboard: Map<string, LeaderboardEntry> = new Map();
  private activityFeed: Bet[] = [];

  // Get the current live round
  async getLiveRound(): Promise<Round | null> {
    if (!this.liveRoundId) return null;
    return this.rounds.get(this.liveRoundId) || null;
  }

  // Get the next/preview round
  async getNextRound(): Promise<Round | null> {
    if (!this.nextRoundId) return null;
    return this.rounds.get(this.nextRoundId) || null;
  }

  async getRound(id: string): Promise<Round | null> {
    return this.rounds.get(id) || null;
  }

  // Create a preview round (next round, not yet live)
  async createNextRound(tokens: RoundToken[]): Promise<Round> {
    const id = `round_${Date.now()}`;

    // Preview round - times will be set when it goes live
    const round: Round = {
      id,
      startTime: 0, // Will be set when promoted to live
      endTime: 0, // Will be set when promoted to live
      bettingEndsAt: 0, // Will be set when promoted to live
      tokens,
      startPrices: {}, // Will be set when promoted to live
      bets: [],
      status: "preview",
      totalPool: 0,
    };

    this.rounds.set(id, round);
    this.nextRoundId = id;
    return round;
  }

  // Promote next round to live (snapshot prices)
  async promoteNextRoundToLive(startPrices: Record<string, number>): Promise<Round | null> {
    const nextRound = await this.getNextRound();
    if (!nextRound) return null;

    const now = Date.now();
    nextRound.startTime = now;
    nextRound.endTime = now + ROUND_DURATION_MS;
    nextRound.bettingEndsAt = now + BETTING_WINDOW_MS;
    nextRound.startPrices = startPrices;
    nextRound.status = "live";

    this.rounds.set(nextRound.id, nextRound);
    this.liveRoundId = nextRound.id;
    this.nextRoundId = null;

    return nextRound;
  }

  // Start a new live round (when no next round exists)
  async startNewLiveRound(tokens: RoundToken[], startPrices: Record<string, number>): Promise<Round> {
    const id = `round_${Date.now()}`;
    const now = Date.now();

    const round: Round = {
      id,
      startTime: now,
      endTime: now + ROUND_DURATION_MS,
      bettingEndsAt: now + BETTING_WINDOW_MS,
      tokens,
      startPrices,
      bets: [],
      status: "live",
      totalPool: 0,
    };

    this.rounds.set(id, round);
    this.liveRoundId = id;
    return round;
  }

  async endRound(endPrices: Record<string, number>, winner: string): Promise<Round | null> {
    const round = await this.getLiveRound();
    if (!round) return null;

    round.endPrices = endPrices;
    round.winner = winner;
    round.status = "settled";
    this.rounds.set(round.id, round);
    this.liveRoundId = null;

    return round;
  }

  async addBet(wallet: string, token: string, amount: number, txSignature: string, roundId?: string): Promise<Bet | null> {
    let round: Round | null = null;

    if (roundId) {
      round = await this.getRound(roundId);
    } else {
      // Try next round first (preview), then live round
      round = await this.getNextRound();
      if (!round || !isBettingOpen(round)) {
        round = await this.getLiveRound();
      }
    }

    if (!round || !isBettingOpen(round)) return null;

    const bet: Bet = {
      id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      wallet,
      token,
      amount,
      timestamp: Date.now(),
      txSignature,
      roundId: round.id,
    };

    round.bets.push(bet);
    round.totalPool += amount;
    this.rounds.set(round.id, round);

    this.activityFeed.unshift(bet);
    if (this.activityFeed.length > 50) {
      this.activityFeed = this.activityFeed.slice(0, 50);
    }

    return bet;
  }

  async getBetCountsByToken(roundId?: string): Promise<Record<string, number>> {
    let round: Round | null = null;

    if (roundId) {
      round = await this.getRound(roundId);
    } else {
      round = await this.getLiveRound();
    }

    if (!round) return {};

    const counts: Record<string, number> = {};
    round.bets.forEach((bet) => {
      counts[bet.token] = (counts[bet.token] || 0) + 1;
    });
    return counts;
  }

  async updateLeaderboard(wallet: string, winnings: number): Promise<void> {
    const entry = this.leaderboard.get(wallet) || {
      wallet,
      totalWinnings: 0,
      winCount: 0,
    };
    entry.totalWinnings += winnings;
    entry.winCount += 1;
    this.leaderboard.set(wallet, entry);
  }

  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    return Array.from(this.leaderboard.values())
      .sort((a, b) => b.totalWinnings - a.totalWinnings)
      .slice(0, limit);
  }

  async getActivityFeed(limit: number = 10): Promise<Bet[]> {
    return this.activityFeed.slice(0, limit);
  }

  async getWinners(roundId: string): Promise<Bet[]> {
    const round = this.rounds.get(roundId);
    if (!round || !round.winner) return [];
    return round.bets.filter((bet) => bet.token === round.winner);
  }

  async calculatePayouts(roundId: string): Promise<{ wallet: string; amount: number }[]> {
    const round = this.rounds.get(roundId);
    if (!round || !round.winner) return [];

    const winners = await this.getWinners(roundId);
    if (winners.length === 0) return [];

    const fee = round.totalPool * 0.10;
    const prizePool = round.totalPool - fee;
    const totalWinnerBets = winners.reduce((sum, bet) => sum + bet.amount, 0);

    return winners.map((bet) => ({
      wallet: bet.wallet,
      amount: (bet.amount / totalWinnerBets) * prizePool,
    }));
  }

  seedFakeActivity(): void {
    const fakeWallets = ["7xKX...9fGh", "3mNp...2kLz", "9wQr...5jHy", "1vBn...8cXd", "5tYu...0sPw"];
    const tokens = ["BONK", "WIF", "POPCAT", "MOG", "SILLY", "MYRO"];

    for (let i = 0; i < 10; i++) {
      this.activityFeed.push({
        id: `fake_${i}`,
        wallet: fakeWallets[Math.floor(Math.random() * fakeWallets.length)],
        token: tokens[Math.floor(Math.random() * tokens.length)],
        amount: 0.01,
        timestamp: Date.now() - Math.random() * 3600000,
        txSignature: `fake_tx_${i}`,
        roundId: "demo",
      });
    }
  }
}

// Vercel KV Storage (using direct REST API for reliability)
class KVStorage {
  async getLiveRound(): Promise<Round | null> {
    try {
      const liveRoundId = await kvRest.get<string>(KEYS.LIVE_ROUND_ID);
      if (!liveRoundId) return null;
      return await kvRest.get<Round>(KEYS.ROUND(liveRoundId));
    } catch (error) {
      console.error("KV getLiveRound error:", error);
      return null;
    }
  }

  async getNextRound(): Promise<Round | null> {
    try {
      const nextRoundId = await kvRest.get<string>(KEYS.NEXT_ROUND_ID);
      if (!nextRoundId) return null;
      return await kvRest.get<Round>(KEYS.ROUND(nextRoundId));
    } catch (error) {
      console.error("KV getNextRound error:", error);
      return null;
    }
  }

  async getRound(id: string): Promise<Round | null> {
    try {
      return await kvRest.get<Round>(KEYS.ROUND(id));
    } catch (error) {
      console.error("KV getRound error:", error);
      return null;
    }
  }

  async createNextRound(tokens: RoundToken[]): Promise<Round> {
    const id = `round_${Date.now()}`;

    const round: Round = {
      id,
      startTime: 0,
      endTime: 0,
      bettingEndsAt: 0,
      tokens,
      startPrices: {},
      bets: [],
      status: "preview",
      totalPool: 0,
    };

    await kvRest.set(KEYS.ROUND(id), round);
    await kvRest.set(KEYS.NEXT_ROUND_ID, id);

    return round;
  }

  async promoteNextRoundToLive(startPrices: Record<string, number>): Promise<Round | null> {
    const nextRound = await this.getNextRound();
    if (!nextRound) return null;

    const now = Date.now();
    nextRound.startTime = now;
    nextRound.endTime = now + ROUND_DURATION_MS;
    nextRound.bettingEndsAt = now + BETTING_WINDOW_MS;
    nextRound.startPrices = startPrices;
    nextRound.status = "live";

    await kvRest.set(KEYS.ROUND(nextRound.id), nextRound);
    await kvRest.set(KEYS.LIVE_ROUND_ID, nextRound.id);
    await kvRest.del(KEYS.NEXT_ROUND_ID);

    return nextRound;
  }

  async startNewLiveRound(tokens: RoundToken[], startPrices: Record<string, number>): Promise<Round> {
    const id = `round_${Date.now()}`;
    const now = Date.now();

    const round: Round = {
      id,
      startTime: now,
      endTime: now + ROUND_DURATION_MS,
      bettingEndsAt: now + BETTING_WINDOW_MS,
      tokens,
      startPrices,
      bets: [],
      status: "live",
      totalPool: 0,
    };

    await kvRest.set(KEYS.ROUND(id), round);
    await kvRest.set(KEYS.LIVE_ROUND_ID, id);

    return round;
  }

  async endRound(endPrices: Record<string, number>, winner: string): Promise<Round | null> {
    const round = await this.getLiveRound();
    if (!round) return null;

    round.endPrices = endPrices;
    round.winner = winner;
    round.status = "settled";

    await kvRest.set(KEYS.ROUND(round.id), round);
    await kvRest.del(KEYS.LIVE_ROUND_ID);

    return round;
  }

  async addBet(wallet: string, token: string, amount: number, txSignature: string, roundId?: string): Promise<Bet | null> {
    let round: Round | null = null;

    if (roundId) {
      round = await this.getRound(roundId);
    } else {
      round = await this.getNextRound();
      if (!round || !isBettingOpen(round)) {
        round = await this.getLiveRound();
      }
    }

    if (!round || !isBettingOpen(round)) return null;

    const bet: Bet = {
      id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      wallet,
      token,
      amount,
      timestamp: Date.now(),
      txSignature,
      roundId: round.id,
    };

    round.bets.push(bet);
    round.totalPool += amount;
    await kvRest.set(KEYS.ROUND(round.id), round);

    const activityFeed = (await kvRest.get<Bet[]>(KEYS.ACTIVITY_FEED)) || [];
    activityFeed.unshift(bet);
    await kvRest.set(KEYS.ACTIVITY_FEED, activityFeed.slice(0, 50));

    return bet;
  }

  async getBetCountsByToken(roundId?: string): Promise<Record<string, number>> {
    let round: Round | null = null;

    if (roundId) {
      round = await this.getRound(roundId);
    } else {
      round = await this.getLiveRound();
    }

    if (!round) return {};

    const counts: Record<string, number> = {};
    round.bets.forEach((bet) => {
      counts[bet.token] = (counts[bet.token] || 0) + 1;
    });
    return counts;
  }

  async updateLeaderboard(wallet: string, winnings: number): Promise<void> {
    const leaderboard = (await kvRest.get<Record<string, LeaderboardEntry>>(KEYS.LEADERBOARD)) || {};

    const entry = leaderboard[wallet] || {
      wallet,
      totalWinnings: 0,
      winCount: 0,
    };
    entry.totalWinnings += winnings;
    entry.winCount += 1;
    leaderboard[wallet] = entry;

    await kvRest.set(KEYS.LEADERBOARD, leaderboard);
  }

  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    const leaderboard = (await kvRest.get<Record<string, LeaderboardEntry>>(KEYS.LEADERBOARD)) || {};

    return Object.values(leaderboard)
      .sort((a, b) => b.totalWinnings - a.totalWinnings)
      .slice(0, limit);
  }

  async getActivityFeed(limit: number = 10): Promise<Bet[]> {
    const activityFeed = (await kvRest.get<Bet[]>(KEYS.ACTIVITY_FEED)) || [];
    return activityFeed.slice(0, limit);
  }

  async getWinners(roundId: string): Promise<Bet[]> {
    const round = await this.getRound(roundId);
    if (!round || !round.winner) return [];
    return round.bets.filter((bet) => bet.token === round.winner);
  }

  async calculatePayouts(roundId: string): Promise<{ wallet: string; amount: number }[]> {
    const round = await this.getRound(roundId);
    if (!round || !round.winner) return [];

    const winners = await this.getWinners(roundId);
    if (winners.length === 0) return [];

    const fee = round.totalPool * 0.10;
    const prizePool = round.totalPool - fee;
    const totalWinnerBets = winners.reduce((sum, bet) => sum + bet.amount, 0);

    return winners.map((bet) => ({
      wallet: bet.wallet,
      amount: (bet.amount / totalWinnerBets) * prizePool,
    }));
  }

  seedFakeActivity(): void {
    // No-op for KV
  }
}

// Storage interface
interface IStorage {
  getLiveRound(): Promise<Round | null>;
  getNextRound(): Promise<Round | null>;
  getRound(id: string): Promise<Round | null>;
  createNextRound(tokens: RoundToken[]): Promise<Round>;
  promoteNextRoundToLive(startPrices: Record<string, number>): Promise<Round | null>;
  startNewLiveRound(tokens: RoundToken[], startPrices: Record<string, number>): Promise<Round>;
  endRound(endPrices: Record<string, number>, winner: string): Promise<Round | null>;
  addBet(wallet: string, token: string, amount: number, txSignature: string, roundId?: string): Promise<Bet | null>;
  getBetCountsByToken(roundId?: string): Promise<Record<string, number>>;
  updateLeaderboard(wallet: string, winnings: number): Promise<void>;
  getLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
  getActivityFeed(limit?: number): Promise<Bet[]>;
  getWinners(roundId: string): Promise<Bet[]>;
  calculatePayouts(roundId: string): Promise<{ wallet: string; amount: number }[]>;
  seedFakeActivity(): void;
}

function createStorage(): IStorage {
  const isServer = typeof window === "undefined";

  // On the client, env vars aren't available - return a no-op storage
  // All actual storage operations happen via API routes (server-side)
  if (!isServer) {
    return new InMemoryStorage();
  }

  if (isKVConfigured()) {
    console.log("Using Vercel KV storage");
    return new KVStorage();
  } else {
    console.log("Using in-memory storage (KV not configured)");
    const memStorage = new InMemoryStorage();
    memStorage.seedFakeActivity();
    return memStorage;
  }
}

export const storage = createStorage();
