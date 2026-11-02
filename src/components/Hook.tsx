import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// The first 2.5 seconds decide retention: big hook text on top
export const Hook: React.FC<{ text: string; accentColor: string }> = ({ text, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14 } });
  const exit = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 220, opacity: exit }}>
      <div
        style={{
          transform: `translateY(${(1 - enter) * -80}px)`,
          maxWidth: 960,
          textAlign: "center",
          backgroundColor: "white",
          color: "black",
          fontFamily: "Impact, 'Arial Black', sans-serif",
          fontSize: 82,
          lineHeight: 1.1,
          padding: "24px 36px",
          borderRadius: 24,
          borderBottom: `14px solid ${accentColor}`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
