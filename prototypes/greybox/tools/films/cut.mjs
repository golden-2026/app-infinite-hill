// cut.mjs <edit.json> <out.mp4>: builds each card as a 720x1280 30fps segment (clip/still/finn/black + caption png), concats, lays the beat under it
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
const here = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, "$1");
const edit = JSON.parse(fs.readFileSync(process.argv[2], "utf8")), out = process.argv[3];
const ART = path.join(here, "..", "..", "art") + "/"; // prototypes/greybox/art/
const segDir = path.join(here, "seg"); fs.rmSync(segDir, { recursive: true, force: true }); fs.mkdirSync(segDir);
const ff = (args) => execFileSync("ffmpeg", ["-y", "-v", "error", ...args], { stdio: "inherit" });
const list = [];
for (const [k, c] of edit.cards.entries()) {
  const seg = path.join(segDir, `s${String(k).padStart(2, "0")}.mp4`), d = c.d, fr = Math.round(d * 30);
  const cap = path.join(here, "caps", `cap-${String(k).padStart(2, "0")}.png`), hasCap = fs.existsSync(cap) && c.text;
  const z = c.zoom ?? 0.06; // punch-in amount over the shot
  const zoom = `scale=900:1600,zoompan=z='1+${z}*on/${fr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=720x1280:fps=30`;
  const grade = c.grade === false ? "" : ",eq=contrast=1.12:saturation=1.05:brightness=-0.02";
  const shake = c.shake ? `,crop=720-24:1280-42:12+12*sin(n*2.1):21+21*cos(n*1.7),scale=720:1280` : "";
  const flash = c.flash ? `,fade=t=in:st=0:d=0.12:color=white` : "";
  let inputs, base;
  if (c.src === "black") { inputs = ["-f", "lavfi", "-i", `color=c=0x0A0A0A:s=720x1280:r=30:d=${d}`]; base = "[0:v]null"; }
  else if (c.src.startsWith("lime:")) { inputs = ["-f", "lavfi", "-i", `color=c=0xEEFF6A:s=720x1280:r=30:d=${d}`, "-loop", "1", "-t", String(d), "-i", ART + c.src.slice(5)]; base = `[1:v]scale=${c.finnW || 640}:-1,format=rgba[f];[0:v][f]overlay=(W-w)/2:${c.finnY ?? 300}:shortest=1,scale=900:1600,zoompan=z='1+0.05*on/${fr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=720x1280:fps=30`; }
  else if (/\.(webp|png|jpg)$/.test(c.src)) { inputs = ["-loop", "1", "-t", String(d), "-i", ART + c.src]; base = `[0:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,${zoom}${grade}`; }
  else { inputs = ["-ss", String(c.ss || 0), "-t", String(d), "-i", ART + c.src]; base = `[0:v]fps=30,scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280${c.speed ? `,setpts=PTS/${c.speed}` : ""},tpad=stop_mode=clone:stop_duration=4,trim=duration=${d},setpts=PTS-STARTPTS,${zoom.replace("scale=900:1600,", "scale=900:1600,")}${grade}`; }
  let fc = base + shake + flash + ",format=yuv420p";
  const ins = [...inputs];
  if (hasCap) { ins.push("-loop", "1", "-t", String(d), "-i", cap); const ci = c.src === "black" ? 1 : c.src.startsWith("lime:") ? 2 : 1; fc = `${base}${shake}${flash}[v];[${ci}:v]scale=720:1280,format=rgba${c.capFade === false ? "" : ",fade=t=in:st=0:d=0.08:alpha=1"}[c];[v][c]overlay=0:0,format=yuv420p`; }
  ff([...ins, "-filter_complex", fc + `,trim=end_frame=${fr}`, "-frames:v", String(fr), "-r", "30", "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", seg]);
  list.push(`file '${seg.replace(/\\/g, "/")}'`);
}
fs.writeFileSync(path.join(segDir, "list.txt"), list.join("\n"));
ff(["-f", "concat", "-safe", "0", "-i", path.join(segDir, "list.txt"), "-i", path.join(here, edit.audio || "beat.wav"), "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out]);
console.log("wrote", out);
