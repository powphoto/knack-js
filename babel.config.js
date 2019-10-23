/* eslint-env node */
'use strict;'

module.exports = {
  presets: [
    ['@babel/preset-env', {
      modules: false,
      targets: {
        esmodules: true
      },
      // https://github.com/babel/babel/issues/6629
      // https://github.com/babel/babel/issues/10008
      //useBuiltIns: 'runtime|pure'
    }]
  ],
  plugins: [
    ['@babel/plugin-proposal-numeric-separator'],
    ['@babel/plugin-transform-runtime', {
      corejs: {
        version: 3,
        proposals: true
      },
      useESModules: true
    }],
    ['lodash']
  ]
};
