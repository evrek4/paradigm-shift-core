import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Scene } from "../schema";
import { Captions } from "./Captions";

export const SceneView: React.FC<{
  scene: Scene;
  index: number;
  accentColor: string;
}> = ({ scene, index, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Ken Burns: alternate zoom in / zoom out and pan direction per scene
  const zoomIn = index % 2 === 0;
  const progress = frame / durationInFrames;
  const scale = zoomIn ? 1.05 + progress * 0.15 : 1.2 - progress * 0.15;
  const panX = (index % 3 === 0 ? -1 : 1) * progress * 30;

  // Quick punch-in at scene start (keeps retention high)
  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 8 });
  const flash = interpolate(frame, [0, 4], [0.6, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${scale * (0.92 + 0.08 * enter)}) translateX(${panX}px)` }}>
        {/* Blurred fill so any image ratio works in 9:16 */}
        <Img
          src={staticFile(scene.image)}
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(40px) brightness(0.5)" }}
        />
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <Img src={staticFile(scene.image)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </AbsoluteFill>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 100%)" }} />
      <AbsoluteFill style={{ backgroundColor: "white", opacity: flash }} />
      {scene.highlight ? <Highlight text={scene.highlight} accentColor={accentColor} /> : null}
      <Captions text={scene.text} accentColor={accentColor} />
    </AbsoluteFill>
  );
};

const Highlight: React.FC<{ text: string; accentColor: string }> = ({ text, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 6, fps, config: { damping: 10, stiffness: 160 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", top: -250 }}>
      <div
        style={{
          transform: `scale(${pop}) rotate(-3deg)`,
          backgroundColor: accentColor,
          color: "black",
          fontFamily: "Impact, 'Arial Black', sans-serif",
          fontSize: 130,
          padding: "10px 40px",
          borderRadius: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
