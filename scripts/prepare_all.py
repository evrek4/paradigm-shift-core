"""One command to get every video ready on this PC, then push to GitHub for rendering.

Usage (from the repo folder):
    python scripts/prepare_all.py "C:\\Users\\urfa\\Desktop\\Paradigm"

1. Finds each video's images in that folder (zip files or subfolders), matches them to a
   video by number or name, and copies the images (sorted by their leading number, e.g. G1..G8)
   to the paths the video config expects. Videos that already have all images are skipped.
2. Generates the Edge TTS voiceover + word timings for every video (scripts/make_voice.py).
3. Commits and pushes the result.
It prints what it matched; anything it could not match is listed so you can fix it by hand.
"""
import asyncio
import json
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMG_EXT = {".jpg", ".jpeg", ".png", ".webp"}
STOP = {"the", "a", "of", "to", "is", "it", "in", "and", "your", "you", "visuals", "images", "video", "first", "s"}


def tokens(text):
    return {t for t in re.split(r"[^a-z0-9]+", text.lower()) if t and t not in STOP and not t.isdigit()}


def leading_number(p: Path):
    m = re.match(r"\D*?(\d+)", p.stem)
    return (int(m.group(1)) if m else 999, p.name.lower())


def needed_images(video):
    """Image paths (relative to public/) the video config uses, in shot order."""
    cfg = json.loads((ROOT / "videos" / f"{video}.json").read_text(encoding="utf-8"))
    out = []
    for sc in cfg["scenes"]:
        out += [sc["image"], *sc.get("images", [])]
    return out


def has_images(video):
    return all((ROOT / "public" / p).exists() for p in needed_images(video))


def video_keys():
    out = {}
    for cfg in sorted((ROOT / "videos").glob("[0-9][0-9]-*.json")):
        data = json.loads(cfg.read_text(encoding="utf-8"))
        out[cfg.stem] = tokens(cfg.stem) | tokens(data.get("title", ""))
    return out


def sources(folder: Path):
    for p in sorted(folder.iterdir()):
        if p.suffix.lower() == ".zip" or p.is_dir():
            yield p


def images_in(src: Path, tmp: Path):
    if src.suffix.lower() == ".zip":
        dest = tmp / src.stem
        with zipfile.ZipFile(src) as z:
            z.extractall(dest)
        src = dest
    files = [p for p in src.rglob("*") if p.suffix.lower() in IMG_EXT and not p.name.startswith(".")]
    return sorted(files, key=leading_number)


def import_images(folder: Path):
    keys = video_keys()
    todo = {v for v in keys if not has_images(v)}
    print(f"Videos needing images: {sorted(todo) or 'none'}")
    unmatched = []
    with tempfile.TemporaryDirectory() as t:
        tmp = Path(t)
        for src in sources(folder):
            # Leading number in the source name (e.g. "02_model_collapse") wins, then word overlap
            num = re.match(r"(\d{1,2})\D", src.name + " ")
            best = None
            if num:
                best = next((v for v in todo if v.startswith(f"{int(num.group(1)):02d}-")), None)
            if not best:
                score = {v: len(tokens(src.stem) & keys[v]) for v in todo}
                cand = sorted(score.items(), key=lambda kv: -kv[1])
                if cand and cand[0][1] >= 2 and (len(cand) == 1 or cand[0][1] > cand[1][1]):
                    best = cand[0][0]
            if not best:
                unmatched.append(src.name)
                continue
            imgs = images_in(src, tmp)
            targets = needed_images(best)
            if len(imgs) < len(targets):
                print(f"  {src.name}: only {len(imgs)} of {len(targets)} images, skipped")
                unmatched.append(src.name)
                continue
            for img, target in zip(imgs, targets):
                dest = ROOT / "public" / target
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(img, dest)
                print(f"  {target} <- {src.name}/{img.name}")
            todo.discard(best)
    if unmatched:
        print(f"Not matched: {unmatched}")
    if todo:
        print(f"Still missing images: {sorted(todo)}")


def main():
    if len(sys.argv) < 2:
        sys.exit('Usage: python scripts/prepare_all.py "C:\\Users\\urfa\\Desktop\\Paradigm"')
    folder = Path(sys.argv[1])
    subprocess.run(["git", "pull", "origin", "claude/project-thread-ykf6hd"], cwd=ROOT, check=True)

    import_images(folder)

    sys.path.insert(0, str(ROOT / "scripts"))
    import make_voice

    for cfg in sorted((ROOT / "videos").glob("[0-9][0-9]-*.json")):
        if json.loads(cfg.read_text(encoding="utf-8")).get("words"):
            continue  # voice already made
        print(f"\n== voice: {cfg.stem}")
        sys.argv = ["make_voice.py", cfg.stem]
        asyncio.run(make_voice.main())

    subprocess.run(["git", "add", "public/videos", "videos"], cwd=ROOT, check=True)
    subprocess.run(
        ["git", "-c", "user.name=evrek4", "-c", "user.email=304660644+evrek4@users.noreply.github.com",
         "commit", "-m", "Add images and Edge TTS voiceovers"],
        cwd=ROOT,
    )
    subprocess.run(["git", "push", "origin", "HEAD"], cwd=ROOT, check=True)
    print("\nDone. Pushed to GitHub.")


if __name__ == "__main__":
    main()
