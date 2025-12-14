module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [require.resolve("@tamagui/babel-plugin"), { config: "./tamagui.config.ts" }],
      "react-native-reanimated/plugin"
    ]
  };
};
