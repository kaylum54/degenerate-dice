"use client";

import { useMemo, ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";

// Import wallet adapter styles
import "@solana/wallet-adapter-react-ui/styles.css";

interface Props {
  children: ReactNode;
}

export function WalletProvider({ children }: Props) {
  // Use custom RPC endpoint from env, or fallback to public endpoints
  // Public mainnet-beta is heavily rate-limited, so use a reliable RPC
  const endpoint = useMemo(() => {
    // Check for custom RPC URL first
    if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL) {
      return process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    }

    // Fallback to devnet for testing (mainnet-beta public RPC is rate-limited)
    // For production, set NEXT_PUBLIC_SOLANA_RPC_URL to a reliable RPC like:
    // - Helius: https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
    // - QuickNode: https://your-endpoint.solana-mainnet.quiknode.pro/YOUR_KEY/
    // - Alchemy: https://solana-mainnet.g.alchemy.com/v2/YOUR_KEY
    return "https://api.devnet.solana.com";
  }, []);

  // Initialize Phantom wallet adapter
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
