import { CalculateMetadataFunction, Composition } from "remotion";
import { Short } from "./Short";
import { shortSchema, ShortProps } from "./schema";
import { CTA_SECONDS, FPS } from "./constants";
import example from "../videos/example.json";

const calculateMetadata: CalculateMetadataFunction<ShortProps> = ({ props }) => {
  const seconds = props.scenes.reduce((sum, s) => sum + s.seconds, 0) + CTA_SECONDS;
  return { durationInFrames: Math.round(seconds * FPS) };
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Short"
      component={Short}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={FPS * 10}
      schema={shortSchema}
      defaultProps={example as ShortProps}
      calculateMetadata={calculateMetadata}
    />
  );
};
