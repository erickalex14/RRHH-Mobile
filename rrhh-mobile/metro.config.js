const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Prefer CommonJS builds to avoid import.meta from some ESM packages (e.g. zustand)
config.resolver.unstable_enablePackageExports = false;
config.resolver.sourceExts = [...config.resolver.sourceExts, "cjs"];
config.resolver.extraNodeModules = {
	...(config.resolver.extraNodeModules || {}),
	zustand: path.resolve(__dirname, "node_modules", "zustand", "index.js")
};

module.exports = config;