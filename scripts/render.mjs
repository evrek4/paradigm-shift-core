// Usage: npm run render -- <video-name>
// Reads videos/<video-name>.json and writes out/<video-name>.mp4
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const name = process.argv[2];
if (!name) {
  console.error("Usage: npm run render -- <video-name>  (e.g. example)");
  process.exit(1);
}
const props = `videos/${name}.json`;
if (!existsSync(props)) {
  console.error(`Not found: ${props}`);
  process.exit(1);
}
execSync(`npx remotion render src/index.ts Short out/${name}.mp4 --props=${props}`, {
  stdio: "inherit",
});
