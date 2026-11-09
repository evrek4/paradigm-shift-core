import { fontFamily } from "../font";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

// Hook title for the first seconds. Default: quiet and letter-spaced.
// Bold: big, on screen from the very first frame, so a scrolling viewer sees the promise at once.
export const Hook: React.FC<{ text: string; accentColor: string; bold?: boolean }> = ({ text, accentColor, bold }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  if (bold) {
    const opacity = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    // Words in *stars* get the accent color
    const parts = text.split(/(\*[^*]+\*)/).filter(Boolean);
    return (
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 250, opacity }}>
        <div
          style={{
            maxWidth: 960,
            textAlign: "center",
            color: "white",
            fontFamily,
            fontWeight: 900,
            fontSize: 96,
            lineHeight: 1.05,
            letterSpacing: "0.01em",
            textTransform: "uppercase",
            WebkitTextStroke: "8px rgba(0,0,0,0.9)",
            paintOrder: "stroke fill",
            textShadow: "0 8px 30px rgba(0,0,0,0.85)",
          }}
        >
          {parts.map((p, i) =>
            p.startsWith("*") ? (
              <span key={i} style={{ color: accentColor }}>
                {p.slice(1, -1)}
              </span>
            ) : (
              <span key={i}>{p}</span>
            ),
          )}
        </div>
      </AbsoluteFill>
    );
  }
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
