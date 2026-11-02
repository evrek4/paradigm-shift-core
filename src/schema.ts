import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export const sceneSchema = z.object({
  // Path inside /public, e.g. "videos/example/1.jpg"
  image: z.string(),
  // Scene length in seconds
  seconds: z.number().min(0.5).max(60),
  // Caption text for this scene. Ignored when the video has timed `words`.
  text: z.string().default(""),
  // Optional voiceover for this scene only (in /public), played from the scene's start
  voice: z.string().optional(),
  // Optional big punch-in label, e.g. "$4.2B"
  highlight: z.string().optional(),
});

export const wordSchema = z.object({
  text: z.string(),
  // Time the word is spoken, from the start of the video
  startMs: z.number(),
});

export const shortSchema = z.object({
  // Optional on-screen title for the first 3 s (the voiceover hook is captioned anyway)
  hook: z.string().optional(),
  scenes: z.array(sceneSchema).min(1),
  // Voiceover (wav/mp3 in /public) and word timestamps from it (e.g. Whisper)
  voice: z.string().optional(),
  words: z.array(wordSchema).optional(),
  // Background music / SFX bed in /public
  music: z.string().optional(),
  musicVolume: z.number().min(0).max(1).default(0.25),
  accentColor: zColor().default("#7FDBFF"),
  // Optional end card. Leave empty for a seamless loop (channel default).
  cta: z.string().optional(),
  // A progress bar shows viewers the end is coming, which hurts loops: off by default
  progressBar: z.boolean().default(false),
});

export type ShortProps = z.infer<typeof shortSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type Word = z.infer<typeof wordSchema>;
