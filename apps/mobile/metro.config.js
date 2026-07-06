const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  "@": path.resolve(__dirname, "src"),
  "@shared": path.resolve(__dirname, "../../shared"),
};

config.watchFolders = [
  ...config.watchFolders,
  path.resolve(__dirname, "../../shared"),
];

module.exports = config;
