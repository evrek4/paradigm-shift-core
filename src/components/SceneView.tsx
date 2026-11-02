import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Scene } from "../schema";
import { fontFamily } from "../font";

// Camera presets: each shot frames the image differently so cuts feel like a new camera angle
type Shot = { x: [number, number]; y: [number, number]; z: [number, number] };
const SHOTS: Shot[] = [
  { x: [50, 50], y: [50, 50], z: [1.02, 1.12] }, // wide, slow push in
  { x: [50, 50], y: [28, 24], z: [1.65, 1.72] }, // close on top of frame
  { x: [62, 40], y: [50, 50], z: [1.35, 1.38] }, // medium, lateral drift
  { x: [50, 50], y: [72, 76], z: [1.6, 1.5] }, // close on bottom of frame, slight pull out
  { x: [36, 60], y: [42, 54], z: [1.3, 1.45] }, // diagonal drift + push
  { x: [50, 50], y: [50, 50], z: [1.5, 1.08] }, // fast pull back reveal
]

const ShotView: React.FC<{ src: string; shot: Shot; isCut: boolean }> = ({ src, shot, isCut }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const ease = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const, easing: Easing.bezier(0.33, 0, 0.67, 1) };
  const t = (r: [number, number]) => interpolate(frame, [0, durationInFrames], r, ease);
  // Punch-in on the cut: starts slightly over-zoomed and blurred, settles in ~6 frames
  const punch = isCut ? interpolate(frame, [0, 6], [0.1, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }) : 0;
  const blur = isCut ? interpolate(frame, [0, 5], [8, 0], { extrapolateRight: "clamp" }) : 0;
  const flash = isCut ? interpolate(frame, [0, 4], [0.22, 0], { extrapolateRight: "clamp" }) : 0;
  const img = staticFile(src);
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "black" }}>
      <Img src={img} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(40px) brightness(0.45)", scale: "1.2" }} />
      <AbsoluteFill
        style={{
          transformOrigin: `${t(shot.x)}% ${t(shot.y)}%`,
          scale: String(t(shot.z) + punch),
          filter: blur ? `blur(${blur}px)` : undefined,
        }}
      >
        <Img src={img} style={{ width: "100%", height: "100%", objectFit: "contain", filter: "contrast(1.08) saturate(0.88) brightness(0.92)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: "white", opacity: flash }} />
    </AbsoluteFill>
  );
};

// One scene = several shots of its image(s), cut on sentence beats
export const SceneView: React.FC<{
  scene: Scene;
  index: number;
  accentColor: string;
  highlightAt: number;
  cuts: number[];
}> = ({ scene, index, accentColor, highlightAt, cuts }) => {
  const { durationInFrames, fps } = useVideoConfig();
  const sources = [scene.image, ...(scene.images ?? [])];

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "black" }}>
      {cuts.map((from, k) => {
        const to = k < cuts.length - 1 ? cuts[k + 1] : durationInFrames;
        return (
          <Sequence key={k} from={from} durationInFrames={Math.max(1, to - from)} layout="none">
            <ShotView src={sources[k % sources.length]} shot={SHOTS[(index * 2 + k) % SHOTS.length]} isCut={k > 0} />
          </Sequence>
        );
      })}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(0,0,0,0.4) 80%, rgba(0,0,0,0.2) 100%)" }} />
      {scene.highlight ? (
        <Sequence from={highlightAt} durationInFrames={Math.round(3 * fps)} layout="none">
          <Highlight text={scene.highlight} accentColor={accentColor} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

const Highlight: React.FC<{ text: string; accentColor: string }> = ({ text, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const pop =
    spring({ frame, fps, config: { damping: 200 }, durationInFrames: 12 }) *
    interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
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
