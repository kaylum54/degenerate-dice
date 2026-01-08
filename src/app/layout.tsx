import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { WalletProvider } from "@/components/WalletProvider";
import { ParticleBackground } from "@/components/ParticleBackground";

export const metadata: Metadata = {
  title: "Degenerate Dice | Solana Memecoin Predictions",
  description: "Bet on which memecoin pumps hardest. Winner takes all.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-mono antialiased">
        <WalletProvider>
          {/* Scanline Overlay */}
          <div className="scanlines" />

          {/* Grid Pattern Overlay */}
          <div className="grid-overlay" />

          {/* Particle Background - Client component to avoid hydration mismatch */}
          <ParticleBackground />

          {/* Main Content */}
          <div className="relative z-10">
            {children}
          </div>
        </WalletProvider>
        <Analytics />
      </body>
    </html>
  );
}
