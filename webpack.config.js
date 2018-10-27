/* global __dirname */

let path = require('path')

let webpack = require('webpack')
let HardSourceWebpackPlugin = require('hard-source-webpack-plugin')

module.exports = {
  entry: [ 'babel-polyfill', path.resolve(__dirname, 'src/main.js') ],
  output: {
    library: 'Crate',
    libraryTarget: 'umd',
    path: __dirname,
    filename: 'build/jquery-crate.bundle.js',
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [ 'stage-3' ],
            plugins: [
              [
                'babel-plugin-transform-builtin-extend',
                {
                  globals: [ 'Map' ]
                }
              ],
              [ 'add-module-exports' ],
              [ 'transform-es2015-parameters' ],
              [ 'transform-object-rest-spread' ],
              [ 'transform-es2015-destructuring' ],
              [ 'syntax-dynamic-import' ],
              [ 'transform-class-properties' ]
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
  plugins: [ new HardSourceWebpackPlugin() ],
  watch: true,
  // Create Sourcemaps for the bundle
  devtool: 'source-map',
  mode: 'development'
}
