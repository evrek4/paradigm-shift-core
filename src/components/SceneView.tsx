import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Scene } from "../schema";
import { fontFamily } from "../font";

// Slow camera move over one image; any aspect ratio works thanks to a blurred fill
export const SceneView: React.FC<{ scene: Scene; index: number; accentColor: string }> = ({
  scene,
  index,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const ease = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const, easing: Easing.bezier(0.45, 0, 0.55, 1) };
  const zoomIn = index % 2 === 0;
  const scale = interpolate(frame, [0, durationInFrames], zoomIn ? [1.0, 1.1] : [1.1, 1.0], ease);
  const panY = interpolate(frame, [0, durationInFrames], index % 3 === 1 ? [1.5, -1.5] : [0, 0], ease);
  const src = staticFile(scene.image);

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "black" }}>
      <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(40px) brightness(0.45)", scale: "1.2" }} />
      <AbsoluteFill style={{ scale: String(scale), translate: `0% ${panY}%` }}>
        <Img src={src} style={{ width: "100%", height: "100%", objectFit: "contain", filter: "contrast(1.08) saturate(0.85) brightness(0.92)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(0,0,0,0.4) 80%, rgba(0,0,0,0.2) 100%)" }} />
      {scene.highlight ? <Highlight text={scene.highlight} accentColor={accentColor} /> : null}
    </AbsoluteFill>
  );
};

const Highlight: React.FC<{ text: string; accentColor: string }> = ({ text, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 6, fps, config: { damping: 200 }, durationInFrames: 20 });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", top: -260 }}>
      <div
        style={{
          scale: String(0.9 + 0.1 * pop),
          opacity: pop,
          color: accentColor,
          fontFamily,
          fontWeight: 900,
          fontSize: 150,
          letterSpacing: "0.02em",
          textShadow: `0 0 40px ${accentColor}88, 0 10px 40px rgba(0,0,0,0.8)`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
