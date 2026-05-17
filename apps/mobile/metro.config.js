const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [
  path.resolve(workspaceRoot, "packages/shared"),
];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Exclude .mjs — some packages use import.meta in ESM builds which breaks Metro web.
// Packages fall back to their CJS .js entry points. Warnings are cosmetic only.
config.resolver.sourceExts = config.resolver.sourceExts.filter(ext => ext !== "mjs");

// Fix Windows file watcher issues
config.watcher = {
  ...config.watcher,
  watchman: false,
  healthCheck: {
    enabled: false,
  },
  watcherOptions: {
    poll: 1000,
  },
};

module.exports = config;
