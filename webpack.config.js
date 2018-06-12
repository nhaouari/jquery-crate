/* global __dirname */

var path = require('path');

var webpack = require('webpack');


module.exports = {
    entry: path.resolve(__dirname, 'src/index.js'),
    output: {
        path: __dirname,
        filename: 'build/jquery-crate.bundle.js'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: {
            loader: "babel-loader",
            options: { presets: ["es2015"] }
          }
        }
      ]
      },
    stats: {
        // Nice colored output
        colors: true
    },
    // Create Sourcemaps for the bundle
    devtool: 'source-map',
    target:'node'
};