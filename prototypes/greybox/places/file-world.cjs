// Files a world downloaded under a temporary name (after checking it in the preview) and records it.
// node places/file-world.cjs <tmp name> <name> <door> "<match>" <marble world id>   (run from prototypes/greybox)
const fs = require("fs");
const [tmp, name, door, match, id] = process.argv.slice(2);
for (const s of ["-150k.spz", "-full.spz"]) fs.renameSync("art/trip/worlds/" + tmp + s, "art/trip/worlds/" + name + s);
const f = "places/worlds.json", w = JSON.parse(fs.readFileSync(f, "utf8")).filter((x) => x.world !== name);
w.push({ world: name, door, match, trip: "trip.html?w=" + name, marble: "https://marble.worldlabs.ai/world/" + id });
fs.writeFileSync(f, JSON.stringify(w, null, 1));
console.log(w.length + " worlds");
