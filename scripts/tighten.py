"""Tighten voiceover timing after make_voice.py: trim the silence Edge TTS leaves around every clip,
shorten pauses, and speed speech up (pitch preserved) just enough to hit the target length.

Usage:  python scripts/tighten.py <video-name> [--target 49] [--max-speed 1.2]
Needs ffmpeg. Rewrites the clip mp3s in place and updates videos/<name>.json.
Run it once per fresh make_voice.py output (it trims what is already trimmed only a little).
"""
import argparse
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAUSE_SENTENCE = 0.22
PAUSE_ELLIPSIS = 0.5
PAUSE_SCENE = 0.3
PAUSE_SCALE = 0.75  # applied to hand-tuned `lines[].pause`
HEAD, TAIL = 0.03, 0.08  # keep a little air around speech


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True, check=True).stdout
    return float(out.strip())


def speech_bounds(path):
    """Start and end of speech, from ffmpeg silencedetect."""
    total = duration(path)
    log = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "silencedetect=n=-45dB:d=0.12", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
    start = ends[0] if starts and starts[0] < 0.01 and ends else 0.0
    end = starts[-1] if starts and (len(ends) < len(starts) or ends[-1] >= total - 0.02) and starts[-1] > start else total
    return start, end, total


def sentence_pauses(scene):
    sentences = [s for s in re.split(r"(?<=\.\.\.)\s+|(?<=[.!?])\s+", scene["text"].strip()) if s]
    lines = scene.get("lines") or []
    out = []
    for k, s in enumerate(sentences):
        if k == len(sentences) - 1:
            out.append(0.0)
        elif lines:
            out.append(lines[k].get("pause", PAUSE_SENTENCE) * PAUSE_SCALE)
        else:
            out.append(PAUSE_ELLIPSIS if s.endswith("...") else PAUSE_SENTENCE)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("name")
    ap.add_argument("--target", type=float, default=49.0)
    ap.add_argument("--max-speed", type=float, default=1.2)
    args = ap.parse_args()
    cfg_path = ROOT / "videos" / f"{args.name}.json"
    cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
    words = cfg.get("words", [])

    # 1. Collect clips with their words (relative to the clip) and speech bounds
    plan = []
    scene_start = 0
    for i, scene in enumerate(cfg["scenes"]):
        clips = []
        pauses = sentence_pauses(scene)
        for k, c in enumerate(scene["clips"]):
            path = ROOT / "public" / c["src"]
            start, end, total = speech_bounds(path)
            g0 = scene_start + c["atMs"]
            ws = [{"text": w["text"], "rel": (w["startMs"] - g0) / 1000} for w in words if g0 <= w["startMs"] < g0 + total * 1000]
            clips.append({"src": c["src"], "path": path, "cut0": max(0.0, start - HEAD), "cut1": min(total, end + TAIL),
                          "words": ws, "pause": pauses[k] if k < len(pauses) else PAUSE_SENTENCE})
        plan.append(clips)
        scene_start += round(scene["seconds"] * 1000)

    # 2. Pick the speed that lands on the target length
    def length(speed):
        t = 0.0
        for i, clips in enumerate(plan):
            t += sum((c["cut1"] - c["cut0"]) / speed + c["pause"] for c in clips)
            t += PAUSE_SCENE if i < len(plan) - 1 else 0
        return t

    speed = min(args.max_speed, max(1.0, length(1.0) / args.target))
    speed = round(speed, 3)

    # 3. Rewrite audio and timings
    new_words = []
    scene_start = 0.0
    for i, (scene, clips) in enumerate(zip(cfg["scenes"], plan)):
        t = 0.0
        new_clips = []
        for c in clips:
            tmp = c["path"].with_suffix(".tmp.mp3")
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(c["path"]), "-ss", f"{c['cut0']:.3f}", "-to", f"{c['cut1']:.3f}",
                            "-af", f"atempo={speed}", "-c:a", "libmp3lame", "-b:a", "96k", str(tmp)], check=True)
            tmp.replace(c["path"])
            new_clips.append({"src": c["src"], "atMs": round(t * 1000)})
            for w in c["words"]:
                rel = max(0.0, (w["rel"] - c["cut0"]) / speed)
                new_words.append({"text": w["text"], "startMs": round((scene_start + t + rel) * 1000)})
            t += (c["cut1"] - c["cut0"]) / speed + c["pause"]
        last = i == len(plan) - 1
        scene["clips"] = new_clips
        scene["seconds"] = round(t + (0 if last else PAUSE_SCENE), 2)
        scene_start += scene["seconds"]
    cfg["words"] = new_words
    cfg["speechSpeed"] = speed
    cfg_path.write_text(json.dumps(cfg, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{args.name}: {length(1.0):.1f}s untrimmed -> {scene_start:.1f}s at {speed}x speed")


if __name__ == "__main__":
    main()
