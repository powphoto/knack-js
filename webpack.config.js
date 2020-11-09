/* eslint-env node */
'use strict;'

const
  CompressionPlugin = require('compression-webpack-plugin'),
  ESLintPlugin = require('eslint-webpack-plugin'),
  LodashModuleReplacementPlugin = require('lodash-webpack-plugin'),
  MomentLocalesPlugin = require('moment-locales-webpack-plugin'),
  MomentTimezoneDataPlugin = require('moment-timezone-data-webpack-plugin'),
  TerserPlugin = require('terser-webpack-plugin');

const CURRENT_YEAR = new Date().getFullYear();

module.exports = (env, argv) => {
  const mode = argv.mode || process.env.NODE_ENV || 'development';

  return {
    devServer: {
      allowedHosts: [
        '.knack.com'
      ],
      contentBase: false,
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
          use: ['babel-loader']
        }
      ]
    },
    output: {
      library: process.env.npm_package_browser
    },
    optimization: {
      minimizer: [
        new TerserPlugin()
      ]
    },
    plugins: [
      new ESLintPlugin({
      }),
      new LodashModuleReplacementPlugin({
        paths: true
      }),
      new MomentLocalesPlugin({
        localesToKeep: process.env.npm_package_config_moment_localesToKeep.split(',')
      }),
      new MomentTimezoneDataPlugin({
        matchZones: ['Etc/UTC', new RegExp(process.env.npm_package_config_moment_matchZones)],
        startYear: (CURRENT_YEAR + parseInt(process.env.npm_package_config_moment_startYearOffset, 10)),
        endYear: (CURRENT_YEAR + parseInt(process.env.npm_package_config_moment_endYearOffset, 10))
      })
    ].concat(mode !== 'production' ? [] : [
      new CompressionPlugin({
        compressionOptions: {
          level: 5
        },
        deleteOriginalAssets: true,
        minRatio: 1
      })
    ]),
    target: 'web'
  };
};
