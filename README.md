# Paradigm Shift Core – Shorts

Remotion template that turns images + a short script into a vertical (1080x1920) YouTube Short.

## Make a new video
1. Put images in `public/videos/<name>/` (any ratio works; it gets a blurred background fill).
2. Copy `videos/example.json` to `videos/<name>.json` and edit:
   - `hook`: the line shown in the first 2.5 s (most important for retention)
   - `scenes`: one per image: `image`, `text` (caption, shown word by word), `seconds`, optional `highlight`
   - `audio` (optional): mp3 path inside `public/`
   - `cta`: closing line
3. Preview: `npm run studio`
4. Render: `npm run render -- <name>` → `out/<name>.mp4`
