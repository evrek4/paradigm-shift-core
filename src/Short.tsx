import React from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { ShortProps } from "./schema";
import { SceneView } from "./components/SceneView";
import { Captions } from "./components/Captions";
import { Hook } from "./components/Hook";
import { ProgressBar } from "./components/ProgressBar";
import { Cta } from "./components/Cta";
import { Grain } from "./components/Grain";
import { CTA_SECONDS } from "./constants";
import { captionWords, chunkWords } from "./timing";

// Crossfade length between scenes, in frames
const T = 12;

export const Short: React.FC<ShortProps> = ({
  hook,
  scenes,
  voice,
  words,
  music,
  musicVolume,
  accentColor,
  cta,
  progressBar,
}) => {
  const { fps } = useVideoConfig();
  const sceneFrames = scenes.map((s) => Math.round(s.seconds * fps));
  const scenesEnd = sceneFrames.reduce((a, b) => a + b, 0);
  const chunks = chunkWords(captionWords(scenes, words), (scenesEnd / fps) * 1000);

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <TransitionSeries>
        {scenes.map((scene, i) => (
          <React.Fragment key={i}>
            {i > 0 ? (
              <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
            ) : null}
            {/* Each scene runs T frames longer so scene i still starts at its own time after the overlap */}
            <TransitionSeries.Sequence
              name={`Scene ${i + 1}`}
              durationInFrames={sceneFrames[i] + (i < scenes.length - 1 ? T : 0)}
            >
              <SceneView scene={scene} index={i} accentColor={accentColor} />
            </TransitionSeries.Sequence>
          </React.Fragment>
        ))}
      </TransitionSeries>
      <Sequence name="Captions" durationInFrames={scenesEnd}>
        <Captions chunks={chunks} accentColor={accentColor} />
      </Sequence>
      {cta ? (
        <Sequence name="CTA" from={scenesEnd} durationInFrames={Math.round(CTA_SECONDS * fps)}>
          <Cta text={cta} accentColor={accentColor} />
        </Sequence>
      ) : null}
      {hook ? (
        <Sequence name="Hook" durationInFrames={Math.min(Math.round(3 * fps), scenesEnd)}>
          <Hook text={hook} accentColor={accentColor} />
        </Sequence>
      ) : null}
      <Grain />
      {progressBar ? <ProgressBar accentColor={accentColor} /> : null}
      {voice ? <Audio name="Voiceover" src={staticFile(voice)} /> : null}
      {scenes.map((scene, i) =>
        scene.voice ? (
          <Sequence key={i} name={`Voice ${i + 1}`} from={sceneFrames.slice(0, i).reduce((a, b) => a + b, 0)} durationInFrames={sceneFrames[i]}>
            <Audio src={staticFile(scene.voice)} />
          </Sequence>
        ) : null,
      )}
      {music ? (
        <Audio name="Music" src={staticFile(music)} volume={musicVolume} loop />
      ) : null}
    </AbsoluteFill>
  );
};
