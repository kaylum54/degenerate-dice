"use client";

import { useState, useEffect } from "react";

interface Particle {
  left: string;
  top: string;
  animationDelay: string;
  animationDuration: string;
}

export function ParticleBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Generate random positions only on the client to avoid hydration mismatch
    const generated = [...Array(20)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 10}s`,
      animationDuration: `${10 + Math.random() * 20}s`,
    }));
    setParticles(generated);
    setMounted(true);
  }, []);

  // Don't render anything on server to prevent hydration mismatch
  if (!mounted) {
    return <div className="particles" />;
  }

  return (
    <div className="particles">
      {particles.map((particle, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: particle.left,
            top: particle.top,
            animationDelay: particle.animationDelay,
            animationDuration: particle.animationDuration,
          }}
        />
      ))}
    </div>
  );
}
