import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ShortProps } from "./schema";
import { SceneView } from "./components/SceneView";
import { Hook } from "./components/Hook";
import { ProgressBar } from "./components/ProgressBar";
import { Cta } from "./components/Cta";
import { CTA_SECONDS } from "./constants";

export const Short: React.FC<ShortProps> = ({
  hook,
  scenes,
  audio,
  audioVolume,
  accentColor,
  cta,
}) => {
  const { fps } = useVideoConfig();
  let start = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {scenes.map((scene, i) => {
        const from = start;
        const duration = Math.round(scene.seconds * fps);
        start += duration;
        return (
          <Sequence key={i} from={from} durationInFrames={duration}>
            <SceneView scene={scene} index={i} accentColor={accentColor} />
          </Sequence>
        );
      })}
      <Sequence from={start} durationInFrames={Math.round(CTA_SECONDS * fps)}>
        <Cta text={cta} accentColor={accentColor} />
      </Sequence>
      <Sequence durationInFrames={Math.round(2.5 * fps)}>
        <Hook text={hook} accentColor={accentColor} />
      </Sequence>
      <ProgressBar accentColor={accentColor} />
      {audio ? <Audio src={staticFile(audio)} volume={audioVolume} /> : null}
    </AbsoluteFill>
  );
};
