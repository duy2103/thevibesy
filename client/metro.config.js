const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname, {
  isCSSEnabled: true
});

config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.sourceExts = [
  'js',
  'jsx',
  'json',
  'ts',
  'tsx',
  'cjs',
  'mjs'
];

config.resolver.assetExts = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'ttf',
  'otf',
  'woff',
  'woff2'
];

config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.resolver.enableSymlinks = true;

module.exports = withNativeWind(config, { input: './global.css' });