// Saves a finished Marble world into the prototype and records it in places/worlds.json.
// node places/add-world.cjs <name> <door> "<match words|...>" <light .spz url> <full .spz url>   (run from prototypes/greybox)
const fs = require("fs"), { execFileSync } = require("child_process");
const [name, door, match, light, full] = process.argv.slice(2);
execFileSync("sh", ["places/get-world.sh", name, light, full], { stdio: "inherit" });
const id = light.split("/")[3];
const f = "places/worlds.json", w = JSON.parse(fs.readFileSync(f, "utf8")).filter((x) => x.world !== name);
w.push({ world: name, door, match, trip: "trip.html?w=" + name, marble: "https://marble.worldlabs.ai/world/" + id });
fs.writeFileSync(f, JSON.stringify(w, null, 1));
console.log(w.length + " worlds");
