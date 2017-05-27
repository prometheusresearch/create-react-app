'use strict';

var fs = require('fs');
var path = require('path');
var PackageLoadersPlugin = require('webpack-package-loaders-plugin');
var DeactivateResultSymlinkPlugin = require('./DeactivateResultSymlinkPlugin');
var IntrospectablePlugin = require('./introspection/plugin');
var paths = require('../paths');

var BABEL_PRESET = require.resolve('babel-preset-prometheusresearch');
var INTROSPECTION_LOADER = require.resolve('./introspection/loader');

var pkg = JSON.parse(fs.readFileSync(paths.appPackageJson, 'utf8'));

var entry = [];

if (pkg && pkg.rex && pkg.rex.style) {
  entry.push(path.join(cwd, pkg.rex.style));
} else if (pkg.styleEntry) {
  entry.push(path.join(cwd, pkg.styleEntry));
} else {
  var indexLess = path.join(path.dirname(paths.appPackageJson), 'style', 'index.less');
  if (fs.existsSync(indexLess)) {
    entry.push(indexLess);
  }
}

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
});

// Add self if rex.bundleAll
if (pkg.rex && pkg.rex.bundleAll) {
  entry.push(makeIntrospectableEntry(paths.appIndexJs, pkg.name));
}

function makeIntrospectableEntry(entry, name) {
  var loaderParams = JSON.stringify({name: name});
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
        }
      ];
    } else {
      return [
        {
          test: /\.js$/,
          loader: 'babel-loader?stage=0',
          exclude: /vendor/,
        }
      ];
    }
  } else {
    return [];
  }
}

// Prometheus specific webpack plugins
var plugins = [
  // Due to how we symlink dev dependencies we need to deactive symlink
  // resolution. Newer webpack has it as an option but until we are upgraded we
  // need to sue this plugin.
  new DeactivateResultSymlinkPlugin(),
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
