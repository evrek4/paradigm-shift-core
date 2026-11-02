import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

export const ProgressBar: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: 12,
          width: `${(frame / durationInFrames) * 100}%`,
          backgroundColor: accentColor,
        }}
      />
    </AbsoluteFill>
  );
};
