import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";

const WORDS_PER_PAGE = 3;

// TikTok/Shorts style captions: 3 words at a time, active word in accent color
export const Captions: React.FC<{ text: string; accentColor: string }> = ({ text, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  const framesPerWord = durationInFrames / words.length;
  const active = Math.min(words.length - 1, Math.floor(frame / framesPerWord));
  const pageStart = Math.floor(active / WORDS_PER_PAGE) * WORDS_PER_PAGE;
  const page = words.slice(pageStart, pageStart + WORDS_PER_PAGE);
  const pageFrame = frame - pageStart * framesPerWord;
  const pop = spring({ frame: pageFrame, fps, config: { damping: 12, stiffness: 200 }, durationInFrames: 10 });

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 520 }}>
      <div
        style={{
          transform: `scale(${0.85 + 0.15 * pop})`,
          textAlign: "center",
          padding: "0 60px",
          fontFamily: "Impact, 'Arial Black', sans-serif",
          fontSize: 110,
          lineHeight: 1.1,
          textTransform: "uppercase",
          color: "white",
          WebkitTextStroke: "6px black",
          paintOrder: "stroke",
          textShadow: "0 8px 30px rgba(0,0,0,0.8)",
        }}
      >
        {page.map((w, i) => (
          <span key={i} style={{ color: pageStart + i === active ? accentColor : "white" }}>
            {w}{" "}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
