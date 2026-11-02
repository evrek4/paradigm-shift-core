import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export const sceneSchema = z.object({
  // Path inside /public, e.g. "videos/example/1.jpg"
  image: z.string(),
  // Voiceover/caption line shown word by word
  text: z.string(),
  // Scene length in seconds
  seconds: z.number().min(0.5).max(30),
  // Optional big word to punch in (e.g. "$4.2B")
  highlight: z.string().optional(),
});

export const shortSchema = z.object({
  // Hook shown on top in the first seconds: the most important line
  hook: z.string(),
  scenes: z.array(sceneSchema).min(1),
  // Optional mp3 in /public (voiceover or music)
  audio: z.string().optional(),
  audioVolume: z.number().min(0).max(1).default(1),
  accentColor: zColor().default("#FFD400"),
  // Closing call to action
  cta: z.string().default("Follow for more"),
});

export type ShortProps = z.infer<typeof shortSchema>;
export type Scene = z.infer<typeof sceneSchema>;
