/* global __dirname */

var path = require('path');

var webpack = require('webpack');
var HardSourceWebpackPlugin = require('hard-source-webpack-plugin');


module.exports = {
    entry: [ "babel-polyfill",path.resolve(__dirname, 'src/index.js')],
    output: {
        path: __dirname,
        library: 'session',   
        filename: 'build/jquery-crate.bundle.js',
        publicPath: '/'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: {
            loader: "babel-loader",
            options: { 
                presets: ["stage-3"],
                plugins: [
                  ["babel-plugin-transform-builtin-extend", {
                      "globals": ["Map"]
                  }],
                  ["syntax-dynamic-import"],
                  ["transform-class-properties"]
              ]
                }
          }
        }
      ]
      },
    stats: {
        // Nice colored output
        colors: true
    },
    plugins: [
      new HardSourceWebpackPlugin()
    ],
    watch:true,
    // Create Sourcemaps for the bundle
    devtool: 'source-map',
    mode:'development'
};