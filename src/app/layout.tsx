import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { WalletProvider } from "@/components/WalletProvider";
import { ParticleBackground } from "@/components/ParticleBackground";

export const metadata: Metadata = {
  title: "StakePool | Solana Token Predictions",
  description: "Predict which token performs best. Stake your position. Winners share the pool.",
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
          {/* Grid Pattern Overlay */}
          <div className="grid-overlay" />

          {/* Particle Background */}
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
