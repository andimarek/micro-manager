var path = require('path');
var webpack = require('webpack');

module.exports = {
  target: 'node',
  entry: {
    mm:'./src/main',
    taskProcess: './src/tasks/taskProcess'
  },
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs',
    path: path.resolve(__dirname, 'dist')
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [{
      test: /\.ts$/,
      loader: 'awesome-typescript-loader'
    }]
  },
  externals: {
  },
  plugins: [
    // new webpack.IgnorePlugin(/data.json/),
    new webpack.BannerPlugin({banner: '#!/usr/bin/env node', raw: true })
  ],
};