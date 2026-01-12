const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'],
  blockList: [
    /android\/app\/build\/.*/,
    /android\/build\/.*/,
    /\.gradle\/.*/,
  ],
};

// Exclude build directories from watching
config.watchFolders = [__dirname];
config.resolver.blacklistRE = /android\/app\/build\/.*|android\/build\/.*/;

module.exports = config;
