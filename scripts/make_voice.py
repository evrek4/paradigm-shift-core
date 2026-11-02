"""Generate an expressive voiceover with Microsoft Edge TTS and write word timings into the video config.

Usage:  pip install edge-tts
        python scripts/make_voice.py <video-name> [--voice en-US-AndrewMultilingualNeural]

Edge TTS does not accept custom SSML, so emotion comes from:
  * each scene's `delivery` (rate / pitch / volume), e.g. slow and low for the hook, faster for the science
  * speaking sentence by sentence, with extra slowdown on short punchy lines
  * real pauses between sentences, longer after "..." for suspense

Writes public/videos/<name>/v<scene>-<sentence>.mp3 and updates videos/<name>.json:
  scenes[i].clips   -> [{src, atMs}] audio clips placed inside the scene
  scenes[i].seconds -> length of the scene's speech (no pause after the last scene, so the loop is seamless)
  words             -> every spoken word with its start time, for word-by-word captions
"""
import argparse
import asyncio
import json
import os
import re
from pathlib import Path

import edge_tts

MP3_BITRATE = 48_000  # Edge TTS returns 24 kHz / 48 kbit/s mono mp3
PAUSE_SENTENCE = 0.28  # seconds after a normal sentence
PAUSE_ELLIPSIS = 0.65  # after "..." (suspense)
PAUSE_SCENE = 0.45  # between scenes


def pct(v: int) -> str:
    return f"{v:+d}%"


def hz(v: int) -> str:
    return f"{v:+d}Hz"


def split_sentences(text: str):
    # Split after . ! ? and after "..." so each beat gets its own delivery and pause
    parts = re.split(r"(?<=\.\.\.)\s+|(?<=[.!?])\s+", text.strip())
    return [p for p in parts if p]


async def speak(text, voice, rate, pitch, volume, out_path):
    comm = edge_tts.Communicate(
        text, voice, rate=pct(rate), pitch=hz(pitch), volume=pct(volume), boundary="WordBoundary"
    )
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
    args = ap.parse_args()

    root = Path(__file__).resolve().parent.parent
    cfg_path = root / "videos" / f"{args.name}.json"
    cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
    voice = cfg.get("ttsVoice", args.voice)
    out_dir = root / "public" / "videos" / args.name
    out_dir.mkdir(parents=True, exist_ok=True)
    for old in out_dir.glob("v*-*.mp3"):
        old.unlink()

    all_words = []
    scene_start_ms = 0
    scenes = cfg["scenes"]
    for i, scene in enumerate(scenes):
        d = scene.get("delivery", {})
        base_rate, base_pitch, volume = d.get("rate", 0), d.get("pitch", 0), d.get("volume", 0)
        clips = []
        t = 0.0  # seconds inside the scene
        sentences = split_sentences(scene["text"])
        for k, sentence in enumerate(sentences):
            n_words = len(sentence.split())
            # Short punchy lines land harder when slower and a touch lower
            rate = base_rate - (8 if n_words <= 4 else 0)
            pitch = base_pitch - (2 if n_words <= 4 else 0)
            # Questions lift at the end naturally; give them a slight pitch rise
            if sentence.endswith("?"):
                pitch += 3
            file = out_dir / f"v{i + 1}-{k + 1}.mp3"
            words, seconds = await speak(sentence, voice, rate, pitch, volume, file)
            clips.append({"src": f"videos/{args.name}/{file.name}", "atMs": round(t * 1000)})
            all_words += [
                {"text": w["text"], "startMs": scene_start_ms + round(t * 1000) + w["startMs"]} for w in words
            ]
            t += seconds
            if k < len(sentences) - 1:
                t += PAUSE_ELLIPSIS if sentence.endswith("...") else PAUSE_SENTENCE
        last = i == len(scenes) - 1
        scene["seconds"] = round(t + (0 if last else PAUSE_SCENE), 2)
        scene["clips"] = clips
        scene.pop("voice", None)
        scene_start_ms += round(scene["seconds"] * 1000)
        print(f"scene {i + 1}: {scene['seconds']:.2f}s, {len(sentences)} sentences, rate {base_rate:+d}%, pitch {base_pitch:+d}Hz")

    cfg["words"] = all_words
    cfg.pop("voice", None)
    cfg_path.write_text(json.dumps(cfg, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"total: {scene_start_ms / 1000:.1f}s -> {cfg_path}")


if __name__ == "__main__":
    asyncio.run(main())
