const { withTamagui } = require("@tamagui/metro-config");
const { getDefaultConfig } = require("expo/metro-config");

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);
  return withTamagui(config, {
    config: "./tamagui.config.ts",
    components: ["tamagui"],
  });
})();
