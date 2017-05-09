'use strict';

var fs = require('fs');
var path = require('path');
var PackageLoadersPlugin = require('webpack-package-loaders-plugin');
var IntrospectablePlugin = require('./introspection/plugin');
var paths = require('../paths');

var BABEL_PRESET = require.resolve('babel-preset-prometheusresearch');
var INTROSPECTION_LOADER = require.resolve('./introspection/loader');

var entry = [];
var watchDirectories = [];

// Add dependencies with rex.bundleAll.
var nodeModules = fs.readdirSync(paths.appNodeModules);
nodeModules.forEach(pkgName => {
  var pkgFilename = path.join(paths.appNodeModules, pkgName, 'package.json');
  if (!fs.existsSync(pkgFilename)) {
    return;
  }
  var pkg = JSON.parse(fs.readFileSync(pkgFilename, 'utf8'));
  if (pkg.rex && pkg.rex.bundleAll) {
    entry.push(makeIntrospectableEntry(pkgName, pkgName));
  }

  // Check if some lib/ or src/ directories were symlinked into
  // node_modiles/pkgName. In that case we need to start watching them.
  ['lib', 'src'].forEach(p => {
    p = path.join(paths.appNodeModules, pkgName, p);
    if (fs.existsSync(p) && fs.lstatSync(p).isSymbolicLink()) {
      watchDirectories.push(fs.realpathSync(p));
    }
  });
});

// Add self if rex.bundleAll
var pkg = JSON.parse(fs.readFileSync(paths.appPackageJson, 'utf8'));
if (pkg.rex && pkg.rex.bundleAll) {
  entry.push(makeIntrospectableEntry(paths.appIndexJs, pkg.name));
}

function makeIntrospectableEntry(entry, name) {
  var loaderParams = JSON.stringify({ name: name });
  return `${INTROSPECTION_LOADER}?${loaderParams}!${entry}`;
}

function injectDefaultLoaders(packageMeta) {
  if (packageMeta.rex !== undefined && packageMeta.rex.loaders === undefined) {
    // skip default inject for the root package as it reuses the config from
    // webpack.config.js
    if (packageMeta.name === pkg.name) {
      return [];
    }
    if (!packageMeta.rex.forceBabel5) {
      return [
        {
          test: /\.js$/,
          loader: `babel-loader?presets[]=${BABEL_PRESET}&babelrc=false&cacheDirectory=true`,
          exclude: /vendor/,
        },
      ];
    } else {
      return [
        {
          test: /\.js$/,
          loader: 'babel-loader?stage=0',
          exclude: /vendor/,
        },
      ];
    }
  } else {
    return [];
  }
}

class WatchDirectoriesPlugin {
  constructor(watchDirectories) {
    this.watchDirectories = watchDirectories;
  }

  apply(compiler) {
    compiler.plugin('emit', (compilation, callback) => {
      this.watchDirectories.forEach(path => {
        compilation.contextDependencies.push(path);
      });
      callback();
    });
  }
}

// Prometheus specific webpack plugins
var plugins = [
  new WatchDirectoriesPlugin(watchDirectories),
  // Plugin which allows to require packages by its name at runtime via
  // __require__(packageName) function.
  new IntrospectablePlugin(),
  // Allow packages to configure additional loaders via "rex.loaders" key in
  // package.json. Also inject babel-loader for packages with "rex" key defined.
  new PackageLoadersPlugin({
    packageMeta: ['package.json'],
    loadersKeyPath: ['rex', 'loaders'],
    injectLoaders: injectDefaultLoaders,
  }),
];

module.exports = {
  plugins: plugins,
  entry: entry,
};
