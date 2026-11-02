# Paradigm Shift Core – Shorts template

Remotion template for @ParadigmShiftCore: images + voiceover script → cinematic vertical (1080x1920) YouTube Short, 45–50 s, built to loop seamlessly (no end card or progress bar by default).

## Make a new video
1. Put the Midjourney images in `public/videos/<name>/` (any ratio works; a blurred fill covers the rest).
2. Put the voiceover (ElevenLabs) in `public/videos/<name>/voice.mp3` and optional music in the same folder.
3. Copy `videos/example.json` to `videos/<name>.json` and edit:
   - `scenes`: one per image: `image`, `seconds`, `text` (caption), optional `highlight` (big number/word)
   - `voice`, `music`, `musicVolume` (default 0.25)
   - `words` (optional): word timestamps `{ "text", "startMs" }` from the voiceover; captions then follow the voice exactly instead of `text`
   - `hook` (optional): quiet on-screen title for the first 3 s
   - `accentColor` (default `#7FDBFF`), `cta` and `progressBar` (both off by default, they break the loop)
4. Preview: `npm run studio`
5. Render: `npm run render -- <name>` → `out/<name>.mp4`

## Voiceover with Edge TTS (free)
```
pip install edge-tts
python scripts/make_voice.py <name>            # default voice: en-US-AndrewMultilingualNeural
python scripts/make_voice.py <name> --voice en-US-GuyNeural --rate -5%
```
This speaks each scene's `text`, saves `public/videos/<name>/voice-<n>.mp3`, and fills in scene lengths and word timings in `videos/<name>.json`, so captions follow the voice word by word.
