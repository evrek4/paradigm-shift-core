import { fontFamily } from "../font";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const Cta: React.FC<{ text: string; accentColor: string }> = ({ text, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 10 } });
  return (
    <AbsoluteFill style={{ backgroundColor: "black", justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          transform: `scale(${pop})`,
          color: accentColor,
          fontFamily, fontWeight: 900,
          fontSize: 120,
          textAlign: "center",
          padding: "0 60px",
          textTransform: "uppercase",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
