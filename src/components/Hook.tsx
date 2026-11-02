import { fontFamily } from "../font";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

// Quiet cinematic title for the first seconds: letter-spaced, fades in and out
export const Hook: React.FC<{ text: string; accentColor: string }> = ({ text, accentColor }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(frame, [0, 8, durationInFrames - 10, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const spacing = interpolate(frame, [0, durationInFrames], [0.18, 0.24]);
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 260, opacity }}>
      <div style={{ width: 120, height: 3, backgroundColor: accentColor, marginBottom: 28 }} />
      <div
        style={{
          maxWidth: 900,
          textAlign: "center",
          color: "white",
          fontFamily,
          fontWeight: 800,
          fontSize: 54,
          lineHeight: 1.25,
          letterSpacing: `${spacing}em`,
          textTransform: "uppercase",
          textShadow: "0 4px 24px rgba(0,0,0,0.8)",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
