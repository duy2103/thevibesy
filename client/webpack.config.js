const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');
const webpack = require('webpack');

module.exports = async function (env, argv) {
  // Set web platform
  env.platform = 'web';

  const config = await createExpoWebpackConfigAsync({
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: ['@rneui/themed']
    }
  }, argv);

  // Add CSS loader configuration
  config.module.rules.push({
    test: /\.css$/,
    use: ['style-loader', 'css-loader']
  });

  // Add file loader for Leaflet marker images
  config.module.rules.push({
    test: /\.(png|jpe?g|gif|svg)$/i,
    type: 'asset/resource'
  });

  // Configure module resolution
  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve.alias,
      'react-native$': 'react-native-web',
    },
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
    ],
    fallback: {
      ...config.resolve.fallback,
      'react-native': 'react-native-web'
    }
  };

  // Add environment variables
  config.plugins = config.plugins || [];
  config.plugins.push(
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    })
  );

  // Completely ignore react-native-maps for web
  config.plugins.push(
    new webpack.IgnorePlugin({
      resourceRegExp: /^react-native-maps$/,
    })
  );

  return config;
}; 