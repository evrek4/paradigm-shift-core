"""Generate the voiceover with Microsoft Edge TTS and write word timings into the video config.

Usage:  pip install edge-tts
        python scripts/make_voice.py <video-name> [--voice en-US-AndrewMultilingualNeural] [--rate +0%]

Reads videos/<name>.json, speaks each scene's `text` into
public/videos/<name>/voice-<n>.mp3, then updates the JSON:
  scenes[i].voice   -> that scene's audio file
  scenes[i].seconds -> audio length + a short pause (no pause after the last scene, so the loop is seamless)
  words             -> every spoken word with its start time, for word-by-word captions
"""
import argparse
import asyncio
import json
import os
from pathlib import Path

import edge_tts

PAUSE_S = 0.35  # silence between scenes
MP3_BITRATE = 48_000  # Edge TTS returns 24 kHz / 48 kbit/s mono mp3


async def speak(text, voice, rate, out_path):
    comm = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    words = []
    with open(out_path, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                # offsets are in 100-nanosecond units
                words.append({"text": chunk["text"], "startMs": round(chunk["offset"] / 10_000)})
    seconds = os.path.getsize(out_path) * 8 / MP3_BITRATE
    return words, seconds


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("name")
    ap.add_argument("--voice", default="en-US-AndrewMultilingualNeural")
    ap.add_argument("--rate", default="+0%")
    args = ap.parse_args()

    root = Path(__file__).resolve().parent.parent
    cfg_path = root / "videos" / f"{args.name}.json"
    cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
    out_dir = root / "public" / "videos" / args.name
    out_dir.mkdir(parents=True, exist_ok=True)

    all_words = []
    t_ms = 0
    scenes = cfg["scenes"]
    for i, scene in enumerate(scenes):
        file = out_dir / f"voice-{i + 1}.mp3"
        words, seconds = await speak(scene["text"], args.voice, args.rate, file)
        last = i == len(scenes) - 1
        scene_s = round(seconds + (0 if last else PAUSE_S), 2)
        scene["voice"] = f"videos/{args.name}/{file.name}"
        scene["seconds"] = scene_s
        all_words += [{"text": w["text"], "startMs": t_ms + w["startMs"]} for w in words]
        t_ms += round(scene_s * 1000)
        print(f"scene {i + 1}: {scene_s:.2f}s, {len(words)} words")

    cfg["words"] = all_words
    cfg.pop("voice", None)
    cfg_path.write_text(json.dumps(cfg, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"total: {t_ms / 1000:.1f}s -> {cfg_path}")


if __name__ == "__main__":
    asyncio.run(main())
