import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { measureText } from "@remotion/layout-utils";
import { fontFamily } from "../font";
import { Chunk } from "../timing";

const BOX_W = 900; // 90px safe margin on each side
const BASE_SIZE = 84;

// Largest font size (<= BASE_SIZE) at which every word fits the caption box
const fitSize = (words: { text: string }[]) => {
  let size = BASE_SIZE;
  for (const w of words) {
    const { width } = measureText({ text: w.text.toUpperCase(), fontFamily, fontSize: BASE_SIZE, fontWeight: "900" });
    const needed = width + 24;
    if (needed > BOX_W) size = Math.min(size, Math.floor((BASE_SIZE * BOX_W) / needed));
  }
  return size;
};

// Shorts-style captions: a few words at a time, the spoken word in accent color
export const Captions: React.FC<{ chunks: Chunk[]; accentColor: string }> = ({ chunks, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const chunk = chunks.find((c) => ms >= c.startMs && ms < c.endMs);
  if (!chunk) return null;

  const enter = spring({ frame: frame - (chunk.startMs / 1000) * fps, fps, config: { damping: 14, stiffness: 180 } });
  const size = fitSize(chunk.words);

  return (
    <div
      style={{
        position: "absolute",
        left: (1080 - BOX_W) / 2,
        width: BOX_W,
        bottom: 420, // above the Shorts UI (title, buttons)
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        columnGap: size * 0.45,
        fontFamily,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.1,
        textTransform: "uppercase",
        scale: String(interpolate(enter, [0, 1], [0.7, 1])),
        translate: `0px ${interpolate(enter, [0, 1], [40, 0])}px`,
        opacity: interpolate(enter, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      {chunk.words.map((w, i) => {
        const next = chunk.words[i + 1];
        const active = ms >= w.startMs && (!next || ms < next.startMs);
        return (
          <span
            key={i}
            style={{
              color: active ? accentColor : "white",
              WebkitTextStroke: "6px rgba(0,0,0,0.85)",
              paintOrder: "stroke fill",
              textShadow: active ? `0 0 28px ${accentColor}AA, 0 6px 18px rgba(0,0,0,0.7)` : "0 6px 18px rgba(0,0,0,0.7)",
              display: "inline-block",
              scale: active ? "1.08" : "1",
              transition: "none",
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
