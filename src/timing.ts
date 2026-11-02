import { Scene, Word } from "./schema";

export const sceneStartsMs = (scenes: Scene[]) => {
  let t = 0;
  return scenes.map((s) => {
    const start = t;
    t += s.seconds * 1000;
    return start;
  });
};

// Timed words from the voiceover if given, otherwise each scene's text spread evenly over the scene
export const captionWords = (scenes: Scene[], words?: Word[]): Word[] => {
  if (words && words.length > 0) return words;
  const starts = sceneStartsMs(scenes);
  return scenes.flatMap((s, i) => {
    const list = s.text.split(/\s+/).filter(Boolean);
    const step = (s.seconds * 1000) / Math.max(1, list.length);
    return list.map((text, k) => ({ text, startMs: starts[i] + k * step }));
  });
};

export type Chunk = { startMs: number; endMs: number; words: Word[] };

// Groups of up to 3 words; a new group also starts after a sentence end or a pause
export const chunkWords = (words: Word[], endMs: number): Chunk[] => {
  const chunks: Chunk[] = [];
  let cur: Word[] = [];
  const flush = (end: number) => {
    if (cur.length) chunks.push({ startMs: cur[0].startMs, endMs: end, words: cur });
    cur = [];
  };
  words.forEach((w, i) => {
    const prev = words[i - 1];
    const breakBefore =
      cur.length >= 3 || (prev && (/[.!?]$/.test(prev.text) || w.startMs - prev.startMs > 700));
    if (breakBefore) flush(w.startMs);
    cur.push(w);
  });
  const last = words[words.length - 1];
  flush(last ? Math.min(endMs, last.startMs + 1200) : endMs);
  return chunks;
};

// Cut points inside a scene (frames from the scene start). Cuts land on sentence starts
// when the scene has voice clips, so every new thought gets a new shot; long stretches
// are split so a shot never runs longer than MAX_SHOT seconds.
const MIN_SHOT = 2.2;
const MAX_SHOT = 4.5;
export const shotStarts = (clipStartsMs: number[], sceneSeconds: number, fps: number): number[] => {
  const raw = clipStartsMs.map((ms) => ms / 1000).filter((s) => s > 0);
  const cuts: number[] = [0];
  for (const s of [...raw, sceneSeconds]) {
    const last = cuts[cuts.length - 1];
    const gap = s - last;
    if (gap > MAX_SHOT) {
      const n = Math.ceil(gap / MAX_SHOT);
      for (let k = 1; k < n; k++) cuts.push(last + (gap * k) / n);
    }
    if (s < sceneSeconds && s - cuts[cuts.length - 1] >= MIN_SHOT && sceneSeconds - s >= MIN_SHOT) cuts.push(s);
  }
  return cuts.map((s) => Math.round(s * fps));
};
