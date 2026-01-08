// Token fetching API - uses DexScreener for new Solana tokens

export interface SolanaToken {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  market_cap: number;
  total_volume: number;
  address?: string; // Solana token address
}

export interface RoundToken {
  id: string;
  symbol: string;
  name: string;
  image: string;
  color: string;
  address?: string; // Solana token address for price lookups
}

// DexScreener pair response type
interface DexScreenerPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
  };
  priceChange: {
    h24: number;
  };
  liquidity: {
    usd: number;
  };
  fdv: number;
  pairCreatedAt: number;
  info?: {
    imageUrl?: string;
  };
}

// Predefined colors for tokens
const TOKEN_COLORS = [
  "#F72585", // Pink
  "#00F5D4", // Cyan
  "#9D4EDD", // Purple
  "#FF6D00", // Orange
  "#4CC9F0", // Light Blue
  "#7209B7", // Deep Purple
  "#F77F00", // Amber
  "#06D6A0", // Teal
  "#EF476F", // Coral
  "#118AB2", // Ocean Blue
];

const DEXSCREENER_API = "https://api.dexscreener.com";
const COINGECKO_API = "https://api.coingecko.com/api/v3";

// Fetch top 30 Solana tokens by 24h volume from DexScreener
export async function fetchNewSolanaTokens(): Promise<SolanaToken[]> {
  try {
    // Use multiple search queries to get a good variety of high-volume Solana tokens
    const searchQueries = ["SOL", "meme", "ai", "defi"];
    const allPairs: DexScreenerPair[] = [];

    // Fetch pairs from multiple search queries in parallel
    const searchPromises = searchQueries.map(async (query) => {
      try {
        const response = await fetch(
          `${DEXSCREENER_API}/latest/dex/search?q=${query}`,
          {
            headers: { accept: "application/json" },
            next: { revalidate: 300 },
          }
        );
        if (response.ok) {
          const data = await response.json();
          return data.pairs || [];
        }
      } catch (e) {
        console.error(`Error fetching search results for ${query}:`, e);
      }
      return [];
    });

    // Also fetch boosted tokens (with error handling)
    const boostPromise = fetch(`${DEXSCREENER_API}/token-boosts/top/v1`, {
      headers: { accept: "application/json" },
      next: { revalidate: 300 },
    }).catch((e) => {
      console.error("Error fetching boosted tokens:", e);
      return null;
    });

    const [searchResults, boostResponse] = await Promise.all([
      Promise.all(searchPromises),
      boostPromise,
    ]);

    // Combine all search results
    for (const pairs of searchResults) {
      allPairs.push(...pairs);
    }

    // Process boosted tokens
    if (boostResponse && boostResponse.ok) {
      const boostData = await boostResponse.json();
      const boostTokens = Array.isArray(boostData) ? boostData : [];
      // Fetch pair data for top boosted Solana tokens
      for (const token of boostTokens.slice(0, 15)) {
        if (token.chainId === "solana" && token.tokenAddress) {
          try {
            const pairRes = await fetch(
              `${DEXSCREENER_API}/latest/dex/tokens/${token.tokenAddress}`,
              { headers: { accept: "application/json" }, next: { revalidate: 60 } }
            );
            if (pairRes.ok) {
              const pairData = await pairRes.json();
              if (pairData.pairs) allPairs.push(...pairData.pairs);
            }
          } catch (e) {
            console.error("Error fetching boosted token pairs:", e);
          }
        }
      }
    }

    // Filter to Solana pairs with good liquidity and volume
    const solanaPairs = allPairs.filter((pair) => {
      const isSOL = pair.chainId === "solana";
      const hasLiquidity = (pair.liquidity?.usd || 0) > 10000; // Min $10k liquidity
      const hasVolume = (pair.volume?.h24 || 0) > 50000; // Min $50k 24h volume
      const isNotStable = !["USDC", "USDT", "SOL", "WSOL", "WETH", "USDE", "DAI"].includes(
        pair.baseToken?.symbol?.toUpperCase() || ""
      );

      return isSOL && hasLiquidity && hasVolume && isNotStable;
    });

    console.log(`DexScreener: Found ${allPairs.length} total pairs, ${solanaPairs.length} valid Solana pairs`);

    // Sort by 24h volume (highest first) and take top pairs
    const sortedPairs = solanaPairs
      .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0));

    // Deduplicate by token address and take top 30
    const seenAddresses = new Set<string>();
    const uniqueTokens: SolanaToken[] = [];

    for (const pair of sortedPairs) {
      if (!pair.baseToken?.address) continue;
      if (seenAddresses.has(pair.baseToken.address)) continue;
      seenAddresses.add(pair.baseToken.address);

      uniqueTokens.push({
        id: pair.baseToken.address, // Use address as ID
        symbol: pair.baseToken.symbol,
        name: pair.baseToken.name,
        image: pair.info?.imageUrl || `https://dd.dexscreener.com/ds-data/tokens/solana/${pair.baseToken.address}.png`,
        current_price: parseFloat(pair.priceUsd) || 0,
        price_change_percentage_24h: pair.priceChange?.h24 || 0,
        market_cap: pair.fdv || 0,
        total_volume: pair.volume?.h24 || 0,
        address: pair.baseToken.address,
      });

      // Stop at 30 tokens
      if (uniqueTokens.length >= 30) break;
    }

    console.log(`Fetched ${uniqueTokens.length} top Solana tokens by 24h volume from DexScreener`);

    if (uniqueTokens.length < 6) {
      console.log("Not enough tokens from DexScreener, falling back to CoinGecko");
      return await fetchTopSolanaTokensFallback();
    }

    return uniqueTokens;
  } catch (error) {
    console.error("Error fetching Solana tokens from DexScreener:", error);
    return await fetchTopSolanaTokensFallback();
  }
}

