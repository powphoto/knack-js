/* eslint-env node */
'use strict;'

const
  LodashModuleReplacementPlugin = require('lodash-webpack-plugin'),
  MomentLocalesPlugin = require('moment-locales-webpack-plugin'),
  MomentTimezoneDataPlugin = require('moment-timezone-data-webpack-plugin'),
  TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const mode = argv.mode || process.env.NODE_ENV || 'development';

  return {
    devServer: {
      allowedHosts: [
        '.knack.com'
      ],
      contentBase: false,
      compress: true,
      host: 'localhost',
      port: process.env.npm_package_config_devServer_port
    },
    devtool: {
      development: 'eval-source-map'
    }[mode],
    externals: {
      jquery: '$'
    },
    mode,
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: ['babel-loader', 'eslint-loader']
        }
      ]
    },
    output: {
      library: process.env.npm_package_browser
    },
    optimization: {
      minimizer: [
        new TerserPlugin({
          sourceMap: true
        })
      ]
    },
    plugins: [
      new LodashModuleReplacementPlugin({
        collections: true,
        paths: true
      }),
      new MomentLocalesPlugin(),
      new MomentTimezoneDataPlugin({
        matchZones: [/^America\//, 'Etc/UTC'],
        startYear: 2000,
        endYear: new Date().getFullYear() + 5
      })
    ],
    target: 'web'
  };
};
