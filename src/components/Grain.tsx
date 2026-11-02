import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";

// Subtle animated film grain + letterbox-style darkening for a cinematic look
export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2);
  const x = Math.round(random(`gx${seed}`) * 200);
  const y = Math.round(random(`gy${seed}`) * 200);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width="100%" height="100%" style={{ opacity: 0.09, mixBlendMode: "overlay" }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed % 50} />
        </filter>
        <rect x={-x} y={-y} width="120%" height="120%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};
