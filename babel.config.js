/* eslint-env node */
'use strict;'

module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        esmodules: true
      }
    }]
  ],
  plugins: [
    ['@babel/plugin-proposal-numeric-separator'],
    ['@babel/plugin-transform-runtime', {
      corejs: {
        version: 3,
      },
      useESModules: true
    }]
  ]
};