// Known Solana token addresses for popular tokens (used when CoinGecko returns these)
const KNOWN_TOKEN_ADDRESSES: Record<string, string> = {
  "bonk": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  "dogwifcoin": "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
  "popcat": "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
  "jito-governance-token": "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",
  "jupiter-exchange-solana": "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  "raydium": "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
  "pyth-network": "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",
  "helium": "hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux",
  "render-token": "rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof",
  "orca": "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
  "marinade-staked-sol": "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
  "solend": "SLNDpmoWTVADgEdndyvWzroNL7zSi1dF9PC3xHGtPwp",
  "magic-eden": "MEAQbSz8SdApMGw8N1FfAdNr4Y7vNKhMNXrRFvCUNMo",
};

// Fallback: Fetch top Solana tokens from CoinGecko and map to addresses
async function fetchTopSolanaTokensFallback(): Promise<SolanaToken[]> {
  try {
    const response = await fetch(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&category=solana-ecosystem&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h`,
      {
        headers: {
          accept: "application/json",
        },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      console.error(`CoinGecko fallback API error: ${response.status}`);
      return [];
    }

    const data: SolanaToken[] = await response.json();

    // Map CoinGecko IDs to Solana addresses where known
    const tokensWithAddresses = data.map((token) => {
      const address = KNOWN_TOKEN_ADDRESSES[token.id];
      return {
        ...token,
        id: address || token.id, // Use address as ID if known
        address: address,
      };
    });

    console.log(`Fallback: Fetched ${data.length} tokens from CoinGecko, ${tokensWithAddresses.filter(t => t.address).length} with known addresses`);
    return tokensWithAddresses;
  } catch (error) {
    console.error("Error fetching from CoinGecko fallback:", error);
    return [];
  }
}

// Legacy function name for compatibility
export async function fetchTopSolanaTokens(): Promise<SolanaToken[]> {
  return fetchNewSolanaTokens();
}

// Select random tokens from the fetched list
export function selectRandomTokens(
  tokens: SolanaToken[],
  count: number = 6
): RoundToken[] {
  if (tokens.length === 0) {
    console.log("No tokens available, using fallback tokens");
    return getFallbackTokens();
  }

  // Filter out tokens with very low volume, no price, or 0% change (looks bad for users)
  const validTokens = tokens.filter(
    (t) => t.total_volume > 1000 &&
           t.current_price > 0 &&
           Math.abs(t.price_change_percentage_24h) > 0.01 // Exclude 0.00% change
  );

  console.log(`Token selection: ${tokens.length} total, ${validTokens.length} after filtering out 0% change`);

  if (validTokens.length < count) {
    console.log(`Only ${validTokens.length} valid tokens, using fallback`);
    return getFallbackTokens();
  }

  // Shuffle and pick random tokens
  const shuffled = [...validTokens].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  return selected.map((token, index) => ({
    id: token.id,
    symbol: token.symbol.toUpperCase(),
    name: token.name,
    image: token.image,
    color: TOKEN_COLORS[index % TOKEN_COLORS.length],
    address: token.address,
  }));
}

// Fallback tokens in case API fails - includes Solana addresses for DexScreener price fetching
function getFallbackTokens(): RoundToken[] {
  return [
    {
      id: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", // BONK address
      symbol: "BONK",
      name: "Bonk",
      image: "https://dd.dexscreener.com/ds-data/tokens/solana/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263.png",
      color: "#F7931A",
      address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    },
    {
      id: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", // WIF address
      symbol: "WIF",
      name: "dogwifhat",
      image: "https://dd.dexscreener.com/ds-data/tokens/solana/EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm.png",
      color: "#C4A484",
      address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
    },
    {
      id: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr", // POPCAT address
      symbol: "POPCAT",
      name: "Popcat",
      image: "https://dd.dexscreener.com/ds-data/tokens/solana/7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr.png",
      color: "#FFB6C1",
      address: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
    },
    {
      id: "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL", // JTO address
      symbol: "JTO",
      name: "Jito",
      image: "https://dd.dexscreener.com/ds-data/tokens/solana/jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL.png",
      color: "#8B5CF6",
      address: "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",
    },
    {
      id: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", // JUP address
      symbol: "JUP",
      name: "Jupiter",
      image: "https://dd.dexscreener.com/ds-data/tokens/solana/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN.png",
      color: "#4ECDC4",
      address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    },
    {
      id: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", // RAY address
      symbol: "RAY",
      name: "Raydium",
      image: "https://dd.dexscreener.com/ds-data/tokens/solana/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R.png",
      color: "#FF6B6B",
      address: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    },
  ];
}

// Get tokens for a new round (fetches fresh from API and selects randomly)
export async function getTokensForNewRound(count: number = 6): Promise<RoundToken[]> {
  const topTokens = await fetchTopSolanaTokens();
  return selectRandomTokens(topTokens, count);
}

// Fetch current prices for tokens using DexScreener
// tokenIds can be Solana addresses or CoinGecko IDs (for fallback tokens)
export async function fetchTokenPricesByIds(
  tokenIds: string[]
): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};

  // Check if these are Solana addresses (44 chars) or CoinGecko IDs
  const solanaAddresses = tokenIds.filter((id) => id.length >= 32 && id.length <= 44);
  const coingeckoIds = tokenIds.filter((id) => id.length < 32 || id.length > 44);

  // Fetch prices from DexScreener for Solana addresses
  if (solanaAddresses.length > 0) {
    try {
      // DexScreener allows batch requests with comma-separated addresses
      const addresses = solanaAddresses.join(",");
      const response = await fetch(
        `${DEXSCREENER_API}/latest/dex/tokens/${addresses}`,
        {
          headers: { accept: "application/json" },
          next: { revalidate: 30 },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const pairs: DexScreenerPair[] = data.pairs || [];

        // Get the best price for each token (highest liquidity pair)
        for (const address of solanaAddresses) {
          const tokenPairs = pairs.filter(
            (p) => p.baseToken.address === address && p.chainId === "solana"
          );

          if (tokenPairs.length > 0) {
            // Use the pair with highest liquidity
            const bestPair = tokenPairs.sort(
              (a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
            )[0];
            prices[address] = parseFloat(bestPair.priceUsd) || 0;
          }
        }
        console.log(`DexScreener: Fetched prices for ${Object.keys(prices).length}/${solanaAddresses.length} tokens`);
      }
    } catch (error) {
      console.error("Error fetching prices from DexScreener:", error);
    }
  }

  // Fetch prices from CoinGecko for fallback tokens
  if (coingeckoIds.length > 0) {
    try {
      const ids = coingeckoIds.join(",");
      const response = await fetch(
        `${COINGECKO_API}/simple/price?ids=${ids}&vs_currency=usd`,
        {
          headers: { accept: "application/json" },
          next: { revalidate: 30 },
        }
      );

      if (response.ok) {
        const data: Record<string, { usd: number }> = await response.json();
        for (const [id, priceData] of Object.entries(data)) {
          prices[id] = priceData.usd;
        }
        console.log(`CoinGecko: Fetched prices for ${Object.keys(data).length}/${coingeckoIds.length} tokens`);
      }
    } catch (error) {
      console.error("Error fetching prices from CoinGecko:", error);
    }
  }

  return prices;
}

// Fetch detailed price data for round tokens (for UI display)
export async function fetchRoundTokenPrices(
  tokens: RoundToken[]
): Promise<{ symbol: string; price: number; change24h: number }[]> {
  // Separate tokens by type
  const solanaTokens = tokens.filter((t) => t.address || (t.id.length >= 32 && t.id.length <= 44));
  const coingeckoTokens = tokens.filter((t) => !t.address && t.id.length < 32);

  const results: { symbol: string; price: number; change24h: number }[] = [];

  // Fetch from DexScreener for Solana tokens
  if (solanaTokens.length > 0) {
    try {
      const addresses = solanaTokens.map((t) => t.address || t.id).join(",");
      const response = await fetch(
        `${DEXSCREENER_API}/latest/dex/tokens/${addresses}`,
        {
          headers: { accept: "application/json" },
          next: { revalidate: 30 },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const pairs: DexScreenerPair[] = data.pairs || [];

        for (const token of solanaTokens) {
          const address = token.address || token.id;
          const tokenPairs = pairs.filter(
            (p) => p.baseToken.address === address && p.chainId === "solana"
          );

          if (tokenPairs.length > 0) {
            const bestPair = tokenPairs.sort(
              (a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
            )[0];
            results.push({
              symbol: token.symbol,
              price: parseFloat(bestPair.priceUsd) || 0,
              change24h: bestPair.priceChange?.h24 || 0,
            });
          } else {
            results.push({ symbol: token.symbol, price: 0, change24h: 0 });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching from DexScreener:", error);
      // Add empty results for failed tokens
      for (const token of solanaTokens) {
        results.push({ symbol: token.symbol, price: 0, change24h: 0 });
      }
    }
  }

  // Fetch from CoinGecko for fallback tokens
  if (coingeckoTokens.length > 0) {
    try {
      const ids = coingeckoTokens.map((t) => t.id).join(",");
      const response = await fetch(
        `${COINGECKO_API}/coins/markets?vs_currency=usd&ids=${ids}&sparkline=false`,
        {
          headers: { accept: "application/json" },
          next: { revalidate: 30 },
        }
      );

      if (response.ok) {
        const data: SolanaToken[] = await response.json();
        for (const token of coingeckoTokens) {
          const priceData = data.find((d) => d.id === token.id);
          results.push({
            symbol: token.symbol,
            price: priceData?.current_price || 0,
            change24h: priceData?.price_change_percentage_24h || 0,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching from CoinGecko:", error);
      for (const token of coingeckoTokens) {
        results.push({ symbol: token.symbol, price: 0, change24h: 0 });
      }
    }
  }

  return results;
}
