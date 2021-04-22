// NOTE: To use this example standalone (e.g. outside of deck.gl repo)
// delete the local development overrides at the bottom of this file
const { join, resolve } = require('path');
module.exports = {
  mode: 'development',
  entry: {
    app: './app.js'
  },
  output: {
    library: 'App'
  },
  // stats:'verbose',
  resolve: {
    alias: {
      '@mapbox/martini':resolve(__dirname, 'martini/')
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  module: {
    rules: [
      {
        // Transpile ES6 to ES5 with babel
        // Remove if your app does not use JSX or you don't need to support old browsers
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: [/node_modules/],
        options: {
          presets: ['@babel/preset-react']
        }
      }
    ]
  }
};
