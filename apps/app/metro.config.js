// Metro: the app links ../../packages/* with file: dependencies (not npm workspaces, so the live Vite
// app at the repo root keeps its own React). Watch those folders so edits there reload the app.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, "../../packages")];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];
module.exports = config;
